// Plantillas ágiles (src/14-templates-agile.js, SPEC §9.5) y su presentación en 20-docs.
// Uso: node test/templates-agile.test.mjs --file <ruta.html> [--shots dir]
//  1. Definiciones: ids, proceso, área, grupo, kind, múltiple y claves fijas de §9.5 (tipos, opciones y columnas);
//     compatibilidad con los valores que prellena 46-agile-sprints y con el registro de lecciones aprendidas.
//  2. PM.newDocBody: valores iniciales (ficha del proyecto, listas por defecto, filas de columnas del tablero).
//  3. Ejemplos coherentes (ERP): sumas de compromiso y terminado, releases encadenados, columnas calculadas.
//  4. Editor: abre cada plantilla (las múltiples con PM.navigate('documento', {template})) sin errores y con
//     todas sus secciones, campos y columnas; el ejemplo guardado llena los campos; edición real con teclado.
//  5. Solo lectura: sin controles de edición. 6. Mapa de procesos: salida «Ágil», consideraciones del área
//     (plegables y operables con teclado), botones hacia vistas y plantillas. 7. Tema oscuro y 400 px.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0, passes = 0;
const check = (cond, msg, extra) => { if (cond) { passes++; console.log('  ok   ' + msg); } else { failures++; console.log('  FAIL ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra).slice(0, 600) : '')); } };
const step = (name) => console.log('\n# ' + name);
const shot = async (page, name, full = true) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: full }); };

const IDS = ['vision-producto', 'definicion-terminado', 'plan-release', 'planificacion-sprint', 'acta-revision-sprint', 'retrospectiva'];
const MULTI = ['planificacion-sprint', 'acta-revision-sprint', 'retrospectiva'];
/* SPEC §9.5: proceso, área, grupo, kind, múltiple y claves fijas.
   Tipo de campo: 'list' | 'textarea' | 'number' | 'money' | 'date' | 'text' | '*' (cualquier campo simple)
   | ['select', opciones] | ['table', {columna: tipo}] */
const SPEC = {
  'vision-producto': ['5.2', 'alcance', 'inicio', 'documento', false, {
    producto: '*', paraQuien: '*', necesidad: '*', categoria: '*', beneficioClave: '*', alternativas: '*', diferenciador: '*',
    objetivosNegocio: 'list', metricasExito: ['table', { metrica: '*', lineaBase: '*', meta: '*', fecha: 'date' }],
    personas: ['table', { persona: '*', descripcion: '*', necesidades: '*' }], restricciones: 'list',
  }],
  'definicion-terminado': ['8.1', 'calidad', 'planificacion', 'documento', false, {
    definicionListo: 'list', definicionTerminado: 'list', criteriosRelease: 'list', politicasFlujo: 'list',
  }],
  'plan-release': ['6.5', 'cronograma', 'planificacion', 'plan', false, {
    visionResumen: 'textarea', velocidadSupuesta: 'number', duracionIteracion: 'number',
    releases: ['table', { release: '*', objetivo: '*', fechaInicio: 'date', fechaFin: 'date', iteraciones: 'number', puntos: 'number', presupuesto: 'money', alcance: 'textarea' }],
    supuestos: 'list',
  }],
  'planificacion-sprint': ['4.3', 'integracion', 'ejecucion', 'acta', true, {
    iteracion: '*', release: '*', fechaInicio: 'date', fechaFin: 'date', objetivo: '*', capacidad: 'number', velocidadReferencia: 'number', compromiso: 'number',
    elementos: ['table', { codigo: '*', titulo: '*', tipo: '*', estimacion: 'number', responsable: '*', criterios: '*' }],
    riesgos: 'textarea', participantes: 'list',
  }],
  'acta-revision-sprint': ['5.5', 'alcance', 'monitoreo', 'acta', true, {
    iteracion: '*', fecha: 'date', objetivo: '*', objetivoCumplido: ['select', ['Sí', 'Parcialmente', 'No']], comprometido: 'number', terminado: 'number',
    elementos: ['table', { codigo: '*', titulo: '*', estimacion: 'number', resultado: ['select', ['Aceptado', 'Rechazado', 'No terminado']], observaciones: '*' }],
    retroalimentacion: 'textarea', cambiosBacklog: 'textarea', asistentes: 'list',
  }],
  retrospectiva: ['4.4', 'integracion', 'ejecucion', 'acta', true, {
    iteracion: '*', fecha: 'date', formato: ['select', ['Bien, mejorar y acciones', 'Empezar, dejar y continuar', '4L']], queFueBien: 'list', queMejorar: 'list',
    acciones: ['table', { accion: '*', responsable: '*', fechaObjetivo: 'date', estado: ['select', ['Pendiente', 'En curso', 'Hecha']] }],
    lecciones: ['table', { situacion: '*', impacto: ['select', ['Positivo', 'Negativo']], recomendacion: '*' }],
  }],
};

const { browser, page, errors } = await openApp({ file });
try {
  /* ============================================================== 1–3. definiciones */
  step('Definiciones (SPEC §9.5)');
  const def = await page.evaluate(({ IDS, SPEC }) => {
    const out = [];
    const ok = (name, cond, detail) => out.push({ name, ok: !!cond, detail: cond ? undefined : detail });
    const opts = (o) => (o || []).map((x) => (x && typeof x === 'object' ? String(x.value) : String(x)));
    const typeOk = (want, f) => {
      if (Array.isArray(want)) {
        if (want[0] === 'select') return f.type === 'select' && JSON.stringify(opts(f.options)) === JSON.stringify(want[1]);
        return false;
      }
      if (want === '*') return f.type !== 'table' && f.type !== 'list';
      return f.type === want;
    };
    for (const id of IDS) {
      const t = PM.templates[id];
      if (!t) { ok(id + ': registrada', false, 'no existe'); continue; }
      const [proc, area, group, kind, multiple, keys] = SPEC[id];
      ok(id + ': proceso, área, grupo, kind y múltiple', t.process === proc && t.area === area && t.group === group && t.kind === kind && !!t.multiple === multiple && (t.processes || []).includes(proc), [t.process, t.area, t.group, t.kind, t.multiple]);
      ok(id + ': marcada como ágil (ejemplo ERP)', t.agile === true && t.exampleProject === 'erp');
      ok(id + ': abreviatura de 2 a 4 letras, propósito y 2–4 consejos', /^[A-Z]{2,4}$/.test(t.abbr) && t.purpose.length > 80 && t.tips.length >= 2 && t.tips.length <= 4, [t.abbr, t.tips.length]);
      const fields = t.sections.flatMap((s) => s.fields);
      const byKey = new Map(fields.map((f) => [f.key, f]));
      const bad = [];
      for (const [k, want] of Object.entries(keys)) {
        const f = byKey.get(k);
        if (!f) { bad.push('falta ' + k); continue; }
        if (Array.isArray(want) && want[0] === 'table') {
          if (f.type !== 'table') { bad.push(k + ' no es tabla'); continue; }
          for (const [ck, cw] of Object.entries(want[1])) {
            const c = f.columns.find((x) => x.key === ck);
            if (!c) bad.push(k + '.' + ck + ' falta');
            else if (!typeOk(cw, c) || c.type === 'calc') bad.push(k + '.' + ck + ' tipo ' + c.type + (c.options ? ' ' + JSON.stringify(opts(c.options)) : ''));
          }
        } else if (!typeOk(want, f)) bad.push(k + ' tipo ' + f.type + (f.options ? ' ' + JSON.stringify(opts(f.options)) : ''));
      }
      ok(id + ': claves fijas con su tipo (' + Object.keys(keys).length + ')', !bad.length, bad);
      ok(id + ': todos los campos con pista o etiqueta descriptiva', fields.every((f) => f.label && (f.hint || f.type === 'date' || f.from || f.label.length > 12)), fields.filter((f) => !(f.hint || f.type === 'date' || f.from || f.label.length > 12)).map((f) => f.key));
      const tablesWithAdd = fields.filter((f) => f.type === 'table');
      ok(id + ': las tablas tienen texto propio para agregar filas', tablesWithAdd.every((f) => f.addLabel && f.addLabel !== 'Agregar elemento'), tablesWithAdd.map((f) => f.addLabel));
      const ex = t.example || {};
      ok(id + ': el ejemplo llena todas las claves fijas', Object.keys(keys).every((k) => ex[k] !== undefined && ex[k] !== '' && !(Array.isArray(ex[k]) && !ex[k].length)), Object.keys(keys).filter((k) => ex[k] === undefined || ex[k] === ''));
      ok(id + ': el ejemplo se identifica como tal y usa roles', !/\b(Juan|María|Pedro|Carlos|Ana|Luis)\b/.test(JSON.stringify(ex)), '');
      /* PM.newDocBody */
      let body = null, err = null;
      try { body = PM.newDocBody(t, { id: 'p1', name: 'Proyecto', sponsor: 'Gerencia General', start: '2026-07-06' }, { template: id }); } catch (e) { err = String(e); }
      ok(id + ': PM.newDocBody funciona', body && !err && body.template === id && body.status === 'borrador' && body.rev === null && body.fields && typeof body.fields === 'object' && body.title === t.name, err || body);
    }
    /* valores iniciales */
    const vb = PM.newDocBody(PM.templates['vision-producto'], { sponsor: 'Gerencia General' }, {});
    ok('visión del producto: el patrocinador sale de la ficha del proyecto', vb.fields.patrocinador === 'Gerencia General', vb.fields);
    const db = PM.newDocBody(PM.templates['definicion-terminado'], {}, {});
    ok('definición de terminado: listas iniciales de listo, terminado y políticas del flujo', db.fields.definicionListo.length >= 4 && db.fields.definicionTerminado.length >= 4 && db.fields.politicasFlujo.length >= 3, db.fields);
    const cols = db.fields.columnasTablero || [];
    const dc = PM.AGILE.DEFAULT_COLUMNS;
    ok('definición de terminado: columnas del tablero iniciales = columnas por defecto del núcleo (nombre y WIP)', cols.length === dc.length && cols.every((r, i) => r.id && r.columna === dc[i].name && (r.wip ?? null) === dc[i].wip), cols);
    const db2 = PM.newDocBody(PM.templates['definicion-terminado'], {}, {});
    ok('newDocBody: listas clonadas (no comparten la referencia de la plantilla)', db2.fields.definicionListo !== db.fields.definicionListo && db.fields.definicionListo !== PM.templates['definicion-terminado'].sections[1].fields[0].default, '');
    /* compatibilidad con 46-agile-sprints y con el registro de lecciones */
    const colOf = (tid, fk, ck) => PM.templates[tid].sections.flatMap((s) => s.fields).find((f) => f.key === fk).columns.find((c) => c.key === ck);
    const tipoOpts = opts(colOf('planificacion-sprint', 'elementos', 'tipo').options);
    ok('planificación: el tipo acepta las etiquetas de PM.AGILE.ITEM_TYPES (prellenado de 46)', PM.AGILE.ITEM_TYPES.every((x) => tipoOpts.includes(x.label)), tipoOpts);
    const reg = PM.templates['registro-lecciones'];
    if (reg) {
      const regCols = reg.sections.flatMap((s) => s.fields).find((f) => f.key === 'lecciones').columns;
      const imp = regCols.find((c) => c.key === 'impacto');
      ok('retrospectiva → registro de lecciones: columnas situacion, impacto y recomendacion compatibles', ['situacion', 'impacto', 'recomendacion'].every((k) => regCols.some((c) => c.key === k)) && JSON.stringify(opts(imp.options)) === JSON.stringify(opts(colOf('retrospectiva', 'lecciones', 'impacto').options)), regCols.map((c) => c.key));
    }
    ok('retrospectiva: una acción nueva empieza «Pendiente»', colOf('retrospectiva', 'acciones', 'estado').default === 'Pendiente');
    /* coherencia de los ejemplos (ERP) */
    const ex = (id) => PM.templates[id].example;
    const sum = (rows, k) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    const ps = ex('planificacion-sprint'), ar = ex('acta-revision-sprint'), rt = ex('retrospectiva'), pr = ex('plan-release');
    ok('planificación: compromiso = Σ estimaciones y ≤ capacidad', ps.compromiso === sum(ps.elementos, 'estimacion') && ps.compromiso <= ps.capacidad, [ps.compromiso, sum(ps.elementos, 'estimacion'), ps.capacidad]);
    ok('revisión: terminado = Σ aceptados y comprometido = compromiso de la planificación', ar.terminado === sum(ar.elementos.filter((r) => r.resultado === 'Aceptado'), 'estimacion') && ar.comprometido === ps.compromiso, [ar.terminado, ar.comprometido]);
    ok('revisión: mismos elementos que la planificación', JSON.stringify(ar.elementos.map((r) => r.codigo)) === JSON.stringify(ps.elementos.map((r) => r.codigo)), '');
    ok('revisión: objetivo «Parcialmente» con un elemento rechazado', ar.objetivoCumplido === 'Parcialmente' && ar.elementos.some((r) => r.resultado === 'Rechazado'), '');
    ok('misma iteración en planificación, revisión y retrospectiva', ps.iteracion === ar.iteracion && ar.iteracion === rt.iteracion && ar.fecha === ps.fechaFin && rt.fecha === ar.fecha, [ps.iteracion, ar.fecha, rt.fecha]);
    ok('la planificación pertenece al release 2 del plan de releases', ps.release === pr.releases[1].release && ps.fechaInicio >= pr.releases[1].fechaInicio && ps.fechaFin <= pr.releases[1].fechaFin, ps.release);
    ok('plan de releases: releases encadenados y fechas válidas', pr.releases.every((r, i) => PM.date.valid(r.fechaInicio) && PM.date.valid(r.fechaFin) && r.fechaFin > r.fechaInicio && (!i || r.fechaInicio > pr.releases[i - 1].fechaFin)), pr.releases.map((r) => [r.fechaInicio, r.fechaFin]));
    ok('plan de releases: 11 iteraciones de 10 días hábiles y velocidad supuesta de 30', sum(pr.releases, 'iteraciones') === 11 && pr.duracionIteracion === 10 && pr.velocidadSupuesta === 30, '');
    const relField = PM.templates['plan-release'].sections.flatMap((s) => s.fields).find((f) => f.key === 'releases');
    const calcOf = (k) => relField.columns.find((c) => c.key === k);
    ok('plan de releases: «Por iteración» y «Costo por punto» calculados', calcOf('porIteracion').calc(pr.releases[0], pr.releases) === 29.5 && calcOf('costoPunto').calc(pr.releases[0], pr.releases) === Math.round(96000000 / 118), [calcOf('porIteracion').calc(pr.releases[0]), calcOf('costoPunto').calc(pr.releases[0])]);
    ok('columnas calculadas toleran filas vacías', calcOf('porIteracion').calc({}, []) === null && calcOf('costoPunto').calc({ puntos: 0, presupuesto: 5 }, []) === null && calcOf('costoPunto').format(null) === '—', '');
    ok('revisión: el alcance del release 2 sube dentro del umbral de ±10 %', /112 a 120 puntos \(\+7,1 %\)/.test(ar.cambiosBacklog) && pr.releases[1].puntos === 112, ar.cambiosBacklog);
    ok('retrospectiva: 1 a 3 acciones con responsable y fecha', rt.acciones.length >= 1 && rt.acciones.length <= 3 && rt.acciones.every((a) => a.responsable && PM.date.valid(a.fechaObjetivo)), '');
    ok('el catálogo de la base de conocimiento coincide con las plantillas', !PM.KB || IDS.every((id) => { const d = PM.KB.doc(id); const t = PM.templates[id]; return d && d.process === t.process && d.area === t.area && d.group === t.group && d.kind === t.kind && d.multiple === !!t.multiple && d.name === t.name; }), '');
    return out;
  }, { IDS, SPEC });
  for (const r of def) check(r.ok, r.name, r.detail);

  /* ============================================================== 4. editor */
  step('Editor: cada plantilla abre sin errores');
  const pid = await createProject(page, { lifecycle: 'Híbrido', name: 'Proyecto híbrido de prueba', sponsor: 'Gerencia General' });
  await page.waitForTimeout(400);
  const openTpl = async (id) => {
    await page.evaluate((id) => { const t = PM.templates[id]; if (t.multiple) PM.navigate('documento', { template: id }); else PM.openDocument(id); }, id);
    await page.waitForSelector('.page[data-doc-id] [data-section]', { timeout: 8000 });
    await page.waitForTimeout(150);
  };
  for (const id of IDS) {
    await openTpl(id);
    const info = await page.evaluate((id) => {
      const t = PM.templates[id];
      const host = document.querySelector('.page[data-doc-id]');
      const fields = t.sections.flatMap((s) => s.fields);
      const missing = fields.filter((f) => !host.querySelector('[data-field="' + f.key + '"]')).map((f) => f.key);
      const tableIssues = [];
      for (const f of fields.filter((x) => x.type === 'table')) {
        const heads = [...host.querySelectorAll('[data-field="' + f.key + '"] thead th:not(.ctl)')].map((th) => th.textContent.trim());
        const want = f.columns.map((c) => c.label);
        if (JSON.stringify(heads) !== JSON.stringify(want)) tableIssues.push({ key: f.key, heads, want });
        const add = [...host.querySelectorAll('[data-field="' + f.key + '"] button')].some((b) => b.textContent.trim() === f.addLabel);
        if (!add) tableIssues.push({ key: f.key, add: 'sin botón ' + f.addLabel });
      }
      return {
        docId: host.getAttribute('data-doc-id'), sections: host.querySelectorAll('section[data-section]').length, want: t.sections.length, missing, tableIssues,
        eyebrow: (host.querySelector('.page-head .eyebrow') || host).textContent.slice(0, 300), nuevo: !!host.querySelector('[data-callout="nuevo"]'),
      };
    }, id);
    check(info.sections === info.want && !info.missing.length, id + ': ' + info.want + ' secciones y todos los campos', info);
    check(!info.tableIssues.length, id + ': tablas con sus columnas y botón para agregar', info.tableIssues);
    check(info.nuevo && (MULTI.includes(id) ? info.docId.startsWith(id + '--') : info.docId === id), id + ': documento por crear con id ' + (MULTI.includes(id) ? '<plantilla>--<uid>' : 'de la plantilla'), info.docId);
    check(info.eyebrow.includes(SPEC[id][0]), id + ': encabezado con el proceso ' + SPEC[id][0]);
  }
  check(!(await errorCards(page)).length, 'sin tarjetas de error al abrir las plantillas');

  step('Editor: el ejemplo llena los campos');
  const exIds = await page.evaluate(async (pid) => {
    const out = {};
    for (const t of PM.templateList.filter((x) => x.agile)) {
      const docId = t.multiple ? t.id + '--ej' : t.id;
      const body = PM.newDocBody(t, { sponsor: 'Gerencia General' }, { template: t.id });
      body.fields = PM.clone(t.example);
      if (t.multiple) { body.seq = 1; body.title = t.name + ' — ' + (t.example.iteracion || 'ejemplo'); }
      await PM.store.set(PM.paths.doc(pid, docId), body);
      out[t.id] = docId;
    }
    return out;
  }, pid);
  for (const id of IDS) {
    await page.evaluate((docId) => PM.navigate('documento', { docId }), exIds[id]);
    await page.waitForSelector('.page[data-doc-id="' + exIds[id] + '"] [data-section]', { timeout: 8000 });
    await page.waitForTimeout(250);
    const res = await page.evaluate((id) => {
      const t = PM.templates[id]; const ex = t.example;
      const host = document.querySelector('.page[data-doc-id]');
      const bad = [];
      const num = (v) => PM.fmt.num(v, 4);
      for (const f of t.sections.flatMap((s) => s.fields)) {
        if (!(f.key in ex)) continue;
        const v = ex[f.key]; const box = host.querySelector('[data-field="' + f.key + '"]');
        if (!box) { bad.push(f.key + ': sin contenedor'); continue; }
        if (f.type === 'list') {
          const items = [...box.querySelectorAll('.docs-list-row textarea')].map((x) => x.value);
          if (JSON.stringify(items) !== JSON.stringify(v)) bad.push(f.key + ': lista ' + items.length + '/' + v.length);
        } else if (f.type === 'table') {
          const rows = box.querySelectorAll('tbody tr');
          if (rows.length !== v.length) { bad.push(f.key + ': ' + rows.length + '/' + v.length + ' filas'); continue; }
          const c0 = f.columns[0]; const first = rows[0].querySelector('td .cell-input, td textarea');
          if (first && first.value !== String(v[0][c0.key] ?? '')) bad.push(f.key + ': primera celda «' + first.value + '»');
          for (const c of f.columns.filter((x) => x.type === 'select')) {
            const sel = rows[0].querySelector('select[aria-label="' + c.label + ' — fila 1"]');
            if (v[0][c.key] !== undefined && (!sel || sel.value !== String(v[0][c.key]))) bad.push(f.key + '.' + c.key + ': selección «' + (sel && sel.value) + '»');
          }
        } else {
          const el = box.querySelector('#docs-f-' + f.key);
          const got = el ? el.value : null;
          const want = f.type === 'number' || f.type === 'money' ? num(v) : String(v);
          if (got !== want) bad.push(f.key + ': «' + got + '» ≠ «' + want + '»');
        }
      }
      return bad;
    }, id);
    check(!res.length, id + ': los campos muestran el ejemplo', res);
    if (id === 'plan-release') {
      const calc = await page.$$eval('[data-field="releases"] tbody tr', (trs) => trs.map((tr) => [...tr.querySelectorAll('td.col-calc')].map((td) => td.textContent.trim())));
      check(calc.length === 3 && calc[0][0] === '29,5' && /\$\s?813\.559/.test(calc[0][1]), 'plan de releases: columnas calculadas en la tabla (29,5 por iteración; $ 813.559 por punto)', calc);
      await shot(page, 'plan-release-claro');
    }
  }

  step('Editor: edición con teclado y mouse (planificación de la iteración)');
  await openTpl('planificacion-sprint');
  const newDocId = await page.$eval('.page[data-doc-id]', (e) => e.getAttribute('data-doc-id'));
  await page.click('[data-field="iteracion"] textarea');
  await page.keyboard.type('Iteración 7');
  await page.waitForTimeout(250);
  const elems = page.locator('[data-field="elementos"]');
  await elems.getByRole('button', { name: 'Agregar elemento del backlog' }).click();
  await page.waitForTimeout(200);
  await elems.locator('input[aria-label="Código — fila 1"]').fill('HU-035');
  await elems.locator('select[aria-label="Tipo — fila 1"]').selectOption('Defecto');
  await elems.locator('input[aria-label="Estimación — fila 1"]').fill('3');
  await elems.locator('input[aria-label="Estimación — fila 1"]').press('Tab');
  const parts = page.locator('[data-field="participantes"]');
  await parts.getByRole('button', { name: 'Agregar elemento' }).click();
  await page.keyboard.type('Dueño del producto');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Equipo de desarrollo');
  await page.waitForTimeout(1100);
  await page.evaluate(() => PM.store.flush());
  const saved = await page.evaluate(({ pid, id }) => PM.store.get(PM.paths.doc(pid, id)), { pid, id: newDocId });
  const sf = (saved && saved.fields) || {};
  const row = (sf.elementos || [])[0] || {};
  check(saved && saved.template === 'planificacion-sprint' && saved.seq === 2, 'se creó la instancia nueva al escribir (consecutivo 2)', saved && { template: saved.template, seq: saved.seq });
  check(sf.iteracion === 'Iteración 7', 'el campo «Iteración» se guardó', sf.iteracion);
  check(row.codigo === 'HU-035' && row.tipo === 'Defecto' && row.estimacion === 3 && row.id, 'la fila agregada se guardó con código, tipo y estimación', row);
  check(JSON.stringify(sf.participantes) === JSON.stringify(['Dueño del producto', 'Equipo de desarrollo']), 'la lista de participantes se llenó con Enter', sf.participantes);

  step('Editor: retrospectiva y definición de terminado');
  await openTpl('retrospectiva');
  const acc = page.locator('[data-field="acciones"]');
  await acc.getByRole('button', { name: 'Agregar acción' }).click();
  await page.waitForTimeout(250);
  check(await acc.locator('select[aria-label="Estado — fila 1"]').inputValue() === 'Pendiente', 'una acción nueva aparece con estado «Pendiente»');
  await acc.locator('select[aria-label="Estado — fila 1"]').focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  check(await acc.locator('select[aria-label="Estado — fila 1"]').inputValue() !== '', 'el estado se cambia con el teclado');

  step('Solo lectura');
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.evaluate((docId) => PM.navigate('documento', { docId }), exIds.retrospectiva);
  await page.waitForSelector('.page[data-doc-id="' + exIds.retrospectiva + '"] [data-section]');
  await page.waitForTimeout(250);
  const ro = await page.evaluate(() => {
    const host = document.querySelector('.page[data-doc-id]');
    return { inputs: host.querySelectorAll('.docs-split input, .docs-split textarea, .docs-split select').length, add: [...host.querySelectorAll('button')].filter((b) => /Agregar/.test(b.textContent)).length, rows: host.querySelectorAll('[data-field="acciones"] tbody tr').length, wf: [...host.querySelectorAll('.docs-bar button')].map((b) => b.textContent.trim()) };
  });
  check(ro.inputs === 0 && ro.add === 0 && ro.rows === 3 && !ro.wf.length, 'sin controles de edición ni flujo de emisión; la tabla se lee', ro);
  await page.evaluate(() => PM.setState({ canWrite: true }));

  /* ============================================================== 6. mapa de procesos */
  step('Mapa de procesos: consideraciones ágiles');
  await page.evaluate(() => {
    /* Vista mínima de destino si el módulo real (45) no está en esta página. */
    if (!PM.getView('backlog')) PM.registerView({ id: 'backlog', label: 'Backlog del producto', group: 'agil', icon: 'backlog', order: 10, when: PM.agile.when, unavailable: PM.AgileUnavailable, component: () => PM.lib.html`<div class="page" data-stub-view="backlog">Backlog</div>` });
  });
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="5.2"]');
  await page.waitForSelector('.modal');
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const md = document.querySelector('.modal');
    const det = md.querySelector('details.docs-agile[data-agile="alcance"]');
    const row = md.querySelector('.docs-out-row[data-doc="vision-producto"]');
    return {
      chip: row ? [...row.querySelectorAll('.chip')].map((c) => c.textContent.trim()) : null,
      det: !!det, open: det ? det.open : null, summary: det ? det.querySelector('summary').textContent.trim() : '',
      practices: det ? det.querySelectorAll('.docs-tips li').length : 0,
      buttons: det ? [...det.querySelectorAll('button')].map((b) => b.textContent.trim()) : [],
      tools: [...md.querySelectorAll('.docs-io button')].map((b) => b.textContent.trim()),
    };
  });
  check(m.chip && m.chip.includes('Ágil'), '5.2: la visión del producto aparece como salida con el distintivo de texto «Ágil»', m.chip);
  check(m.det && m.open === true && /Consideraciones para entornos ágiles\/adaptativos · Alcance/.test(m.summary), 'proyecto híbrido: consideraciones del área abiertas en el detalle', m);
  check(m.practices >= 3 && m.buttons.includes('Backlog del producto') && m.buttons.includes('Visión del producto'), 'prácticas recomendadas y botones hacia la vista y la plantilla', m.buttons);
  check(m.tools.includes('Backlog del producto'), '5.2: el backlog figura entre las herramientas de la aplicación', m.tools);
  await shot(page, 'proceso-5-2-claro', false);
  /* se llega con Tab desde el último botón de las salidas (modalidad de teclado → :focus-visible) */
  await page.locator('.modal .docs-out button').last().focus();
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => ({ tag: document.activeElement.tagName, shadow: getComputedStyle(document.activeElement).boxShadow }));
  check(ring.tag === 'SUMMARY' && ring.shadow && ring.shadow !== 'none', 'Tab lleva al resumen plegable y muestra el anillo de foco', ring);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  check(await page.locator('.modal details.docs-agile').evaluate((d) => d.open) === false, 'Enter pliega las consideraciones');
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  check(await page.locator('.modal details.docs-agile').evaluate((d) => d.open) === true, 'Espacio las despliega de nuevo');
  await page.locator('.modal details.docs-agile button[data-agile-doc="vision-producto"]').click();
  await page.waitForTimeout(400);
  const st = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params, modal: document.querySelectorAll('.modal').length }));
  check(st.view === 'documento' && st.params.docId === 'vision-producto' && st.modal === 0, 'el botón de la plantilla cierra el detalle y abre el documento', st);
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="5.2"]');
  await page.waitForSelector('.modal details.docs-agile');
  await page.locator('.modal details.docs-agile button', { hasText: 'Backlog del producto' }).click();
  await page.waitForTimeout(400);
  check(await page.evaluate(() => PM.getState().view) === 'backlog' && await page.locator('.modal').count() === 0, 'el botón de la vista ágil navega al backlog');

  for (const [code, areaId] of [['4.3', 'integracion'], ['6.5', 'cronograma'], ['8.1', 'calidad'], ['4.4', 'integracion'], ['5.5', 'alcance']]) {
    await gotoView(page, 'procesos');
    await page.click('.docs-proc[data-code="' + code + '"]');
    await page.waitForSelector('.modal');
    await page.waitForTimeout(150);
    const r = await page.evaluate((areaId) => {
      const md = document.querySelector('.modal');
      return { agileRows: [...md.querySelectorAll('.docs-out-row')].filter((x) => [...x.querySelectorAll('.chip')].some((c) => c.textContent.trim() === 'Ágil')).map((x) => x.getAttribute('data-doc')), det: !!md.querySelector('details.docs-agile[data-agile="' + areaId + '"]') };
    }, areaId);
    const want = { '4.3': 'planificacion-sprint', '6.5': 'plan-release', '8.1': 'definicion-terminado', '4.4': 'retrospectiva', '5.5': 'acta-revision-sprint' }[code];
    check(r.agileRows.includes(want) && r.det, code + ': salida ágil «' + want + '» y consideraciones del área ' + areaId, r);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }

  step('Mapa de procesos en lista: bloque plegable por área');
  await gotoView(page, 'procesos');
  await page.locator('.btn-group button', { hasText: 'Lista' }).click();
  await page.locator('.docs-acc[data-area="riesgos"] .docs-acc-head').click();
  await page.waitForTimeout(200);
  const det = page.locator('.docs-acc[data-area="riesgos"] details.docs-agile');
  check(await det.count() === 1 && await det.evaluate((d) => !d.open), 'el área desplegada muestra las consideraciones ágiles plegadas');
  await det.locator('summary').click();
  await page.waitForTimeout(150);
  check(await det.evaluate((d) => d.open && /alta variabilidad/.test(d.textContent)), 'al abrirlas se lee el texto del área (riesgos)');
  await shot(page, 'procesos-lista-claro');
  await page.locator('.btn-group button', { hasText: 'Matriz' }).click();

  step('Proyecto predictivo: consideraciones plegadas');
  await createProject(page, { lifecycle: 'Predictivo', name: 'Proyecto predictivo', code: 'PRY-TEST-002' });
  await page.waitForTimeout(400);
  await gotoView(page, 'procesos');
  await page.click('.docs-proc[data-code="6.5"]');
  await page.waitForSelector('.modal details.docs-agile');
  check(await page.locator('.modal details.docs-agile').evaluate((d) => !d.open), 'en un proyecto predictivo el bloque ágil empieza plegado');
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  step('Definición de listo y de terminado: valores iniciales y creación');
  await page.evaluate(() => PM.openDocument('definicion-terminado'));
  await page.waitForSelector('.page[data-doc-id="definicion-terminado"] [data-section]');
  await page.waitForTimeout(250);
  const dt = await page.evaluate(() => ({
    nuevo: !!document.querySelector('[data-callout="nuevo"]'),
    listo: document.querySelectorAll('[data-field="definicionListo"] .docs-list-row').length,
    terminado: document.querySelectorAll('[data-field="definicionTerminado"] .docs-list-row').length,
    cols: [...document.querySelectorAll('[data-field="columnasTablero"] tbody tr')].map((tr) => [tr.querySelector('.cell-input').value, (tr.querySelector('input[aria-label^="Límite WIP"]') || {}).value]),
  }));
  check(dt.nuevo && dt.listo === 5 && dt.terminado === 5, 'documento por crear con las listas iniciales de listo y de terminado', dt);
  check(JSON.stringify(dt.cols) === JSON.stringify([['Por hacer', ''], ['En curso', '3'], ['En revisión', '2'], ['Terminado', '']]), 'columnas del tablero iniciales con sus límites WIP', dt.cols);
  await page.locator('[data-callout="nuevo"] button', { hasText: 'Crear documento' }).click();
  await page.waitForTimeout(500);
  const created = await page.evaluate(() => PM.store.get(PM.paths.doc(PM.getState().projectId, 'definicion-terminado')));
  check(created && created.fields.definicionTerminado.length === 5 && created.fields.columnasTablero.length === 4, '«Crear documento» guarda los valores iniciales', created && created.fields);

  check(!(await errorCards(page)).length, 'sin tarjetas de error');
  check(await horizontalOverflow(page) <= 1, 'sin desborde horizontal (1360 px)');
} finally {
  await browser.close();
}

/* ============================================================== 7. tema oscuro y móvil */
for (const variant of [{ dark: true, width: 1360, name: 'oscuro' }, { dark: false, width: 400, name: 'movil' }, { dark: true, width: 400, name: 'movil-oscuro' }, { dark: false, width: 1920, name: 'ancho' }]) {
  step('Vista ' + variant.name + ' (' + variant.width + ' px)');
  const app = await openApp({ file, width: variant.width, height: 900, dark: variant.dark });
  try {
    const p = app.page;
    const pid2 = await createProject(p, { lifecycle: 'Adaptativo (ágil)', name: 'EJEMPLO · ERP', sponsor: 'Gerencia General' });
    await p.waitForTimeout(400);
    await p.evaluate(async (pid) => {
      for (const t of PM.templateList.filter((x) => x.agile)) {
        const docId = t.multiple ? t.id + '--ej' : t.id;
        const body = PM.newDocBody(t, { sponsor: 'Gerencia General' }, { template: t.id });
        body.fields = PM.clone(t.example);
        if (t.multiple) body.seq = 1;
        await PM.store.set(PM.paths.doc(pid, docId), body);
      }
    }, pid2);
    for (const docId of ['plan-release', 'planificacion-sprint--ej', 'vision-producto', 'retrospectiva--ej']) {
      await p.evaluate((docId) => PM.navigate('documento', { docId }), docId);
      await p.waitForSelector('.page[data-doc-id="' + docId + '"] [data-section]', { timeout: 8000 });
      await p.waitForTimeout(300);
      const ov = await horizontalOverflow(p);
      check(ov <= 1, docId + ': sin desborde horizontal de la página', ov);
      if (docId === 'plan-release') {
        const tw = await p.$eval('[data-field="releases"] .table-wrap', (el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }));
        check(variant.width > 900 || (tw.sw > tw.cw && /auto|scroll/.test(tw.ox)), 'la tabla de releases se desplaza dentro de su contenedor', tw);
        if (variant.width === 1920) {
          const w = await p.$eval('.page[data-doc-id]', (el) => el.getBoundingClientRect().width);
          check(w > 1500, 'a 1920 px el editor usa el ancho disponible', w);
        }
        await shot(p, 'plan-release-' + variant.name);
      }
      if (docId === 'retrospectiva--ej' && variant.width === 400) await shot(p, 'retrospectiva-' + variant.name);
    }
    await gotoView(p, 'procesos');
    await p.waitForTimeout(200);
    if (variant.width <= 400) {
      check(await p.locator('.docs-acc').count() === 10, 'a 400 px el mapa se muestra como lista');
      await p.locator('.docs-acc[data-area="cronograma"] .docs-acc-head').click();
      await p.waitForTimeout(150);
      await p.locator('.docs-acc[data-area="cronograma"] details.docs-agile summary').click();
      await p.waitForTimeout(150);
      check(await horizontalOverflow(p) <= 1, 'lista de procesos con consideraciones abiertas sin desborde');
      await shot(p, 'procesos-lista-' + variant.name);
      await p.locator('.docs-acc[data-area="cronograma"] .docs-proc[data-code="6.5"]').click();
    } else {
      await p.click('.docs-proc[data-code="6.5"]');
    }
    await p.waitForSelector('.modal details.docs-agile');
    await p.waitForTimeout(250);
    const md = await p.evaluate(() => { const d = document.querySelector('.modal details.docs-agile'); const md = document.querySelector('.modal'); return { open: d.open, ov: md.scrollWidth - md.clientWidth, fg: getComputedStyle(d.querySelector('summary')).color, bg: getComputedStyle(d).backgroundColor }; });
    check(md.open && md.ov <= 1, 'detalle del proceso 6.5 con consideraciones abiertas (proyecto adaptativo) y sin desborde', md);
    await shot(p, 'proceso-6-5-' + variant.name, false);
    const cards = await errorCards(p);
    check(!cards.length, 'sin tarjetas de error', cards);
    check(!app.errors.length, 'sin errores de consola', app.errors);
  } finally {
    await app.browser.close();
  }
}

check(!errors.length, 'sin errores de consola (escritorio)', errors);
console.log(`\n${passes}/${passes + failures} correctas`);
process.exit(failures ? 1 : 0);

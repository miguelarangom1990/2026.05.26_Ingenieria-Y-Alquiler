// Prueba de interacción de la vista EDT (src/30-wbs.js).
// Uso: node test/wbs.test.mjs --file <ruta.html> [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let fails = 0, total = 0;
const check = (name, ok, info) => { total++; if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '\n      ' + JSON.stringify(info))); };
const eq = (name, got, exp) => check(name, JSON.stringify(got) === JSON.stringify(exp), { got, exp });
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

/* Filas del árbol: [código, nombre] */
const rows = (page) => page.$$eval('tr[data-wbs-row]', (trs) => trs.map((r) => { const inp = r.querySelector('[data-wbs-input]'); const view = r.querySelector('[data-wbs-name], .wbs-root-name'); return [r.dataset.code, inp ? inp.value : view && !view.querySelector('.faint') ? view.textContent.trim() : '']; }));
const openRowMenu = async (page, code) => { await page.hover(`tr[data-code="${code}"] td:nth-child(3)`); await page.click(`button[aria-label="Acciones de ${code}"]`); await page.waitForSelector('.wbs-rowmenu'); };
/* Arrastra el código de una fila sobre otra: where = before | after | inside. Devuelve la clase de indicación vista antes de soltar. */
const dragTo = async (page, fromCode, toCode, where) => {
  const sb = await (await page.$(`tr[data-code="${fromCode}"] [data-wbs-code]`)).boundingBox();
  const db = await (await page.$(`tr[data-code="${toCode}"]`)).boundingBox();
  const y = where === 'before' ? db.y + db.height * 0.15 : where === 'after' ? db.y + db.height * 0.85 : db.y + db.height * 0.5;
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await page.mouse.down();
  await page.mouse.move(sb.x + sb.width / 2 + 8, sb.y + sb.height / 2 + 8, { steps: 3 });
  await page.mouse.move(db.x + 320, y, { steps: 8 }); await page.waitForTimeout(60);
  const hint = await page.$eval(`tr[data-code="${toCode}"]`, (tr) => (tr.className.match(/wbs-drop-(\w+)/) || [])[1] || null);
  await page.mouse.up(); await page.waitForTimeout(150);
  return hint;
};
const editName = async (page, code) => { await page.click(`tr[data-code="${code}"] [data-wbs-name]`); await page.waitForSelector(`tr[data-code="${code}"] [data-wbs-input]`); await page.waitForTimeout(60); };
const focusedName = (page) => page.evaluate(() => (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.wbsInput ? document.activeElement.value : null));
const idOf = (page, code) => page.$eval(`tr[data-wbs-row][data-code="${code}"]`, (r) => r.dataset.wbsRow);
const tool = (page, id) => page.evaluate((id) => PM.store.get(PM.paths.tool(PM.getState().projectId, id)), id);
const stubDownloads = (page) => page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data: String(data) }); return true; }; });
const typeAndKey = async (page, text, key) => { await page.keyboard.type(text); if (key) { await page.keyboard.press(key); await page.waitForTimeout(80); } };

/* Proyecto con EDT de 3 niveles, cronograma vinculado y línea base del alcance (para capturas y vistas de lectura). */
async function seedRich(page) {
  return page.evaluate(async () => {
    const pid = await PM.projectOps.create({ name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista', code: 'PRY-2026-014', start: '2026-08-03', end: '2026-12-18', budget: 486500000, currency: 'COP', status: 'En ejecución', lifecycle: 'Predictivo', statusDate: '2026-10-02' });
    const L1 = ['Gestión del proyecto', 'Ingeniería', 'Suministro y logística', 'Montaje', 'Certificación y operación', 'Desmontaje y retiro'];
    const L2 = [['Inicio y planificación', 'Seguimiento y control', 'Cierre del proyecto'], ['Levantamiento en obra', 'Diseño y memoria de cálculo', 'Plan de montaje y plan de rescate'], ['Alistamiento en bodega', 'Inspección de salida', 'Transporte a obra'], ['Montaje niveles 1 a 5', 'Montaje niveles 6 a 10', 'Montaje niveles 11 a 15', 'Accesos y protecciones'], ['Inspección y certificación', 'Alquiler y mantenimiento en obra'], ['Desmontaje', 'Transporte de retorno', 'Inspección de retorno']];
    const nodes = []; const tasks = [];
    const addTask = (id, name, i, j) => { tasks.push({ id: 't_' + id, name, wbsId: id, duration: 5 + j, milestone: false, deps: tasks.length ? [{ id: tasks[tasks.length - 1].id, type: 'FS', lag: 0 }] : [], progress: i < 3 ? 100 : i === 3 ? (j === 0 ? 100 : j === 1 ? 60 : 0) : 0, cost: 4000000 * (j + 1), resources: [] }); };
    L1.forEach((n, i) => {
      const id = 'n' + (i + 1);
      nodes.push({ id, parentId: null, name: n, order: i + 1, kind: '', responsible: 'Director de proyecto' });
      L2[i].forEach((m, j) => {
        const cid = id + '_' + (j + 1);
        nodes.push({ id: cid, parentId: id, name: m, order: j + 1, kind: '', description: 'Trabajo de ' + m.toLowerCase() + ' según el plan de montaje aprobado.', responsible: j % 2 ? 'Residente de obra' : 'Supervisor de montaje', acceptance: j === 2 ? '' : 'Aprobado por la interventoría del cliente.', deliverable: 'Registro de ' + m.toLowerCase(), costEstimate: 4000000 * (j + 1), notes: '' });
        if (cid === 'n4_2') {
          ['Anclajes a estructura', 'Plataformas y barandas'].forEach((x, k) => { const gid = cid + '_' + (k + 1); nodes.push({ id: gid, parentId: cid, name: x, order: k + 1, responsible: 'Supervisor de montaje', acceptance: 'Lista de verificación aprobada.', costEstimate: 6000000, description: '' }); addTask(gid, x, i, k + 1); });
        } else addTask(cid, m, i, j);
      });
    });
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes });
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 6, holidaysCO: true, extraHolidays: [] }, tasks });
    const snap = nodes.filter((n) => n.id !== 'n4_4').map((n) => (n.id === 'n2_2' ? { ...n, name: 'Diseño' } : n)).concat([{ id: 'retirado', parentId: null, name: 'Elemento retirado', order: 9 }]);
    await PM.store.set(PM.paths.baseline(pid, 'bl0'), { number: 0, label: 'LB0', date: '2026-08-01', includes: ['scope'], note: 'Línea base inicial', changeRef: '', byId: null, scope: { wbs: snap, scopeStatement: null } });
    PM.selectProject(pid, 'edt');
    return pid;
  });
}

/* =============================================================== escritorio: edición completa */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    await createProject(page);
    await gotoView(page, 'edt');
    check('estado vacío visible', await page.isVisible('text=Agregar primer entregable'), null);
    check('estado vacío explica la regla del 100 %', (await page.textContent('.empty')).includes('regla del 100 %'), null);

    /* --- construcción con teclado --- */
    await page.click('text=Agregar primer entregable');
    await page.waitForTimeout(150);
    check('foco en el nuevo elemento', (await focusedName(page)) === '', await focusedName(page));
    await typeAndKey(page, 'Gestión del proyecto', 'Enter');
    await typeAndKey(page, 'Ingeniería', 'Enter');
    await typeAndKey(page, 'Diseño', 'Tab');
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    await typeAndKey(page, 'Memoria de cálculo', 'Enter');
    await typeAndKey(page, 'Montaje', 'Shift+Tab');
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    await typeAndKey(page, 'Nivel 1', 'Tab');
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    await typeAndKey(page, 'Anclajes', 'Tab');
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    await typeAndKey(page, 'Plataformas', 'Enter');
    await typeAndKey(page, 'Nivel 2', 'Shift+Tab');
    const expected = [['1', 'Proyecto de prueba'], ['1.1', 'Gestión del proyecto'], ['1.2', 'Ingeniería'], ['1.2.1', 'Diseño'], ['1.2.2', 'Memoria de cálculo'], ['1.3', 'Montaje'], ['1.3.1', 'Nivel 1'], ['1.3.1.1', 'Anclajes'], ['1.3.1.2', 'Plataformas'], ['1.3.2', 'Nivel 2']];
    eq('códigos tras Enter / Tab / Mayús+Tab', await rows(page), expected);
    check('el foco sigue en "Nivel 2"', (await focusedName(page)) === 'Nivel 2', await focusedName(page));

    /* --- mover con Alt+flechas --- */
    await page.keyboard.press('Alt+ArrowUp'); await page.waitForTimeout(120);
    eq('Alt+↑ sube con su rama', (await rows(page)).slice(6), [['1.3.1', 'Nivel 2'], ['1.3.2', 'Nivel 1'], ['1.3.2.1', 'Anclajes'], ['1.3.2.2', 'Plataformas']]);
    check('foco conservado tras mover', (await focusedName(page)) === 'Nivel 2', await focusedName(page));
    await page.keyboard.press('Alt+ArrowDown'); await page.waitForTimeout(120);
    eq('Alt+↓ restaura el orden', await rows(page), expected);
    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(60);
    check('↑ cambia de fila', (await focusedName(page)) === 'Plataformas', await focusedName(page));

    /* --- barra de herramientas sobre el elemento seleccionado --- */
    await editName(page, '1.2.2');
    check('clic en el nombre lo vuelve editable con foco', (await focusedName(page)) === 'Memoria de cálculo', await focusedName(page));
    await page.getByRole('button', { name: 'Subir (Alt+↑)' }).click(); await page.waitForTimeout(120);
    eq('Subir', (await rows(page)).slice(3, 5), [['1.2.1', 'Memoria de cálculo'], ['1.2.2', 'Diseño']]);
    await page.getByRole('button', { name: 'Bajar (Alt+↓)' }).click(); await page.waitForTimeout(120);
    eq('Bajar', (await rows(page)).slice(3, 5), [['1.2.1', 'Diseño'], ['1.2.2', 'Memoria de cálculo']]);
    await page.getByRole('button', { name: 'Disminuir sangría (Mayús+Tab)' }).click(); await page.waitForTimeout(120);
    eq('Quitar sangría: hermano después del padre', (await rows(page)).slice(2, 6), [['1.2', 'Ingeniería'], ['1.2.1', 'Diseño'], ['1.3', 'Memoria de cálculo'], ['1.4', 'Montaje']]);
    await page.getByRole('button', { name: 'Aumentar sangría (Tab)' }).click(); await page.waitForTimeout(120);
    eq('Sangría: último hijo del hermano anterior', await rows(page), expected);

    /* --- renombrar en línea --- */
    await editName(page, '1.1');
    await page.fill('tr[data-code="1.1"] [data-wbs-input]', 'Gestión del proyecto y control');
    await page.waitForTimeout(80);
    eq('renombrar en línea', (await rows(page))[1], ['1.1', 'Gestión del proyecto y control']);

    /* --- menú de fila: agregar hijo; Retroceso borra un elemento vacío --- */
    await openRowMenu(page, '1.1');
    await page.getByRole('menuitem', { name: /Agregar elemento hijo/ }).click(); await page.waitForTimeout(120);
    await typeAndKey(page, 'Informes semanales', 'Enter');
    check('hijo creado desde el menú', JSON.stringify((await rows(page))[2]) === JSON.stringify(['1.1.1', 'Informes semanales']), (await rows(page))[2]);
    check('Enter crea hermano vacío', JSON.stringify((await rows(page))[3]) === JSON.stringify(['1.1.2', '']), (await rows(page))[3]);
    await page.keyboard.press('Backspace'); await page.waitForTimeout(120);
    check('Retroceso elimina el elemento vacío', (await rows(page)).length === 11 && (await focusedName(page)) === 'Informes semanales', { n: (await rows(page)).length, f: await focusedName(page) });

    /* --- arrastrar y soltar --- */
    const before = await rows(page);
    check('arrastre: indicación "antes"', (await dragTo(page, '1.3.2', '1.3.1', 'before')) === 'before', null);
    eq('arrastre: antes del hermano', (await rows(page)).slice(7, 11), [['1.3.1', 'Nivel 2'], ['1.3.2', 'Nivel 1'], ['1.3.2.1', 'Anclajes'], ['1.3.2.2', 'Plataformas']]);
    check('arrastre: indicación "después"', (await dragTo(page, '1.3.1', '1.3.2', 'after')) === 'after', null);
    eq('arrastre: después de la rama', await rows(page), before);
    await dragTo(page, '1.1.1', '1', 'inside');
    eq('arrastre: al primer nivel', (await rows(page)).slice(-1), [['1.4', 'Informes semanales']]);
    check('arrastre: indicación "dentro"', (await dragTo(page, '1.4', '1.1', 'inside')) === 'inside', null);
    eq('arrastre: dentro de otro elemento', await rows(page), before);
    const hintOwn = await dragTo(page, '1.3', '1.3.1.1', 'inside');
    check('arrastre: no se suelta dentro de su propia rama', hintOwn === null && JSON.stringify(await rows(page)) === JSON.stringify(before), hintOwn);
    check('arrastre: soltar no abre el diccionario', !(await page.isVisible('.modal')), null);

    /* --- contraer / expandir --- */
    await page.click('button[aria-label="Contraer 1.3"]'); await page.waitForTimeout(100);
    check('contraer oculta descendientes', (await rows(page)).length === 7, (await rows(page)).length);
    await page.getByRole('button', { name: 'Expandir todo' }).click(); await page.waitForTimeout(100);
    check('expandir todo', (await rows(page)).length === 11, (await rows(page)).length);
    await page.getByRole('button', { name: 'Contraer todo' }).click(); await page.waitForTimeout(100);
    check('contraer todo deja el primer nivel', (await rows(page)).length === 4, (await rows(page)).length);
    await page.getByRole('button', { name: 'Expandir todo' }).click(); await page.waitForTimeout(100);

    /* --- tipo --- */
    await editName(page, '1.2');
    check('solo la fila en edición tiene campos', (await page.$$('tr[data-wbs-row] [data-wbs-input]')).length === 1 && (await page.$$('tr[data-wbs-row] select.wbs-kind')).length === 1, null);
    await page.selectOption('tr[data-code="1.2"] select.wbs-kind', 'cuenta-control'); await page.waitForTimeout(80);
    eq('hoja = paquete de trabajo por defecto', (await page.textContent('tr[data-code="1.3.2"] .chip')).trim(), 'Paquete de trabajo');
    await editName(page, '1.3');
    const parentOpts = await page.$eval('tr[data-code="1.3"] select.wbs-kind', (s) => [...s.options].map((o) => o.value));
    check('un elemento con hijos no puede ser paquete', !parentOpts.includes('paquete'), parentOpts);

    /* --- diccionario en panel lateral --- */
    await page.click('tr[data-code="1.3.1.1"] .wbs-code-btn'); await page.waitForTimeout(120);
    check('panel del diccionario abierto', await page.isVisible('aside.wbs-panel #wbs-f-description'), null);
    await page.fill('#wbs-f-description', 'Instalación de anclajes químicos a la estructura cada dos niveles.');
    await page.fill('#wbs-f-deliverable', 'Anclajes instalados y probados');
    await page.fill('#wbs-f-responsible', 'Supervisor de montaje');
    await page.fill('#wbs-f-acceptance', 'Prueba de extracción conforme en el 100 % de los anclajes.');
    await page.fill('#wbs-f-cost', '1500000');
    await page.fill('#wbs-f-notes', 'Coordinar con la interventoría.');
    await page.click('#wbs-f-notes');
    await page.waitForTimeout(100);
    const montajeCost = await page.$eval('tr[data-code="1.3"] td.wbs-c-money', (td) => td.textContent.trim());
    check('costo consolidado hacia arriba', montajeCost.includes('1.500.000'), montajeCost);
    await page.selectOption('#wbs-f-kind', 'entregable'); await page.waitForTimeout(80);
    eq('tipo editado en el panel', await page.$eval('tr[data-code="1.3.1.1"] select.wbs-kind', (s) => s.value), 'entregable');
    await page.keyboard.press('Escape');
    await page.click('tr[data-code="1.1"] [data-wbs-name]'); await page.waitForTimeout(80);
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120);
    check('↓ edita la fila siguiente', (await focusedName(page)) === 'Informes semanales', await focusedName(page));
    await shot(page, 'arbol-panel');

    /* --- persistencia --- */
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
    await gotoView(page, 'edt');
    await page.waitForSelector('tr[data-wbs-row]');
    const afterReload = await rows(page);
    check('EDT persiste tras recargar', afterReload.length === 11 && afterReload[1][1] === 'Gestión del proyecto y control' && afterReload[8][0] === '1.3.1.1', afterReload);
    await page.click('tr[data-code="1.3.1.1"] .wbs-code-btn'); await page.waitForTimeout(120);
    const dict = await page.evaluate(() => ['description', 'deliverable', 'responsible', 'acceptance', 'cost', 'notes'].map((k) => document.getElementById('wbs-f-' + k).value));
    eq('diccionario persiste tras recargar', dict, ['Instalación de anclajes químicos a la estructura cada dos niveles.', 'Anclajes instalados y probados', 'Supervisor de montaje', 'Prueba de extracción conforme en el 100 % de los anclajes.', '1.500.000', 'Coordinar con la interventoría.']);
    const stored = await tool(page, 'wbs');
    const anc = stored.nodes.find((n) => n.name === 'Anclajes');
    check('almacenado: costo y tipo', anc && anc.costEstimate === 1500000 && anc.kind === 'entregable' && stored.nodes.find((n) => n.name === 'Ingeniería').kind === 'cuenta-control', anc);

    /* --- avisos de validación --- */
    const notices = await page.textContent('[data-wbs-notices]');
    check('aviso: sin responsable', /paquetes de trabajo sin responsable/.test(notices), notices);
    check('aviso: sin criterios de aceptación', /sin criterios de aceptación/.test(notices), notices);
    check('aviso: un solo componente (1.1)', /un solo componente/.test(notices), notices);

    /* --- generar actividades --- */
    await page.getByRole('button', { name: 'Generar actividades en el cronograma' }).click();
    await page.waitForSelector('.modal');
    check('confirmación con el conteo', await page.isVisible('.modal-foot >> text=Crear 6 actividades'), await page.textContent('.modal'));
    await page.click('.modal-foot >> text=Crear 6 actividades');
    await page.waitForTimeout(900);
    let sch = await tool(page, 'schedule');
    const leafIds = stored.nodes.filter((n) => !stored.nodes.some((m) => m.parentId === n.id)).map((n) => n.id).sort();
    eq('una actividad por paquete de trabajo', sch.tasks.map((t) => t.wbsId).sort(), leafIds);
    const tAnc = sch.tasks.find((t) => t.wbsId === anc.id);
    check('actividad: 5 días, sin dependencias, costo del paquete', tAnc.duration === 5 && tAnc.deps.length === 0 && tAnc.progress === 0 && tAnc.cost === 1500000, tAnc);
    eq('orden de las actividades sigue la EDT', sch.tasks.map((t) => t.name), ['Informes semanales', 'Diseño', 'Memoria de cálculo', 'Anclajes', 'Plataformas', 'Nivel 2']);
    check('columnas consolidadas visibles', await page.isVisible('th:has-text("Avance")'), null);
    await page.getByRole('button', { name: 'Generar actividades en el cronograma' }).click(); await page.waitForTimeout(150);
    check('sin paquetes pendientes no abre confirmación', !(await page.isVisible('.modal')), null);

    /* --- crear actividad desde el diccionario --- */
    await page.click('tr[data-code="1.3.1.1"] .wbs-code-btn'); await page.waitForTimeout(100);
    check('panel lista la actividad vinculada', (await page.$$('aside.wbs-panel [data-wbs-task]')).length === 1, null);
    await page.click('aside.wbs-panel >> text=Crear actividad para este paquete'); await page.waitForTimeout(900);
    sch = await tool(page, 'schedule');
    check('actividad adicional vinculada', sch.tasks.filter((t) => t.wbsId === anc.id).length === 2 && sch.tasks.length === 7, sch.tasks.length);
    check('panel muestra 2 actividades', (await page.$$('aside.wbs-panel [data-wbs-task]')).length === 2, null);

    /* --- eliminar en cascada --- */
    const montajeId = await idOf(page, '1.3');
    await openRowMenu(page, '1.3');
    await page.getByRole('menuitem', { name: /Eliminar con sus elementos hijos/ }).click();
    await page.waitForSelector('.modal');
    const confirmText = await page.textContent('.modal');
    check('confirmación menciona descendientes y actividades', /4 elementos que lo componen/.test(confirmText) && /4 actividades del cronograma quedarán/.test(confirmText), confirmText);
    await page.click('.modal-foot >> text=Eliminar 5 elementos');
    await page.waitForTimeout(900);
    const w2 = await tool(page, 'wbs');
    check('cascada: quedan 5 elementos', w2.nodes.length === 5 && !w2.nodes.some((n) => n.id === montajeId), w2.nodes.map((n) => n.name));
    sch = await tool(page, 'schedule');
    const ids2 = new Set(w2.nodes.map((n) => n.id));
    check('actividades conservadas y sin vínculo roto', sch.tasks.length === 7 && sch.tasks.filter((t) => t.wbsId === null).length === 4 && sch.tasks.every((t) => t.wbsId === null || ids2.has(t.wbsId)), sch.tasks.map((t) => t.wbsId));
    check('aviso de actividades sin vincular', /4 actividades del cronograma no están vinculadas/.test(await page.textContent('[data-wbs-notices]')), null);
    eq('códigos renumerados tras eliminar', (await rows(page)).map((r) => r[0]), ['1', '1.1', '1.1.1', '1.2', '1.2.1', '1.2.2']);

    /* --- indicador de línea base del alcance --- */
    check('sin línea base', (await page.textContent('[data-wbs-baseline]')).includes('Sin línea base del alcance'), null);
    await page.evaluate(async () => {
      const pid = PM.getState().projectId;
      const w = await PM.store.get(PM.paths.tool(pid, 'wbs'));
      const snap = w.nodes.slice(1).map((n, i) => (i === 0 ? { ...n, name: 'Nombre anterior' } : n)).concat([{ id: 'x-old', parentId: null, name: 'Retirado', order: 9 }]);
      await PM.store.set(PM.paths.baseline(pid, 'bl0'), { number: 0, label: 'LB0', date: '2026-09-01', includes: ['scope'], scope: { wbs: snap } });
    });
    await page.waitForTimeout(300);
    const bl = await page.textContent('[data-wbs-baseline]');
    check('chip de línea base LB0', bl.includes('Línea base del alcance LB0'), bl);
    eq('cambios desde la línea base', await page.textContent('[data-wbs-bl-changes]'), '1 agregado · 1 eliminado · 1 renombrado desde LB0');

    /* --- diagrama --- */
    await page.getByRole('tab', { name: /Diagrama/ }).click(); await page.waitForTimeout(200);
    const boxes = await page.$$eval('svg .wbs-dg-box', (b) => b.length);
    eq('cajas del diagrama = elementos + 1', boxes, w2.nodes.length + 1);
    const inside = await page.$eval('.wbs-chart svg', (svg) => { const vb = svg.viewBox.baseVal; return [...svg.querySelectorAll('.wbs-dg-box')].every((g) => { const b = g.getBBox(); const m = g.transform.baseVal.consolidate().matrix; return m.e >= 0 && m.f >= 0 && m.e + b.width <= vb.width + 0.5 && m.f + b.height <= vb.height + 0.5; }); });
    check('cajas dentro del lienzo', inside, null);
    const textFits = await page.$eval('.wbs-chart svg', (svg) => [...svg.querySelectorAll('.wbs-dg-box')].every((g) => { const r = g.querySelector('rect').getBBox(); return [...g.querySelectorAll('text')].every((t) => { const b = t.getBBox(); return b.x >= r.x - 0.5 && b.x + b.width <= r.x + r.width + 0.5 && b.y + b.height <= r.y + r.height + 1; }); }));
    check('textos dentro de sus cajas', textFits, null);
    await stubDownloads(page);
    await page.getByRole('button', { name: 'Descargar SVG' }).click(); await page.waitForTimeout(100);
    const dl = await page.evaluate(() => window.__dl);
    check('descarga SVG', dl.length === 1 && dl[0].name === 'PRY-TEST-001_EDT.svg' && dl[0].data.startsWith('<?xml') && dl[0].data.includes('<svg'), dl.map((x) => x.name));
    await page.getByRole('button', { name: 'Acercar' }).click(); await page.waitForTimeout(80);
    const z = await page.textContent('.wbs-zoom-v');
    check('zoom cambia', /\d+ %/.test(z), z);
    const firstLeaf = w2.nodes.find((n) => !w2.nodes.some((m) => m.parentId === n.id));
    await page.click(`g.wbs-dg-box[data-id="${firstLeaf.id}"]`); await page.waitForTimeout(150);
    check('clic en caja abre el diccionario', await page.isVisible('.modal >> text=Diccionario de la EDT'), null);
    await page.click('.modal-foot >> text=Listo'); await page.waitForTimeout(100);

    /* --- diccionario (tabla) --- */
    await page.getByRole('tab', { name: /Diccionario/ }).click(); await page.waitForTimeout(150);
    eq('tabla: todos los elementos', (await page.$$('tr[data-wbs-dict]')).length, w2.nodes.length);
    await page.getByRole('button', { name: 'Solo paquetes de trabajo' }).click(); await page.waitForTimeout(100);
    const nLeaves = w2.nodes.filter((n) => !w2.nodes.some((m) => m.parentId === n.id)).length;
    eq('tabla: solo paquetes', (await page.$$('tr[data-wbs-dict]')).length, nLeaves);
    await page.fill(`tr[data-wbs-dict="${firstLeaf.id}"] input[aria-label^="Responsable"]`, 'Coordinador logístico');
    await page.fill(`tr[data-wbs-dict="${firstLeaf.id}"] input[aria-label^="Costo estimado"]`, '2000000');
    await page.waitForTimeout(900);
    const w3 = await tool(page, 'wbs');
    const fl = w3.nodes.find((n) => n.id === firstLeaf.id);
    check('edición en la tabla se guarda', fl.responsible === 'Coordinador logístico' && fl.costEstimate === 2000000, fl);
    check('total estimado', (await page.textContent('[data-wbs-total]')).includes('2.000.000'), await page.textContent('[data-wbs-total]'));
    await page.getByRole('button', { name: 'Exportar CSV' }).click(); await page.waitForTimeout(100);
    const csv = (await page.evaluate(() => window.__dl)).pop();
    check('CSV del diccionario', csv.name === 'PRY-TEST-001_diccionario-EDT.csv' && csv.data.includes('Código;Nombre;Tipo') && csv.data.includes('Coordinador logístico'), csv.name);
    await shot(page, 'diccionario');

    /* --- solo lectura --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    check('lectura: tabla sin campos editables', (await page.$$('tr[data-wbs-dict] input, tr[data-wbs-dict] textarea')).length === 0, null);
    await page.getByRole('tab', { name: /Árbol/ }).click(); await page.waitForTimeout(150);
    check('lectura: árbol sin edición', (await page.$$('[data-wbs-input], select.wbs-kind')).length === 0 && !(await page.isVisible('text=Plantillas de EDT')) && !(await page.isVisible('text=Agregar hijo')), null);
    await openRowMenu(page, '1.1');
    check('lectura: menú solo con consulta', (await page.$$('.wbs-rowmenu [role=menuitem]')).length === 1, null);
    await page.keyboard.press('Escape');
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(150);

    /* --- plantilla (reemplazo con confirmación) --- */
    await page.getByRole('button', { name: 'Plantillas de EDT' }).click(); await page.waitForSelector('[data-wbs-template]');
    await page.click('[data-wbs-template="andamio"] button'); await page.waitForTimeout(150);
    check('pide confirmación para reemplazar', await page.isVisible('.modal-foot >> text=Reemplazar EDT'), null);
    await page.click('.modal-foot >> text=Reemplazar EDT'); await page.waitForTimeout(900);
    const w4 = await tool(page, 'wbs');
    eq('plantilla: primer nivel', w4.nodes.filter((n) => !n.parentId).sort((a, b) => a.order - b.order).map((n) => n.name), ['Gestión del proyecto', 'Ingeniería', 'Suministro y logística', 'Montaje', 'Certificación y operación', 'Desmontaje y retiro']);
    const perL1 = w4.nodes.filter((n) => !n.parentId).map((p) => w4.nodes.filter((n) => n.parentId === p.id).length);
    check('plantilla: 2 a 4 paquetes por entregable', perL1.every((c) => c >= 2 && c <= 4), perL1);
    sch = await tool(page, 'schedule');
    check('plantilla: actividades anteriores sin vínculo', sch.tasks.every((t) => t.wbsId === null), sch.tasks.map((t) => t.wbsId));
    check('plantilla: diccionario completo', w4.nodes.filter((n) => n.parentId).every((n) => n.description && n.responsible && n.acceptance && n.deliverable), null);

    /* --- plantilla desde el estado vacío (sin confirmación) --- */
    await createProject(page, { name: 'Proyecto vacío', code: 'PRY-TEST-002' });
    await gotoView(page, 'edt');
    await page.click('text=Usar una plantilla'); await page.waitForSelector('[data-wbs-template]');
    await page.click('[data-wbs-template="fases"] button'); await page.waitForTimeout(900);
    const w5 = await tool(page, 'wbs');
    eq('plantilla por fases', w5.nodes.filter((n) => !n.parentId).map((n) => [n.name, n.kind]), [['Inicio', 'fase'], ['Planificación', 'fase'], ['Ejecución', 'fase'], ['Cierre', 'fase']]);

    const cards = await errorCards(page);
    check('sin tarjetas de error', !cards.length, cards);
    check('sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN', e); }
  finally { await browser.close(); }
}

/* =============================================================== teclado, accesibilidad, referencias y casos límite */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    const pid = await seedRich(page);
    await page.waitForSelector('tr[data-wbs-row]');
    await page.evaluate(async (pid) => {
      await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [{ id: 'a1', date: '2026-09-01', amount: 100, taskId: 't_n6_1', wbsId: 'n6_1', category: 'Otros', description: 'Transporte', document: '' }, { id: 'a2', date: '2026-09-02', amount: 50, taskId: null, wbsId: 'n1_1', category: 'Otros', description: 'Papelería', document: '' }], statusUpdates: [], reserves: { contingency: 0, management: 0 } });
      await PM.store.set(PM.paths.tool(pid, 'raci'), { roles: [{ id: 'r1', name: 'Director de proyecto' }], rows: [{ id: 'ra1', wbsId: 'n6', activity: 'Desmontaje y retiro', cells: { r1: 'A' } }, { id: 'ra2', wbsId: 'n2', activity: 'Ingeniería', cells: {} }] });
    }, pid);
    await page.waitForTimeout(300);
    const snapshot = JSON.stringify((await tool(page, 'wbs')).nodes);
    const active = () => page.evaluate(() => { const a = document.activeElement; if (!a || !a.dataset) return null; const tr = a.closest('tr'); const c = tr ? tr.dataset.code : ''; return a.dataset.wbsName ? 'name:' + c : a.dataset.wbsInput ? 'input:' + c : a.dataset.wbsCode ? 'code:' + c : a.tagName.toLowerCase() + ':' + c; });

    /* --- recorrer con Tab no edita ni reestructura la EDT --- */
    await page.focus('tr[data-code="1.1"] [data-wbs-code]');
    const seen = new Set();
    for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(30); seen.add(await active()); }
    await page.waitForTimeout(900);
    check('Tab recorre nombres y códigos de varias filas', [...seen].filter((x) => /^name:/.test(x)).length >= 3 && [...seen].some((x) => /^code:1\.1\.2/.test(x)), [...seen]);
    check('Tab no abre la edición de nombres', (await page.$$('[data-wbs-input]')).length === 0, null);
    eq('Tab no modifica la EDT', JSON.stringify((await tool(page, 'wbs')).nodes), snapshot);

    /* --- teclado sobre el nombre: ↑/↓, F2, Enter, Esc --- */
    await page.focus('tr[data-code="1.2"] [data-wbs-name]');
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80);
    eq('↓ sobre el nombre pasa a la fila siguiente', await active(), 'name:1.2.1');
    check('enfocar un nombre selecciona la fila y muestra su diccionario', await page.isVisible('aside.wbs-panel [data-wbs-dict-panel="n2_1"]'), null);
    await page.keyboard.press('F2'); await page.waitForTimeout(80);
    eq('F2 edita el nombre', await active(), 'input:1.2.1');
    await page.keyboard.press('Escape'); await page.waitForTimeout(80);
    eq('Esc termina la edición y deja el foco en la fila', await active(), 'name:1.2.1');
    check('Esc cierra el campo de nombre', (await page.$$('[data-wbs-input]')).length === 0, null);
    await page.keyboard.press('Tab'); await page.waitForTimeout(80);
    check('Tab después de Esc avanza sin cambiar la EDT', (await active()) !== 'name:1.2.1' && JSON.stringify((await tool(page, 'wbs')).nodes) === snapshot, await active());
    await page.focus('tr[data-code="1.2.1"] [data-wbs-name]');
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    eq('Enter sobre el nombre lo edita', await active(), 'input:1.2.1');
    await page.keyboard.press('Escape'); await page.waitForTimeout(80);

    /* --- el código es un botón; clic en la fila abre el diccionario lateral --- */
    eq('el código es un botón', await page.$eval('tr[data-code="1.3.2"] [data-wbs-code]', (el) => el.tagName), 'BUTTON');
    await page.focus('tr[data-code="1.3.2"] [data-wbs-code]');
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    check('Enter en el código abre el diccionario', await page.isVisible('aside.wbs-panel [data-wbs-dict-panel="n3_2"]'), null);
    await page.click('tr[data-code="1.5.1"] td:nth-child(5)'); await page.waitForTimeout(150);
    check('clic en la fila abre el diccionario lateral sin editar', await page.isVisible('aside.wbs-panel [data-wbs-dict-panel="n5_1"]') && (await page.$$('[data-wbs-input]')).length === 0, null);
    await page.click('aside.wbs-panel button[aria-label="Cerrar diccionario"]'); await page.waitForTimeout(100);
    check('cerrar el diccionario lateral', !(await page.isVisible('aside.wbs-panel')), null);

    /* --- estimación propia de un elemento con hijos --- */
    await page.evaluate(async (pid) => { const w = await PM.store.get(PM.paths.tool(pid, 'wbs')); await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: w.nodes.map((n) => (n.id === 'n5' ? { ...n, costEstimate: 7000000 } : n)) }); }, pid);
    await page.waitForTimeout(150);
    await page.click('tr[data-code="1.5"] [data-wbs-code]'); await page.waitForTimeout(150);
    const hint = await page.textContent('aside.wbs-panel');
    check('aviso de estimación propia no sumada', hint.includes('estimación propia de $ 7.000.000'), hint.slice(0, 300));
    check('la estimación propia no altera el consolidado', (await page.$eval('tr[data-code="1.5"] td.wbs-c-money', (td) => td.textContent.trim())) === '$ 12.000.000', null);

    /* --- eliminar limpia referencias en cronograma, costos reales y RACI --- */
    await page.click('tr[data-code="1.6"] [data-wbs-code]'); await page.waitForTimeout(100);
    await page.getByRole('button', { name: 'Eliminar elemento' }).click();
    await page.waitForSelector('.modal');
    check('confirmación de eliminación', /3 elementos que lo componen/.test(await page.textContent('.modal')) && /3 actividades del cronograma/.test(await page.textContent('.modal')), await page.textContent('.modal'));
    await page.click('.modal-foot >> text=Eliminar 4 elementos'); await page.waitForTimeout(1000);
    const sch = await tool(page, 'schedule'); const costs = await tool(page, 'costs'); const raci = await tool(page, 'raci');
    check('eliminar: actividades sin vínculo', ['t_n6_1', 't_n6_2', 't_n6_3'].every((id) => sch.tasks.find((t) => t.id === id).wbsId === null) && sch.tasks.find((t) => t.id === 't_n1_1').wbsId === 'n1_1', sch.tasks.map((t) => t.wbsId));
    check('eliminar: costos reales sin vínculo', costs.actuals.find((a) => a.id === 'a1').wbsId === null && costs.actuals.find((a) => a.id === 'a2').wbsId === 'n1_1', costs.actuals);
    check('eliminar: filas RACI sin vínculo', raci.rows.find((r) => r.id === 'ra1').wbsId === null && raci.rows.find((r) => r.id === 'ra2').wbsId === 'n2' && raci.rows.find((r) => r.id === 'ra1').cells.r1 === 'A', raci.rows);
    check('eliminar: selección pasa al hermano anterior', await page.isVisible('aside.wbs-panel [data-wbs-dict-panel="n5"]'), null);

    /* --- solo lectura: panel sin campos --- */
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    await page.click('tr[data-code="1.4.1"] [data-wbs-code]'); await page.waitForTimeout(150);
    check('lectura: diccionario lateral sin campos', (await page.$$('aside.wbs-panel input, aside.wbs-panel textarea, aside.wbs-panel select')).length === 0 && !(await page.isVisible('aside.wbs-panel >> text=Crear actividad para este paquete')), null);
    check('lectura: nombres no enfocables', (await page.$$('[data-wbs-name][tabindex]')).length === 0, null);
    check('lectura: sin arrastre', (await page.$$('.wbs-code-btn.is-draggable')).length === 0, null);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(150);

    /* --- diagrama: niveles, paquetes, teclado --- */
    const w = await tool(page, 'wbs');
    const leaves = w.nodes.filter((n) => !w.nodes.some((m) => m.parentId === n.id)).length;
    await page.getByRole('tab', { name: /Diagrama/ }).click(); await page.waitForTimeout(200);
    eq('diagrama: paquetes de trabajo destacados', await page.$$eval('svg .wbs-dg-wp', (b) => b.length), leaves);
    eq('diagrama: primer nivel', await page.$$eval('svg .wbs-dg-l1', (b) => b.length), w.nodes.filter((n) => !n.parentId).length);
    check('diagrama: colores solo con variables CSS', await page.$eval('.wbs-chart svg', (svg) => ![...svg.querySelectorAll('*')].some((el) => ['fill', 'stroke'].some((a) => { const v = el.getAttribute(a); return v && /#|rgb/.test(v); }))), null);
    await page.getByRole('group', { name: 'Niveles visibles' }).getByRole('button', { name: '2', exact: true }).click(); await page.waitForTimeout(150);
    eq('diagrama: filtro de nivel 2', await page.$$eval('svg .wbs-dg-box', (b) => b.length), 1 + w.nodes.filter((n) => !n.parentId).length);
    check('diagrama: indica elementos ocultos', (await page.$$('svg text.wbs-dg-more')).length > 0, null);
    await page.getByRole('group', { name: 'Niveles visibles' }).getByRole('button', { name: 'Todos' }).click(); await page.waitForTimeout(150);
    await page.focus('g.wbs-dg-box[data-id="n4_2_1"]'); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    check('diagrama: Enter en una caja abre el diccionario', await page.isVisible('.modal [data-wbs-dict-panel="n4_2_1"]'), null);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    check('diagrama: Esc cierra el diccionario', !(await page.isVisible('.modal')), null);

    /* --- el diccionario cabe a 1360 px sin desplazamiento horizontal --- */
    await page.getByRole('tab', { name: /Diccionario/ }).click(); await page.waitForTimeout(250);
    const fit = await page.$eval('table.wbs-dict', (t) => ({ t: t.offsetWidth, w: t.parentElement.clientWidth }));
    check('diccionario: todas las columnas visibles a 1360 px', fit.t <= fit.w + 1, fit);

    await page.getByRole('tab', { name: /Árbol/ }).click(); await page.waitForTimeout(150);

    /* --- plantilla de construcción --- */
    await page.getByRole('button', { name: 'Plantillas de EDT' }).click(); await page.waitForSelector('[data-wbs-template]');
    await page.click('[data-wbs-template="construccion"] button'); await page.waitForTimeout(150);
    await page.click('.modal-foot >> text=Reemplazar EDT'); await page.waitForTimeout(900);
    const wc = await tool(page, 'wbs');
    eq('plantilla de construcción', wc.nodes.filter((n) => !n.parentId).map((n) => n.name), ['Gestión del proyecto', 'Estudios, diseños y permisos', 'Obras preliminares', 'Cimentación y estructura', 'Mampostería e instalaciones', 'Acabados y entrega']);
    check('plantilla: sin nodos de la EDT anterior', !wc.nodes.some((n) => /^n\d/.test(n.id)), null);

    /* --- solo lectura con EDT vacía --- */
    await createProject(page, { name: 'Proyecto sin EDT', code: 'PRY-TEST-003' });
    await gotoView(page, 'edt');
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    check('lectura: vacío sin acciones', (await page.textContent('.empty')).includes('Este proyecto aún no tiene EDT') && (await page.$$('.empty button')).length === 0 && !(await page.isVisible('text=Plantillas de EDT')), null);

    check('teclado: sin tarjetas de error', !(await errorCards(page)).length, null);
    check('teclado: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN', e); }
  finally { await browser.close(); }
}

/* =============================================================== EDT desde los entregables del enunciado del alcance (5.3 → 5.4) */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  try {
    /* sin enunciado del alcance: el estado vacío no ofrece la opción */
    await createProject(page, { name: 'Proyecto sin enunciado', code: 'PRY-TEST-010' });
    await gotoView(page, 'edt');
    check('alcance: sin enunciado no se ofrece crear desde él', (await page.isVisible('text=Agregar primer entregable')) && !(await page.$('[data-wbs-from-scope]')), null);

    /* enunciado aprobado (Rev. 0) con 3 entregables, una fila en blanco y una fila dañada */
    const pid = await createProject(page, { name: 'Proyecto con enunciado', code: 'PRY-TEST-011' });
    const ENT = [
      { id: 'r1', entregable: 'Diseño del andamio', descripcion: 'Planos de montaje, memoria de cálculo y plan de rescate.', criterioAceptacion: 'Aprobación escrita de la interventoría.' },
      { id: 'r2', entregable: 'Andamio montado por etapas', descripcion: 'Etapas de los niveles 1–5, 6–10 y 11–15.', criterioAceptacion: 'Tarjeta verde de la persona competente.' },
      { id: 'r3', entregable: 'Desmontaje y retiro', descripcion: 'Andamio desmontado y transportado a bodega.', criterioAceptacion: '' },
    ];
    await page.evaluate(async ({ pid, ENT }) => {
      await PM.store.set(PM.paths.doc(pid, 'enunciado-alcance'), { template: 'enunciado-alcance', title: 'Enunciado del alcance del proyecto', status: 'aprobado', rev: '0', fields: { entregablesAlcance: [ENT[0], { id: 'r0', entregable: '', descripcion: '  ', criterioAceptacion: '' }, null, ENT[1], ENT[2]] }, titleBlock: {}, createdAt: PM.nowIso(), updatedAt: PM.nowIso() });
    }, { pid, ENT });
    await gotoView(page, 'edt');
    await page.waitForSelector('[data-wbs-from-scope]', { timeout: 5000 });
    check('alcance: el estado vacío ofrece crear desde el enunciado', await page.isVisible('[data-wbs-from-scope]'), null);
    check('alcance: es la acción principal', await page.$eval('[data-wbs-from-scope]', (b) => b.classList.contains('btn-primary')) && !(await page.$eval('.empty button:has-text("Agregar primer entregable")', (b) => b.classList.contains('btn-primary'))), null);
    check('alcance: el texto cuenta los entregables', (await page.textContent('.empty')).includes('registra 3 entregables'), await page.textContent('.empty'));
    await shot(page, 'edt-vacia-con-enunciado');
    await page.click('[data-wbs-from-scope]'); await page.waitForTimeout(900);
    const ws = await tool(page, 'wbs');
    const top = (ws.nodes || []).filter((n) => !n.parentId).sort((a, b) => a.order - b.order);
    eq('alcance: primer nivel = entregables del enunciado', top.map((n) => [n.name, n.description, n.acceptance, n.kind, n.order]), ENT.map((r, i) => [r.entregable, r.descripcion, r.criterioAceptacion, 'entregable', i + 1]));
    eq('alcance: solo el primer nivel (sin filas vacías ni dañadas)', ws.nodes.length, 3);
    eq('alcance: árbol visible', (await rows(page)).slice(1).map((r) => r[0]), ['1.1', '1.2', '1.3']);
    check('alcance: tipo «Entregable» (no paquete de trabajo)', (await page.textContent('tr[data-code="1.1"]')).includes('Entregable') && !(await page.textContent('tr[data-code="1.1"]')).includes('Paquete de trabajo'), await page.textContent('tr[data-code="1.1"]'));
    check('alcance: aviso de lo que sigue', (await page.textContent('body')).includes('Descompón cada uno en paquetes de trabajo'), null);

    /* también desde «Plantillas de EDT», con reemplazo confirmado */
    await page.getByRole('button', { name: 'Plantillas de EDT' }).click(); await page.waitForSelector('[data-wbs-template="enunciado"]');
    const card = await page.textContent('[data-wbs-template="enunciado"]');
    await shot(page, 'plantillas-con-enunciado');
    check('alcance: tarjeta en las plantillas con revisión y estado', card.includes('Rev. 0') && card.includes('Aprobado') && card.includes('Desmontaje y retiro') && card.includes('3 entregables de primer nivel · 2 con criterios de aceptación'), card);
    check('alcance: la tarjeta va primero', (await page.$$eval('[data-wbs-template]', (els) => els.map((e) => e.dataset.wbsTemplate)))[0] === 'enunciado', null);
    await page.click('[data-wbs-template="enunciado"] button'); await page.waitForTimeout(150);
    check('alcance: reemplazo pide confirmación', (await page.textContent('.modal')).includes('3 entregables del enunciado del alcance') && await page.isVisible('.modal-foot >> text=Reemplazar EDT'), await page.textContent('.modal'));
    await page.click('.modal-foot >> text=Reemplazar EDT'); await page.waitForTimeout(900);
    const ws2 = await tool(page, 'wbs');
    check('alcance: reemplazo con nodos nuevos', ws2.nodes.length === 3 && !ws2.nodes.some((n) => ws.nodes.some((o) => o.id === n.id)), ws2.nodes.map((n) => n.id));

    /* solo lectura: sin la acción */
    await page.evaluate(async (pid) => { await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [] }); }, pid); await page.waitForTimeout(300);
    check('alcance: vuelve al estado vacío', await page.isVisible('[data-wbs-from-scope]'), null);
    await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
    check('alcance: en lectura no se ofrece', !(await page.$('[data-wbs-from-scope]')), null);
    await page.evaluate(() => PM.setState({ canWrite: true })); await page.waitForTimeout(150);

    /* 400 px: los tres botones caben sin desborde */
    await page.setViewportSize({ width: 400, height: 860 }); await page.waitForTimeout(250);
    const o = await horizontalOverflow(page);
    check('alcance: 400 px sin desborde horizontal', o <= 1, o);
    await shot(page, 'edt-vacia-con-enunciado-movil');

    check('alcance: sin tarjetas de error', !(await errorCards(page)).length, null);
    check('alcance: sin errores de consola', !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN', e); }
  finally { await browser.close(); }
}

/* =============================================================== capturas y rendimiento con datos de ejemplo */
for (const mode of [{ name: 'claro', dark: false, width: 1360 }, { name: 'oscuro', dark: true, width: 1360 }, { name: 'movil', dark: false, width: 400 }]) {
  const { browser, page, errors } = await openApp({ file, width: mode.width, height: mode.width < 500 ? 860 : 900, dark: mode.dark });
  try {
    await seedRich(page);
    await page.waitForTimeout(400);
    await page.waitForSelector('tr[data-wbs-row]');
    const ov = async (label) => { const o = await horizontalOverflow(page); check(`${mode.name}: sin desborde horizontal (${label})`, o <= 1, o); };
    eq(`${mode.name}: cambios desde la línea base`, await page.textContent('[data-wbs-bl-changes]'), '1 agregado · 1 eliminado · 1 renombrado desde LB0');
    check(`${mode.name}: consolidado de avance visible`, await page.isVisible('th:has-text("Avance")'), null);
    await ov('árbol');
    if (mode.width < 500) {
      await shot(page, 'movil-arbol');
      await page.click('tr[data-code="1.4.2"] .wbs-code-btn'); await page.waitForTimeout(200);
      check('móvil: diccionario en modal', await page.isVisible('.modal #wbs-f-description-m'), null);
      await ov('modal');
      await shot(page, 'movil-diccionario-modal');
      await page.click('.modal-foot >> text=Listo'); await page.waitForTimeout(100);
      await editName(page, '1.4.2');
      const nameVisible = await page.$eval('tr[data-code="1.4.2"] [data-wbs-input]', (el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1 && r.width >= 120; });
      check('móvil: el nombre se puede editar sin desplazar', nameVisible, null);
    } else {
      await page.click('tr[data-code="1.4.2.1"] .wbs-code-btn'); await page.waitForTimeout(200);
      await shot(page, 'arbol-' + mode.name);
    }
    await page.getByRole('tab', { name: /Diagrama/ }).click(); await page.waitForTimeout(250);
    eq(`${mode.name}: cajas del diagrama`, await page.$$eval('svg .wbs-dg-box', (b) => b.length), 27);
    await ov('diagrama');
    if (mode.width < 500) {
      check('móvil: disposición vertical por defecto', (await page.getAttribute('button[aria-pressed="true"]:has-text("Vertical")', 'aria-pressed')) === 'true', null);
      check('móvil: diagrama cabe sin desplazamiento a 100 %', await page.$eval('.wbs-chart', (el) => el.scrollWidth <= el.clientWidth + 1) && (await page.textContent('.wbs-zoom-v')).trim() === '100 %', await page.textContent('.wbs-zoom-v'));
    } else {
      check(`${mode.name}: horizontal por defecto y legible al ajustar`, Number((await page.textContent('.wbs-zoom-v')).replace(/\D/g, '')) >= 85, await page.textContent('.wbs-zoom-v'));
    }
    await shot(page, 'diagrama-' + mode.name);
    if (mode.width > 500) {
      await page.getByRole('button', { name: 'Vertical' }).click(); await page.waitForTimeout(150);
      eq(`${mode.name}: disposición vertical conserva las cajas`, await page.$$eval('svg .wbs-dg-box', (b) => b.length), 27);
      check(`${mode.name}: vertical es angosto`, await page.$eval('.wbs-chart svg', (el) => el.viewBox.baseVal.width < 400), null);
      await shot(page, 'diagrama-vertical-' + mode.name);
      await page.getByRole('button', { name: 'Horizontal' }).click(); await page.waitForTimeout(100);
    }
    if (mode.width > 500) {
      await page.getByRole('button', { name: 'Ajustar' }).click();
      await page.getByRole('button', { name: 'Acercar' }).click(); await page.getByRole('button', { name: 'Acercar' }).click(); await page.waitForTimeout(150);
      const box = await page.$('g.wbs-dg-box[data-id="n4_2"]'); await box.hover(); await page.waitForTimeout(150);
      check(`${mode.name}: tooltip del diagrama`, (await page.textContent('.chart-tip')).includes('Montaje niveles 6 a 10'), null);
      await shot(page, 'diagrama-zoom-' + mode.name);
      await page.getByRole('button', { name: 'Ajustar' }).click();
    }
    await page.getByRole('tab', { name: /Diccionario/ }).click(); await page.waitForTimeout(200);
    await ov('diccionario');
    await shot(page, 'diccionario-' + mode.name);
    await page.getByRole('tab', { name: /Árbol/ }).click(); await page.waitForTimeout(150);

    if (mode.name === 'claro') {
      /* rendimiento: 320 elementos y 300 actividades */
      await page.evaluate(async () => {
        const pid = PM.getState().projectId; const nodes = []; const tasks = [];
        for (let i = 0; i < 8; i++) { nodes.push({ id: 'b' + i, parentId: null, name: 'Entregable ' + (i + 1), order: i + 1 }); for (let j = 0; j < 39; j++) { const id = 'b' + i + '_' + j; nodes.push({ id, parentId: 'b' + i, name: 'Paquete de trabajo ' + (i + 1) + '.' + (j + 1), order: j + 1, costEstimate: 1000000 }); if (tasks.length < 300) tasks.push({ id: 't' + id, name: 'Actividad ' + id, wbsId: id, duration: 3, deps: tasks.length ? [{ id: tasks[tasks.length - 1].id, type: 'FS', lag: 0 }] : [], progress: 0, cost: 1000000 }); } }
        await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes });
        await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 6, holidaysCO: true }, tasks });
      });
      await page.waitForFunction(() => document.querySelectorAll('tr[data-wbs-row]').length === 321, null, { timeout: 10000 });
      await editName(page, '1.4.20');
      const t0 = Date.now();
      await page.keyboard.type('xxxxxxxxxx');
      const ms = Date.now() - t0;
      check(`rendimiento: 10 teclas con 320 elementos en ${ms} ms`, ms < 2500, ms);
      await page.getByRole('tab', { name: /Diagrama/ }).click();
      const t1 = Date.now(); await page.waitForFunction(() => document.querySelectorAll('svg .wbs-dg-box').length === 321, null, { timeout: 10000 });
      check(`rendimiento: diagrama de 320 elementos en ${Date.now() - t1} ms`, Date.now() - t1 < 3000, null);
      await page.getByRole('tab', { name: /Diccionario/ }).click(); await page.waitForTimeout(200);
      check('diccionario paginado (50 filas)', (await page.$$('tr[data-wbs-dict]')).length === 50 && (await page.textContent('[data-wbs-pager]')).includes('Mostrando 1–50 de 320'), await page.textContent('[data-wbs-pager]'));
      await page.getByRole('button', { name: 'Siguiente' }).click(); await page.waitForTimeout(100);
      check('diccionario: página siguiente', (await page.textContent('[data-wbs-pager]')).includes('51–100'), null);
      const td = 'tr[data-wbs-dict] input[aria-label^="Responsable"]';
      await page.click(td);
      const t2 = Date.now(); await page.keyboard.type('xxxxxxxxxx');
      check(`rendimiento: 10 teclas en el diccionario en ${Date.now() - t2} ms`, Date.now() - t2 < 2500, null);
    }
    const cards = await errorCards(page);
    check(`${mode.name}: sin tarjetas de error`, !cards.length, cards);
    check(`${mode.name}: sin errores de consola`, !errors.length, errors);
  } catch (e) { fails++; console.error('EXCEPCIÓN', mode.name, e); }
  finally { await browser.close(); }
}

console.log(`\n${total - fails}/${total} correctas`);
process.exit(fails ? 1 : 0);

// Pruebas de interacción de 42-resources: catálogo de recursos (§10.4).
// Uso: node test/resources-catalog.test.mjs --file <página con --include 42,12,13> [--shots dir]
// Cubre: estado vacío, alta con validación (nombre obligatorio y único), edición, recursos virtuales → clasificar
// (uno a uno y en lote), renombrar (actualiza las asignaciones), tipos del proyecto (agregar, renombrar, reordenar,
// eliminar sin uso y con reasignación, presets combinar y reemplazar), recursos no planificados con línea base (cada
// motivo: riesgo con reserva para contingencias, sustitución, todo costo, rendimiento, cambio de alcance con solicitud
// CC-00x en el registro de cambios, reserva de gestión pendiente y registrada desde el catálogo), eliminar con
// asignaciones (quitar o conservar por nombre), búsqueda, filtros, orden, exportación CSV, teclado, solo lectura,
// 300 recursos con 500 actividades, tema oscuro, 400 px, 1360/1440 px (tabla compacta) y 1920 px.
// Regresiones de la revisión integral: la solicitud de cambio se registra al guardar el recurso (cancelar no deja
// solicitudes huérfanas ni duplicadas), fecha de alta y de la solicitud = hoy, aviso de la reserva estimada del riesgo,
// solicitud de la reserva de gestión (tipo, costo obligatorio y fuente), casilla del equipo ágil para recursos de trabajo
// que no son de personal, foco tras eliminar recursos y tipos, plural de las unidades, tipo sugerido según el proyecto,
// clase conservada al reasignar tipos y confirmación al cambiarla, disponibilidad heredada de resourceLimits, renombrar
// al nombre de un «Sin clasificar» y recursos importados sin id.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
// Los recursos se guardan compactos (PM.res.compact): los campos vacíos o con su valor por omisión no están en el documento.
import { openApp, createProject, errorCards, horizontalOverflow } from './harness.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const ok = (name, cond, info) => { results.push({ name, ok: !!cond, info }); console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond || info === undefined ? '' : '\n      ' + JSON.stringify(info).slice(0, 500))); };
async function step(name, fn) { try { await fn(); } catch (e) { ok(name + ' (excepción)', false, String((e && e.stack) || e).split('\n').slice(0, 5).join(' | ')); } }
const sleep = (page, ms) => page.waitForTimeout(ms);
const STATUS = '2026-10-02';

/* vista de prueba que muestra el catálogo (la vista real «recursos» la registra 40-schedule) */
async function mountView(page) {
  await page.evaluate(() => {
    const { html } = PM.lib;
    PM.registerView({ id: 'prueba-catalogo', label: 'Catálogo de prueba', group: 'planificacion', icon: 'resources', order: 999,
      component: () => html`<div class="page"><${PM.ui.PageHeader} eyebrow="9.2 Estimar los recursos de las actividades" title="Recursos" /><${PM.ResourceCatalog} /></div>` });
  });
}
const goto = async (page) => { await page.evaluate(() => PM.navigate('prueba-catalogo')); await sleep(page, 600); };
const readTool = (page, pid, tool) => page.evaluate(async ({ pid, tool }) => { await PM.flushAll(); return PM.store.get(PM.paths.tool(pid, tool)); }, { pid, tool });
const readDoc = (page, pid, id) => page.evaluate(async ({ pid, id }) => { await PM.flushAll(); return PM.store.get(PM.paths.doc(pid, id)); }, { pid, id });
/* solicitudes de cambio del proyecto: filas del registro de cambios y documentos solicitud-cambio--… */
const changeState = (page, pid) => page.evaluate(async (pid) => {
  await PM.flushAll();
  const reg = await PM.store.get(PM.paths.doc(pid, 'registro-cambios'));
  const docs = await PM.store.list(PM.paths.docs(pid));
  return { rows: ((reg && reg.fields && reg.fields.cambios) || []).map((r) => r.id), docs: docs.filter((d) => /^solicitud-cambio--/.test(d.id)).length };
}, pid);
const top = (page) => page.locator('.modal[role="dialog"]').last();
const modalCount = (page) => page.locator('.modal[role="dialog"]').count();
const bar = (page) => page.locator('[data-rcat-bar]');
const row = (page, name) => page.locator('tr[data-rcat-row="' + name + '"]');
const tile = (page, id) => page.locator('[data-tile="' + id + '"] .rcat-tile-value').innerText();
const itemByName = (doc, name) => (doc && doc.items || []).find((x) => x.name === name);
const itemByNameIn = (doc) => itemByName(doc, 'Recurso de prueba del flujo');
/* NumberInput cambia el texto mostrado al enfocarse (formato → borrador): se enfoca antes de escribir */
const fillNum = async (loc, v) => { await loc.focus(); await loc.page().waitForTimeout(60); await loc.fill(String(v)); };
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a ? { id: a.id, tag: a.tagName, text: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 60), type: a.type || '' } : null; });

/* alta de un recurso con línea base: responde la pregunta y, si es no planificado, elige el motivo */
async function addUnplanned(page, { name, typeId, reason, before }) {
  await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
  await sleep(page, 250);
  const ed = top(page);
  await ed.locator('#rce-name').fill(name);
  if (typeId) await ed.locator('#rce-type').selectOption(typeId);
  await ed.getByText('No, es un recurso no planificado').click();
  await ed.getByRole('button', { name: 'Continuar: motivo' }).click();
  await sleep(page, 350);
  const fl = top(page);
  await fl.locator('label[data-choice="' + reason + '"]').click();
  await sleep(page, 120);
  if (before) await before(fl);
  return fl;
}

/* ================================================================= sesión 1: escritorio, tema claro */
{
  const { browser, page, errors } = await openApp({ file, width: 1360, height: 900 });
  await mountView(page);
  const pid = await createProject(page, { lifecycle: 'Predictivo', statusDate: STATUS });
  await sleep(page, 300);
  /* fecha de alta y de las solicitudes de cambio: la de hoy (no la fecha de corte del proyecto) */
  const TODAY = await page.evaluate(() => PM.date.today());
  let crId = null;

  await step('estado vacío', async () => {
    await goto(page);
    const txt = await page.locator('.view-host').innerText();
    ok('vacío: explica qué aparecerá y ofrece agregar', /Aún no hay recursos en el catálogo/.test(txt) && /Sin clasificar/.test(txt) && await page.getByRole('button', { name: 'Agregar recurso' }).count() === 1, txt.slice(0, 300));
  });

  await step('alta con validación', async () => {
    await page.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 300);
    const ed = top(page);
    ok('editor: título y foco en el nombre', /Nuevo recurso/.test(await ed.innerText()) && (await active(page)).id === 'rce-name', await active(page));
    ok('editor: sin línea base no pregunta si estaba en el plan', await ed.locator('[data-rcat-ask]').count() === 0 && await ed.locator('[data-rcat-plan="si"]').count() === 1);
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 150);
    ok('validación: nombre obligatorio con mensaje visible y foco', /Escribe el nombre del recurso/.test(await ed.innerText()) && (await active(page)).id === 'rce-name');
    await ed.locator('#rce-name').fill('Cuadrilla de montaje');
    await ed.locator('#rce-name').press('Tab');
    await sleep(page, 100);
    ok('al salir del nombre sugiere el tipo', (await ed.locator('#rce-type').inputValue()) === 'humano' && /Sugerido según el nombre/.test(await ed.innerText()), await ed.locator('#rce-type').inputValue());
    await ed.locator('#rce-type').selectOption('humano');
    await ed.locator('#rce-subtype').fill('Montadores');
    await ed.locator('#rce-unit').fill('cuadrilla');
    await ed.locator('#rce-avail').fill('3');
    await ed.locator('#rce-cost').fill('450000');
    await ed.locator('#rce-resp').fill('Supervisor de montaje');
    ok('persona: muestra equipo ágil, dedicación y ausencias', await ed.locator('#rce-agile').count() === 1 && await ed.locator('#rce-ded').count() === 1 && /Agregar ausencia/.test(await ed.innerText()));
    await ed.getByRole('button', { name: 'Agregar ausencia' }).click();
    await sleep(page, 100);
    const absTo = ed.locator('[data-rcat-abs] input[type="date"]').nth(1);
    await absTo.fill('2026-09-05');
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 150);
    ok('validación: ausencia sin fecha de inicio', /Escribe la fecha de inicio/.test(await ed.innerText()));
    await ed.locator('[data-rcat-abs] input[type="date"]').nth(0).fill('2026-09-01');
    await ed.locator('[data-rcat-abs] input[aria-label^="Nota"]').fill('Capacitación en alturas');
    await ed.locator('#rce-name').press('Enter');
    await sleep(page, 400);
    ok('al guardar se cierra el editor', await modalCount(page) === 0);
    const doc = await readTool(page, pid, 'resources');
    const it = itemByName(doc, 'Cuadrilla de montaje');
    ok('alta: código, tipo, unidad, disponibilidad, costo, fecha de alta y ausencia', it && it.code === 'REC-001' && it.typeId === 'humano' && it.subtype === 'Montadores' && it.unit === 'cuadrilla' && it.availability === 3 && it.unitCost === 450000 && it.addedDate === TODAY && it.planned !== false && it.absences.length === 1 && it.absences[0].from === '2026-09-01' && it.absences[0].note === 'Capacitación en alturas', it);
    ok('la fila aparece en la tabla', await row(page, 'Cuadrilla de montaje').count() === 1);
  });

  await step('nombre único sin distinguir mayúsculas', async () => {
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 250);
    const ed = top(page);
    await ed.locator('#rce-name').fill('cuadrilla DE MONTAJE');
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 150);
    ok('nombre duplicado: error visible', /Ya existe un recurso llamado/.test(await ed.innerText()));
    await page.keyboard.press('Escape');
    await sleep(page, 200);
    ok('Escape cierra el editor sin guardar', await modalCount(page) === 0 && (await readTool(page, pid, 'resources')).items.length === 1);
  });

  await step('recurso de trabajo que no es una persona (proyecto predictivo)', async () => {
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 250);
    const ed = top(page);
    await ed.locator('#rce-name').fill('Compresor de aire');
    await ed.locator('#rce-type').selectOption('maquinaria');
    await sleep(page, 100);
    const t = await ed.innerText();
    ok('sin casilla de equipo ágil; la sección se llama «Disponibilidad en el tiempo» y «Periodos no disponibles» aparece una vez', await ed.locator('#rce-agile').count() === 0 && (await ed.locator('[data-rcat-time]').innerText()).trim() === 'Disponibilidad en el tiempo' && (t.match(/Periodos no disponibles/g) || []).length === 1, (t.match(/Periodos no disponibles/g) || []).length);
    await page.keyboard.press('Escape');
    await sleep(page, 200);
  });

  await step('editar', async () => {
    await row(page, 'Cuadrilla de montaje').locator('button.rcat-link').first().click();
    await sleep(page, 300);
    const ed = top(page);
    ok('editor de un recurso existente', /Editar REC-001/.test(await ed.innerText()) && (await ed.locator('#rce-cost').inputValue()).replace(/\D/g, '') === '450000');
    await fillNum(ed.locator('#rce-cost'), '500000');
    await ed.locator('#rce-status').selectOption('disponible');
    await ed.getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 400);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Cuadrilla de montaje');
    ok('edición guardada', it.unitCost === 500000 && it.status === 'disponible' && it.code === 'REC-001', it);
    ok('la fila muestra el costo y el estado', /\$ 500\.000/.test(await row(page, 'Cuadrilla de montaje').innerText()) && /Disponible/.test(await row(page, 'Cuadrilla de montaje').innerText()));
  });

  await step('recursos virtuales del cronograma', async () => {
    const rid = (await readTool(page, pid, 'resources')).items[0].id;
    await page.evaluate(async ({ pid, rid }) => {
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 6, holidaysCO: true, extraHolidays: [], resourceLimits: { 'Camión grúa': 1 } }, tasks: [
        { id: 't1', name: 'Montaje niveles 1 a 5', duration: 10, deps: [], cost: 9000000, costMode: 'recursos', resources: [{ resourceId: rid, name: 'Cuadrilla de montaje', units: 2 }, { name: 'Camión grúa', units: 1 }] },
        { id: 't2', name: 'Montaje niveles 6 a 10', duration: 8, deps: [], cost: 8000000, resources: [{ name: 'Cuadrilla de montaje', units: 1 }, { name: 'Concreto 3000 psi', units: 1, qty: 12 }] },
        { id: 't3', name: 'Inspección de certificación', duration: 2, deps: [], cost: 600000, resources: [{ name: 'Inspector de alturas', units: 1 }] },
      ] });
    }, { pid, rid });
    await sleep(page, 500);
    ok('indicadores: total y sin clasificar', (await tile(page, 'total')) === '4' && (await tile(page, 'sin-clasificar')) === '3', [await tile(page, 'total'), await tile(page, 'sin-clasificar')]);
    const r = await row(page, 'Camión grúa').innerText();
    ok('virtual: sin clasificar, disponibilidad de resourceLimits y botón Clasificar', /Sin clasificar/.test(r) && /1 por día/.test(r) && await row(page, 'Camión grúa').getByRole('button', { name: 'Clasificar «Camión grúa»' }).count() === 1, r);
    const u = await row(page, 'Cuadrilla de montaje').innerText();
    ok('uso: actividades, días-recurso y costo', /2 actividades/.test(u) && /28 días-recurso/.test(u) && /\$ 14\.000\.000/.test(u), u);
    await row(page, 'Cuadrilla de montaje').getByRole('button', { name: '2 actividades' }).click();
    await sleep(page, 300);
    const us = await top(page).innerText();
    ok('asignaciones: actividades y si suman al costo', /Asignaciones de «Cuadrilla de montaje»/.test(us) && /Montaje niveles 1 a 5/.test(us) && /Montaje niveles 6 a 10/.test(us) && /No \(precio global\)/.test(us) && /Calculado por recursos/.test(us), us.slice(0, 400));
    await page.keyboard.press('Escape');
    await sleep(page, 150);
  });

  await step('clasificar un virtual', async () => {
    await row(page, 'Camión grúa').getByRole('button', { name: 'Clasificar «Camión grúa»' }).click();
    await sleep(page, 300);
    const ed = top(page);
    const t = await ed.innerText();
    ok('editor de clasificación prellenado y con tipo sugerido', /Clasificar «Camión grúa»/.test(t) && (await ed.locator('#rce-name').inputValue()) === 'Camión grúa' && (await ed.locator('#rce-type').inputValue()) === 'transporte' && /Sugerido según el nombre/.test(t) && (await ed.locator('#rce-avail').inputValue()) === '1', t.slice(0, 300));
    ok('clasificar no pregunta por el plan', await ed.locator('[data-rcat-ask]').count() === 0);
    await ed.locator('#rce-cost').fill('800000');
    await ed.getByRole('button', { name: 'Guardar en el catálogo' }).click();
    await sleep(page, 400);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Camión grúa');
    ok('virtual guardado con id y código', it && !String(it.id).startsWith('v:') && it.code === 'REC-002' && it.typeId === 'transporte' && it.availability === 1 && it.unitCost === 800000 && !('virtual' in it), it);
    ok('sin clasificar baja a 2', (await tile(page, 'sin-clasificar')) === '2');
  });

  await step('clasificar los sin clasificar (en lote)', async () => {
    await bar(page).getByRole('button', { name: 'Clasificar los sin clasificar' }).click();
    await sleep(page, 300);
    const dl = top(page);
    const rows = await dl.locator('tr[data-rcat-crow]').count();
    const conc = dl.locator('tr[data-rcat-crow="Concreto 3000 psi"]');
    ok('lote: filas y tipos sugeridos', rows === 2 && (await conc.locator('select').inputValue()) === 'material' && (await dl.locator('tr[data-rcat-crow="Inspector de alturas"] select').inputValue()) === 'humano', rows);
    await conc.locator('input[aria-label^="Unidad"]').fill('m³');
    await conc.locator('input[aria-label^="Costo unitario"]').fill('350000');
    await dl.getByRole('button', { name: 'Clasificar 2 recursos' }).click();
    await sleep(page, 400);
    const doc = await readTool(page, pid, 'resources');
    const c = itemByName(doc, 'Concreto 3000 psi'), i = itemByName(doc, 'Inspector de alturas');
    ok('lote: guardados con códigos consecutivos', doc.items.length === 4 && c && c.code === 'REC-003' && c.unit === 'm³' && c.unitCost === 350000 && c.typeId === 'material' && i && i.code === 'REC-004' && i.typeId === 'humano', doc.items.map((x) => [x.code, x.name, x.typeId]));
    ok('sin clasificar en 0 y sin botón de lote', (await tile(page, 'sin-clasificar')) === '0' && await bar(page).getByRole('button', { name: 'Clasificar los sin clasificar' }).count() === 0);
    const cr = await row(page, 'Concreto 3000 psi').innerText();
    ok('consumible: cantidad y costo por unidad', /Consumible/.test(cr) && /por m³/.test(cr) && /12 m³/.test(cr) && /\$ 4\.200\.000/.test(cr), cr);
  });

  await step('renombrar actualiza las asignaciones', async () => {
    await row(page, 'Concreto 3000 psi').getByRole('button', { name: 'Editar «Concreto 3000 psi»' }).click();
    await sleep(page, 300);
    const ed = top(page);
    ok('aviso de renombrar con asignaciones', /Si lo renombras, su asignación en el cronograma toma el nombre nuevo/.test(await ed.innerText()));
    await ed.locator('#rce-name').fill('Concreto de 3.000 psi');
    await ed.getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 500);
    const sch = await readTool(page, pid, 'schedule');
    const res = await readTool(page, pid, 'resources');
    const it = itemByName(res, 'Concreto de 3.000 psi');
    const a = sch.tasks[1].resources[1];
    ok('asignación renombrada y enlazada por id', it && a.name === 'Concreto de 3.000 psi' && a.resourceId === it.id && a.qty === 12, a);
    ok('no aparece un virtual con el nombre anterior', await row(page, 'Concreto 3000 psi').count() === 0 && await row(page, 'Concreto de 3.000 psi').count() === 1);
  });

  await step('tipos de recurso', async () => {
    await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).click();
    await sleep(page, 300);
    const dl = top(page);
    ok('tipos: lista del preset general', await dl.locator('li[data-type]').count() === 8);
    await dl.getByRole('button', { name: 'Agregar tipo' }).click();
    await sleep(page, 150);
    ok('agregar tipo: foco en el nombre nuevo', (await active(page)).id.startsWith('rct-n-'));
    await page.keyboard.type('Topografía');
    const last = dl.locator('li[data-type]').last();
    await last.locator('select[aria-label^="Categoría"]').selectOption('Servicios');
    await dl.locator('li[data-type="herramienta"] input').fill('Herramienta menor');
    await dl.getByRole('button', { name: 'Subir «Material»' }).click();
    await dl.getByRole('button', { name: 'Eliminar el tipo «Software y licencias»' }).click();
    await sleep(page, 100);
    ok('tipo sin uso: se quita sin preguntar y el foco pasa al tipo siguiente', await dl.locator('li[data-type="software"]').count() === 0 && (await active(page)).id.startsWith('rct-n-'), await active(page));
    await dl.getByRole('button', { name: 'Eliminar el tipo «Transporte»' }).click();
    await sleep(page, 150);
    const panel = dl.locator('[data-rcat-move]');
    ok('tipo en uso: pide a qué tipo reasignar (sugiere uno de la misma clase)', await panel.count() === 1 && /tiene 1 recurso/.test(await panel.innerText()) && (await active(page)).id === 'rct-move-to' && (await panel.locator('select').inputValue()) === 'humano', [await active(page), await panel.locator('select').inputValue()]);
    await panel.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 120);
    ok('cancelar la reasignación: el foco vuelve a su botón Eliminar', (await active(page)).id === 'rct-del-transporte' && await dl.locator('[data-rcat-move]').count() === 0, await active(page));
    await page.keyboard.press('Enter');
    await sleep(page, 150);
    await panel.locator('select').selectOption('maquinaria');
    await panel.getByRole('button', { name: 'Eliminar y reasignar' }).click();
    await sleep(page, 150);
    ok('eliminar y reasignar: el foco pasa al nombre del tipo siguiente', (await active(page)).id === 'rct-n-servicio', await active(page));
    ok('conteo tras la reasignación', /^1 recurso$/.test((await dl.locator('li[data-type="maquinaria"] .rcat-trow-n').innerText()).trim()) && await dl.locator('li[data-type="transporte"]').count() === 0);
    await dl.getByRole('button', { name: 'Guardar tipos' }).click();
    await sleep(page, 400);
    const doc = await readTool(page, pid, 'resources');
    const ids = doc.types.map((t) => t.id);
    const topo = doc.types.find((t) => t.name === 'Topografía');
    ok('tipos guardados: nuevo, renombrado, orden, eliminados', topo && topo.edr === 'Servicios' && topo.kind === 'trabajo' && !ids.includes('software') && !ids.includes('transporte') && doc.types.find((t) => t.id === 'herramienta').name === 'Herramienta menor' && ids.indexOf('material') < ids.indexOf('herramienta'), doc.types.map((t) => t.id + ':' + t.name));
    ok('recurso reasignado al tipo elegido', itemByName(doc, 'Camión grúa').typeId === 'maquinaria');
  });

  await step('presets', async () => {
    await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).click();
    await sleep(page, 300);
    let dl = top(page);
    await dl.locator('#rct-preset').selectOption('construccion');
    await dl.getByRole('button', { name: 'Combinar' }).click();
    await dl.getByRole('button', { name: 'Aplicar preset' }).click();
    await sleep(page, 150);
    const msg = await dl.locator('[data-rcat-note="preset"]').innerText();
    ok('combinar: agrega los que faltan', /Se agregaron/.test(msg) && /Mano de obra/.test(msg), msg);
    const n1 = await dl.locator('li[data-type]').count();
    await dl.getByRole('button', { name: 'Guardar tipos' }).click();
    await sleep(page, 400);
    let doc = await readTool(page, pid, 'resources');
    ok('combinar: guardado con el preset', doc.preset === 'construccion' && doc.types.length === n1 && doc.types.some((t) => t.id === 'mano-obra') && doc.types.some((t) => t.name === 'Topografía'), [doc.preset, doc.types.length, n1]);
    await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).click();
    await sleep(page, 300);
    dl = top(page);
    await dl.locator('#rct-preset').selectOption('ti');
    await dl.getByRole('button', { name: 'Reemplazar' }).click();
    await dl.getByRole('button', { name: 'Aplicar preset' }).click();
    await sleep(page, 150);
    const msg2 = await dl.locator('[data-rcat-note="preset"]').innerText();
    const ids2 = await dl.locator('li[data-type]').evaluateAll((els) => els.map((e) => e.dataset.type));
    ok('reemplazar: tipos del preset y conserva los que están en uso', /Se conservaron 3 tipos en uso/.test(msg2) && ids2.includes('personas') && ids2.includes('humano') && ids2.includes('maquinaria') && ids2.includes('material') && !ids2.includes('mano-obra'), [msg2, ids2]);
    await dl.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 200);
    doc = await readTool(page, pid, 'resources');
    ok('cancelar no guarda', doc.preset === 'construccion' && doc.types.some((t) => t.id === 'mano-obra'));
  });

  /* línea base, reservas y registro de riesgos */
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.baseline(pid, 'b0'), { number: 0, label: 'LB0', date: '2026-08-01', includes: ['scope', 'schedule', 'cost'], note: '', changeRef: null, cost: { bac: 17600000, contingency: 10000000, management: 5000000, tasks: [] }, schedule: { start: '2026-08-03', finish: '2026-09-15', tasks: [] } });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [], statusUpdates: [], reserves: { contingency: 10000000, management: 5000000 } });
    const project = await PM.store.get(PM.paths.project(pid));
    const body = PM.newDocBody(PM.templates['registro-riesgos'], { id: pid, ...project }, { template: 'registro-riesgos' });
    body.fields.riesgos = [
      { id: 'R-001', descripcion: 'Lluvias intensas obligan a suspender el montaje en altura', categoria: 'Externo', tipo: 'Amenaza', probabilidad: 4, impacto: 4, estrategia: 'Mitigar', respuesta: 'Carpas y malla adicional', reserva: 4000000, estado: 'Abierto' },
      { id: 'R-002', descripcion: 'Faltantes de piezas en bodega', categoria: 'De la organización', tipo: 'Amenaza', probabilidad: 3, impacto: 3, estrategia: 'Mitigar', reserva: 3000000, estado: 'Abierto' },
    ];
    await PM.store.set(PM.paths.doc(pid, 'registro-riesgos'), body);
  }, pid);
  await sleep(page, 500);

  await step('no planificado: respuesta a un riesgo', async () => {
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 300);
    const ed = top(page);
    ok('con línea base pregunta si estaba en el plan', await ed.locator('[data-rcat-ask]').count() === 1 && /LB0/.test(await ed.locator('[data-rcat-ask]').innerText()));
    await ed.locator('#rce-name').fill('Malla de seguridad adicional');
    await ed.locator('#rce-type').selectOption('material');
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 150);
    ok('pregunta obligatoria', /Indica si el recurso estaba en el plan/.test(await ed.innerText()) && (await active(page)).type === 'radio');
    await ed.getByText('No, es un recurso no planificado').click();
    await ed.getByRole('button', { name: 'Continuar: motivo' }).click();
    await sleep(page, 350);
    const fl = top(page);
    ok('flujo: abre el diálogo de motivo encima del editor', await modalCount(page) === 2 && /Recurso no planificado/.test(await fl.innerText()) && await fl.locator('label[data-choice]').count() === 6);
    const ft = await fl.innerText();
    ok('flujo: cada motivo dice si cambia la línea base', (ft.match(/No cambia la línea base/g) || []).length === 4 && (ft.match(/Requiere solicitud de cambio/g) || []).length === 2 && /Usa la reserva para contingencias/.test(ft));
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 150);
    ok('flujo: motivo obligatorio', /Elige el motivo/.test(await fl.innerText()) && (await active(page)).type === 'radio');
    await fl.locator('label[data-choice="riesgo"]').click();
    await sleep(page, 120);
    ok('riesgo: reserva disponible', /\$ 10\.000\.000/.test(await fl.locator('[data-rcat-available]').innerText()));
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 150);
    ok('riesgo: exige elegir el riesgo', /Elige el riesgo del registro/.test(await fl.innerText()));
    await fl.locator('#rcf-risk').selectOption('R-001');
    await sleep(page, 100);
    ok('riesgo: muestra la respuesta y la reserva del riesgo', /Carpas y malla adicional/.test(await fl.locator('[data-rcat-riskinfo]').innerText()));
    await fl.locator('#rcf-amount').fill('12000000');
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 150);
    ok('riesgo: no supera la reserva disponible', /supera la reserva para contingencias disponible/.test(await fl.innerText()));
    const over = fl.locator('[data-rcat-note="risk-over"]');
    ok('riesgo: avisa que el monto supera la reserva estimada del riesgo', await over.count() === 1 && /supera en \$ 8\.000\.000 la reserva estimada del riesgo R-001/.test(await over.innerText()), await over.count() ? await over.innerText() : null);
    await fl.locator('#rcf-amount').fill('4000000');
    await sleep(page, 100);
    ok('riesgo: igual a la reserva estimada, sin aviso', await fl.locator('[data-rcat-note="risk-over"]').count() === 0);
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 500);
    ok('flujo y editor cerrados', await modalCount(page) === 0);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Malla de seguridad adicional');
    ok('guardado: no planificado, riesgo, reserva, fecha de alta (hoy) y estado «Solicitado»', it && it.planned === false && it.reason === 'riesgo' && it.riskId === 'R-001' && it.reserveAmount === 4000000 && it.addedDate === TODAY && !it.changeRef && it.status === 'solicitado', it);
    const r = await row(page, 'Malla de seguridad adicional').innerText();
    ok('fila: chip «No planificado», motivo y riesgo', /No planificado/.test(r) && /Respuesta a un riesgo identificado/.test(r) && /Riesgo R-001/.test(r), r);
  });

  await step('reserva consumida por otros recursos', async () => {
    const fl = await addUnplanned(page, { name: 'Bomba de achique', typeId: 'maquinaria', reason: 'riesgo' });
    ok('disponible = contingencia − consumido', /\$ 6\.000\.000/.test(await fl.locator('[data-rcat-available]').innerText()), await fl.locator('[data-rcat-available]').innerText());
    await fl.locator('#rcf-risk').selectOption('R-001');
    await sleep(page, 100);
    ok('riesgo: muestra lo que otros recursos ya consumen del mismo riesgo', /ya consumida por otros recursos: \$ 4\.000\.000/.test(await fl.locator('[data-rcat-riskinfo]').innerText()), await fl.locator('[data-rcat-riskinfo]').innerText());
    await fl.locator('#rcf-amount').fill('1000000');
    await sleep(page, 100);
    const over = fl.locator('[data-rcat-note="risk-over"]');
    ok('riesgo: aviso no bloqueante (la suma supera la reserva estimada del riesgo)', await over.count() === 1 && /consumen \$ 5\.000\.000: \$ 1\.000\.000 más que su reserva estimada/.test(await over.innerText()) && (await fl.locator('#rcf-amount').getAttribute('aria-describedby')) === 'rcf-risk-over', await over.count() ? await over.innerText() : null);
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 500);
    ok('segundo consumo guardado pese al aviso', (itemByName(await readTool(page, pid, 'resources'), 'Bomba de achique') || {}).reserveAmount === 1000000);
  });

  await step('motivos que no cambian la línea base', async () => {
    for (const [name, reason] of [['Grúa equivalente', 'sustitucion'], ['Andamio del contratista', 'todo-costo'], ['Cuadrilla de refuerzo', 'rendimiento']]) {
      const fl = await addUnplanned(page, { name, typeId: 'maquinaria', reason });
      ok(reason + ': sin sección de solicitud de cambio ni de reserva', await fl.locator('[data-rcat-cc]').count() === 0 && await fl.locator('[data-rcat-risk]').count() === 0);
      await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
      await sleep(page, 500);
      const it = itemByName(await readTool(page, pid, 'resources'), name);
      ok(reason + ': guardado como no planificado sin solicitud', it && it.planned === false && it.reason === reason && it.changeRef == null && it.riskId == null && it.reserveAmount == null, it);
    }
  });

  await step('cambio de alcance: cancelar no deja solicitudes huérfanas', async () => {
    const fl = await addUnplanned(page, { name: 'Grúa telescópica 50 t', typeId: 'maquinaria', reason: 'cambio-alcance' });
    ok('cambio de alcance: sección de control de cambios con «nueva» elegida', await fl.locator('[data-rcat-cc]').count() === 1 && await fl.locator('label[data-choice="nueva"] input').isChecked() && /cuando se guarda el recurso/.test(await fl.locator('[data-rcat-cc]').innerText()));
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 150);
    ok('justificación obligatoria para registrar', /Escribe la justificación/.test(await fl.innerText()) && (await active(page)).id === 'rcf-just', await active(page));
    await fl.locator('#rcf-just').fill('El cliente cambió la secuencia de fachada y se requiere izaje adicional.');
    await fl.locator('#rcf-cost').fill('7500000');
    let cs = await changeState(page, pid);
    ok('nada se registra antes de guardar el recurso', cs.rows.length === 0 && cs.docs === 0, cs);
    await fl.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 250);
    ok('cancelar el flujo vuelve al editor', await modalCount(page) === 1 && /Nuevo recurso/.test(await top(page).innerText()));
    await top(page).getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 300);
    cs = await changeState(page, pid);
    ok('cancelar: sin solicitud huérfana en el registro de cambios ni documento, y sin recurso', cs.rows.length === 0 && cs.docs === 0 && !itemByName(await readTool(page, pid, 'resources'), 'Grúa telescópica 50 t'), cs);
  });

  await step('cambio de alcance con solicitud CC-001 al guardar', async () => {
    const fl = await addUnplanned(page, { name: 'Grúa telescópica 50 t', typeId: 'maquinaria', reason: 'cambio-alcance' });
    await fl.locator('#rcf-just').fill('El cliente cambió la secuencia de fachada y se requiere izaje adicional.');
    await fl.locator('#rcf-scope').fill('Izaje de plataformas adicionales en la torre 2');
    await fl.locator('#rcf-days').fill('3');
    await fl.locator('#rcf-cost').fill('7500000');
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 900);
    ok('flujo y editor cerrados', await modalCount(page) === 0);
    const reg = await readDoc(page, pid, 'registro-cambios');
    const rowCC = reg && reg.fields.cambios.find((c) => c.id === 'CC-001');
    ok('registro de cambios: fila CC-001 con la fecha de hoy y tipo «Actualización»', rowCC && rowCC.estado === 'Registrada' && rowCC.tipo === 'Actualización' && rowCC.impactoCronograma === 3 && rowCC.impactoCosto === 7500000 && /Grúa telescópica 50 t/.test(rowCC.descripcion) && rowCC.fecha === TODAY && reg.fields.cambios.length === 1, rowCC);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Grúa telescópica 50 t');
    ok('recurso con changeRef y documento', it && it.reason === 'cambio-alcance' && it.changeRef === 'CC-001' && /^solicitud-cambio--/.test(it.changeDocId || '') && it.addedDate === TODAY, it);
    crId = it.changeDocId;
    const sc = await readDoc(page, pid, crId);
    ok('solicitud de cambio prellenada (fecha de hoy, detalle del costo)', sc && sc.fields.codigoCambio === 'CC-001' && sc.fields.decision === 'Registrada' && sc.fields.fechaSolicitud === TODAY && sc.fields.diasCronograma === 3 && sc.fields.valorCosto === 7500000 && sc.fields.elementosAfectados.includes('Línea base del alcance') && /secuencia de fachada/.test(sc.fields.justificacion) && /Fuente de financiación/.test(sc.fields.impactoCosto || ''), sc && sc.fields);
    await row(page, 'Grúa telescópica 50 t').getByRole('button', { name: /Solicitud CC-001/ }).click();
    await sleep(page, 200);
    const st = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
    ok('enlace a la solicitud abre el documento', st.view === 'documento' && st.params.docId === crId, st);
    await goto(page);
  });

  await step('cambiar el motivo no registra otra solicitud', async () => {
    await row(page, 'Grúa telescópica 50 t').getByRole('button', { name: 'Editar «Grúa telescópica 50 t»' }).click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Cambiar el motivo…' }).click();
    await sleep(page, 350);
    const fl = top(page);
    ok('flujo: la solicitud vinculada queda elegida', await fl.locator('label[data-choice="existente"] input').isChecked() && (await fl.locator('#rcf-ref').inputValue()) === 'CC-001');
    await fl.locator('label[data-choice="nueva"]').click();
    await sleep(page, 120);
    ok('«nueva» con una vinculada: advierte que ya existe CC-001', /ya está vinculado con la solicitud CC-001/.test(await fl.locator('[data-rcat-note="cc-linked"]').innerText()));
    await fl.locator('label[data-choice="existente"]').click();
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 600);
    const cs = await changeState(page, pid);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Grúa telescópica 50 t');
    ok('sin duplicados: solo CC-001 y el recurso sigue vinculado', JSON.stringify(cs.rows) === '["CC-001"]' && cs.docs === 1 && it.changeRef === 'CC-001' && it.changeDocId === crId, [cs, it.changeRef]);
  });

  await step('reserva de gestión pendiente y registrada desde el catálogo', async () => {
    const fl = await addUnplanned(page, { name: 'Planta eléctrica de respaldo', typeId: 'maquinaria', reason: 'reserva-gestion' });
    ok('reserva de gestión: muestra la reserva del plan', /\$ 5\.000\.000/.test(await fl.locator('[data-rcat-mgmt]').innerText()));
    await fl.locator('label[data-choice="despues"]').click();
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 500);
    const note = page.locator('[data-rcat-note="pending"]');
    ok('aviso de pendientes de solicitud de cambio', await note.count() === 1 && /1 recurso no planificado/.test(await note.innerText()) && (await tile(page, 'no-planificados')) === '7');
    /* editor: «Registrar solicitud de cambio…» deja la solicitud pendiente hasta guardar; cancelar no registra nada */
    await row(page, 'Planta eléctrica de respaldo').getByRole('button', { name: 'Editar «Planta eléctrica de respaldo»' }).click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Registrar solicitud de cambio…' }).click();
    await sleep(page, 350);
    let f2 = top(page);
    await f2.locator('#rcf-just').fill('Falla del suministro eléctrico de la obra sin riesgo identificado.');
    await f2.locator('#rcf-cost').fill('2500000');
    await f2.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 300);
    ok('editor: la solicitud queda pendiente hasta guardar', /se registra al guardar el recurso/.test(await top(page).locator('[data-rcat-pending-cc]').innerText()));
    await top(page).getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 300);
    let cs = await changeState(page, pid);
    ok('cancelar el editor: no se registra ninguna solicitud', JSON.stringify(cs.rows) === '["CC-001"]' && cs.docs === 1, cs);
    await note.getByRole('button', { name: 'Ver pendientes' }).click();
    await sleep(page, 200);
    const names = await page.locator('tr[data-rcat-row]').evaluateAll((els) => els.map((e) => e.dataset.rcatRow));
    ok('filtro de pendientes', names.length === 1 && names[0] === 'Planta eléctrica de respaldo', names);
    /* catálogo: cancelar el flujo tampoco registra nada */
    await row(page, 'Planta eléctrica de respaldo').getByRole('button', { name: 'Registrar solicitud' }).click();
    await sleep(page, 350);
    f2 = top(page);
    await f2.locator('#rcf-just').fill('Prueba');
    await page.keyboard.press('Escape');
    await sleep(page, 250);
    cs = await changeState(page, pid);
    ok('catálogo: Escape en el flujo no registra nada', JSON.stringify(cs.rows) === '["CC-001"]' && await modalCount(page) === 0, cs);
    await row(page, 'Planta eléctrica de respaldo').getByRole('button', { name: 'Registrar solicitud' }).click();
    await sleep(page, 350);
    f2 = top(page);
    ok('flujo prellenado con el motivo y «nueva» elegida', await f2.locator('label[data-choice="reserva-gestion"] input').isChecked() && await f2.locator('label[data-choice="nueva"] input').isChecked());
    await f2.locator('#rcf-just').fill('Falla del suministro eléctrico de la obra sin riesgo identificado.');
    await f2.getByRole('button', { name: 'Confirmar y abrir la solicitud' }).click();
    await sleep(page, 150);
    ok('reserva de gestión: pide el costo estimado si no sale de las asignaciones', /Escribe el costo estimado que se pagaría con la reserva de gestión/.test(await f2.innerText()) && (await active(page)).id === 'rcf-cost', await active(page));
    await f2.locator('#rcf-cost').fill('2500000');
    await f2.getByRole('button', { name: 'Confirmar y abrir la solicitud' }).click();
    await sleep(page, 900);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Planta eléctrica de respaldo');
    const st = await page.evaluate(() => ({ view: PM.getState().view, params: PM.getState().params }));
    ok('CC-002 guardada y documento abierto', it.changeRef === 'CC-002' && st.view === 'documento' && st.params.docId === it.changeDocId, [it.changeRef, st]);
    const sc = await readDoc(page, pid, it.changeDocId);
    ok('solicitud de la reserva de gestión: tipo «Actualización», costo y fuente de financiación', sc && sc.fields.tipoCambio === 'Actualización' && sc.fields.valorCosto === 2500000 && /reserva de gestión/.test(sc.fields.impactoCosto || '') && /reserva de gestión/.test(sc.fields.descripcionCambio) && sc.fields.fechaSolicitud === TODAY, sc && { tipo: sc.fields.tipoCambio, valor: sc.fields.valorCosto, det: sc.fields.impactoCosto });
    await goto(page);
    ok('sin pendientes', await page.locator('[data-rcat-note="pending"]').count() === 0);
  });
  await step('recurso planificado con línea base', async () => {
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 300);
    const ed = top(page);
    await ed.locator('#rce-name').fill('Andamio multidireccional adicional');
    await ed.locator('#rce-type').selectOption('maquinaria');
    await ed.getByText('Sí, estaba en el plan').click();
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 400);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Andamio multidireccional adicional');
    ok('«Sí»: planificado sin motivo', it && it.planned !== false && it.reason == null && await modalCount(page) === 0, it);
  });

  await step('cambiar el motivo desde el editor', async () => {
    await row(page, 'Grúa equivalente').getByRole('button', { name: 'Editar «Grúa equivalente»' }).click();
    await sleep(page, 300);
    const ed = top(page);
    ok('editor: estado de planificación', /Sustitución equivalente/.test(await ed.locator('[data-rcat-plan="no"]').innerText()));
    await ed.getByRole('button', { name: 'Marcar como planificado' }).click();
    await ed.getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 400);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Grúa equivalente');
    ok('marcado como planificado', it.planned !== false && it.reason == null, it);
  });

  await step('eliminar con asignaciones', async () => {
    await row(page, 'Cuadrilla de montaje').getByRole('button', { name: 'Eliminar «Cuadrilla de montaje»' }).click();
    await sleep(page, 300);
    let dl = top(page);
    const t = await dl.innerText();
    ok('confirmación: lista las actividades y ofrece quitar o conservar', /Montaje niveles 1 a 5/.test(t) && /Montaje niveles 6 a 10/.test(t) && /Quitar las asignaciones/.test(t) && /Conservarlas por nombre/.test(t), t.slice(0, 300));
    await dl.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 200);
    ok('cancelar no elimina', !!itemByName(await readTool(page, pid, 'resources'), 'Cuadrilla de montaje'));
    const order = await page.locator('tr[data-rcat-row]').evaluateAll((els) => els.map((e) => e.dataset.rcatRow));
    const nextName = order[order.indexOf('Cuadrilla de montaje') + 1];
    await row(page, 'Cuadrilla de montaje').getByRole('button', { name: 'Eliminar «Cuadrilla de montaje»' }).click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Eliminar recurso' }).click();
    await sleep(page, 500);
    const af = await page.evaluate(() => { const a = document.activeElement; const tr = a && a.closest('tr[data-rcat-row]'); return { cls: a && a.className, row: tr && tr.dataset.rcatRow }; });
    ok('tras eliminar, el foco pasa al nombre de la fila siguiente', /rcat-link/.test(af.cls || '') && af.row === nextName, [af, nextName]);
    let sch = await readTool(page, pid, 'schedule');
    ok('quitar: asignaciones eliminadas de las actividades', !itemByName(await readTool(page, pid, 'resources'), 'Cuadrilla de montaje') && sch.tasks.every((x) => !x.resources.some((a) => a.name === 'Cuadrilla de montaje')), sch.tasks.map((x) => x.resources.map((a) => a.name)));
    await row(page, 'Camión grúa').getByRole('button', { name: 'Eliminar «Camión grúa»' }).click();
    await sleep(page, 300);
    dl = top(page);
    await dl.getByText('Conservarlas por nombre').click();
    await dl.getByRole('button', { name: 'Eliminar recurso' }).click();
    await sleep(page, 500);
    sch = await readTool(page, pid, 'schedule');
    const a = sch.tasks[0].resources.find((x) => x.name === 'Camión grúa');
    ok('conservar: la asignación queda por nombre y sin resourceId', a && !('resourceId' in a) && a.units === 1, sch.tasks[0].resources);
    ok('conservar: vuelve como «Sin clasificar»', await row(page, 'Camión grúa').getByRole('button', { name: 'Clasificar «Camión grúa»' }).count() === 1);
  });

  await step('búsqueda, filtros y orden', async () => {
    const names = () => page.locator('tr[data-rcat-row]').evaluateAll((els) => els.map((e) => e.dataset.rcatRow));
    await page.getByLabel('Buscar recursos').fill('MALLA');
    await sleep(page, 150);
    ok('búsqueda sin distinguir mayúsculas', JSON.stringify(await names()) === JSON.stringify(['Malla de seguridad adicional']));
    await page.getByLabel('Buscar recursos').fill('cc-001');
    await sleep(page, 150);
    ok('búsqueda por solicitud de cambio', JSON.stringify(await names()) === JSON.stringify(['Grúa telescópica 50 t']));
    await page.getByLabel('Buscar recursos').fill('');
    await page.getByLabel('Filtrar por planificación').selectOption('no-planificado');
    await sleep(page, 150);
    ok('filtro: no planificados', (await names()).length === 6, await names());
    await page.getByLabel('Filtrar por planificación').selectOption('sin-clasificar');
    await sleep(page, 150);
    ok('filtro: sin clasificar', JSON.stringify(await names()) === JSON.stringify(['Camión grúa']));
    await page.getByLabel('Filtrar por planificación').selectOption('');
    await page.getByLabel('Filtrar por tipo').selectOption('material');
    await sleep(page, 150);
    ok('filtro por tipo', JSON.stringify((await names()).sort()) === JSON.stringify(['Concreto de 3.000 psi', 'Malla de seguridad adicional']), await names());
    await page.getByLabel('Filtrar por tipo').selectOption('');
    await page.getByLabel('Buscar recursos').fill('zzz');
    await sleep(page, 150);
    ok('sin coincidencias: mensaje y quitar filtros', /Ningún recurso coincide/.test(await page.locator('.rcat-table').innerText()));
    await page.getByRole('button', { name: 'Quitar filtros' }).click();
    await sleep(page, 150);
    const all = await names();
    ok('orden por código: guardados primero, virtuales al final', all[0] === 'Camión grúa' ? false : all[all.length - 1] === 'Camión grúa', all);
    const nameBtn = page.locator('button.rcat-sort[data-sort="name"]');
    await nameBtn.focus();
    await page.keyboard.press('Enter');
    await sleep(page, 150);
    const byName = await names();
    ok('orden por nombre con el teclado (aria-sort)', JSON.stringify(byName) === JSON.stringify([...byName].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))) && (await page.locator('th.rcat-c-name').getAttribute('aria-sort')) === 'ascending', byName);
    await page.keyboard.press('Enter');
    await sleep(page, 150);
    ok('segundo Enter invierte el orden', (await page.locator('th.rcat-c-name').getAttribute('aria-sort')) === 'descending' && (await names())[0] === byName[byName.length - 1]);
    await page.locator('button.rcat-sort[data-sort="code"]').click();
  });

  await step('exportar CSV', async () => {
    await page.evaluate(() => { window.__dl = null; PM.download = async (name, data) => { window.__dl = { name, data }; return true; }; });
    await bar(page).getByRole('button', { name: 'Exportar CSV' }).click();
    await sleep(page, 150);
    const dl = await page.evaluate(() => window.__dl);
    const lines = dl ? dl.data.replace(/^﻿/, '').split('\r\n') : [];
    ok('CSV: nombre, encabezados y filas', dl && /catalogo-recursos\.csv$/.test(dl.name) && /^Código;Nombre;Tipo;Subtipo;Clase;Unidad/.test(lines[0]) && lines.length === 1 + await page.locator('tr[data-rcat-row]').count() && lines.some((l) => /Malla de seguridad adicional;Material;.*Respuesta a un riesgo identificado;R-001;4000000/.test(l)), lines.slice(0, 3));
  });

  await step('teclado', async () => {
    const addBtn = bar(page).getByRole('button', { name: 'Agregar recurso' });
    await addBtn.focus();
    await page.keyboard.press('Enter');
    await sleep(page, 300);
    ok('Enter abre el editor con foco en el nombre', (await active(page)).id === 'rce-name');
    await page.keyboard.type('Topógrafo');
    await page.keyboard.press('Enter');
    await sleep(page, 200);
    ok('Enter valida y lleva el foco a la pregunta', (await active(page)).type === 'radio');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    const a1 = await active(page);
    await page.keyboard.press('Tab');
    const a2 = await active(page);
    ok('Tab recorre hasta los botones del pie', /Cancelar/.test(a1.text) && /Agregar recurso/.test(a2.text), [a1, a2]);
    await page.keyboard.press('Enter');
    await sleep(page, 400);
    const it = itemByName(await readTool(page, pid, 'resources'), 'Topógrafo');
    ok('alta completa con el teclado', it && it.planned !== false && await modalCount(page) === 0, it);
    ok('el foco vuelve al botón que abrió el editor', /Agregar recurso/.test((await active(page)).text));
    await addBtn.focus();
    await page.keyboard.press('Enter');
    await sleep(page, 300);
    await page.keyboard.press('Escape');
    await sleep(page, 200);
    ok('Escape cierra y devuelve el foco', await modalCount(page) === 0 && /Agregar recurso/.test((await active(page)).text));
  });

  await step('API para otras vistas', async () => {
    await page.evaluate(() => { window.__rd1 = undefined; PM.resourceDialog(null, null, { name: 'Volqueta doble troque' }).then((x) => { window.__rd1 = x === null ? 'null' : x; }); });
    await sleep(page, 350);
    let ed = top(page);
    ok('initial prellena el nombre y sugiere tipo y unidad', (await ed.locator('#rce-name').inputValue()) === 'Volqueta doble troque' && (await ed.locator('#rce-type').inputValue()) === 'transporte' && (await ed.locator('#rce-unit').inputValue()) === 'equipo', [await ed.locator('#rce-type').inputValue(), await ed.locator('#rce-unit').inputValue()]);
    await page.keyboard.press('Escape');
    await sleep(page, 200);
    ok('cancelar resuelve null', (await page.evaluate(() => window.__rd1)) === 'null');
    await page.evaluate(() => { window.__rd2 = undefined; PM.resourceDialog(null, null, { name: 'Volqueta doble troque', unitCost: 650000 }).then((x) => { window.__rd2 = x; }); });
    await sleep(page, 350);
    ed = top(page);
    await ed.getByText('Sí, estaba en el plan').click();
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 400);
    const rd2 = await page.evaluate(() => window.__rd2);
    ok('guardar resuelve el recurso con id y código', rd2 && /^rec/.test(rd2.id) && /^REC-\d{3}$/.test(rd2.code) && rd2.unitCost === 650000 && rd2.typeId === 'transporte', rd2);
    await page.evaluate(() => { window.__fl = undefined; PM.unplannedResourceFlow(null, { id: 'rx-1', name: 'Recurso de prueba del flujo', typeId: 'maquinaria' }).then((x) => { window.__fl = x === null ? 'null' : x; }); });
    await sleep(page, 350);
    const fl = top(page);
    await fl.locator('label[data-choice="rendimiento"]').click();
    await fl.getByRole('button', { name: 'Confirmar motivo' }).click();
    await sleep(page, 300);
    const r = await page.evaluate(() => window.__fl);
    ok('el flujo devuelve el recurso con su motivo y no guarda', r && r.planned === false && r.reason === 'rendimiento' && r.addedDate === TODAY && !itemByNameIn(await readTool(page, pid, 'resources')), r);
    await page.evaluate(() => { window.__td = undefined; PM.resourceTypesDialog(null).then((v) => { window.__td = v; }); });
    await sleep(page, 350);
    await top(page).getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 200);
    ok('tipos: cancelar resuelve false', (await page.evaluate(() => window.__td)) === false);
  });

  await step('solo lectura', async () => {
    await page.evaluate(() => PM.setState({ canWrite: false }));
    await sleep(page, 250);
    const t = await page.locator('[data-rcat]').innerText();
    ok('sin acciones de edición', await bar(page).getByRole('button', { name: 'Agregar recurso' }).count() === 0 && await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).count() === 0 && await page.getByRole('button', { name: /^Eliminar «/ }).count() === 0 && await page.getByRole('button', { name: /^Clasificar «/ }).count() === 0 && await page.getByRole('button', { name: 'Registrar solicitud' }).count() === 0 && /Exportar CSV/.test(t));
    await page.getByRole('button', { name: 'Ver el detalle de «Topógrafo»' }).click();
    await sleep(page, 300);
    const ed = top(page);
    ok('detalle de solo lectura', /Detalle de REC-/.test(await ed.innerText()) && await ed.locator('#rce-name').isDisabled() && await ed.getByRole('button', { name: /Guardar/ }).count() === 0 && await ed.getByRole('button', { name: 'Eliminar' }).count() === 0 && await ed.getByRole('button', { name: /no planificado/ }).count() === 0);
    await ed.getByRole('button', { name: 'Cerrar' }).last().click();
    await page.evaluate(() => PM.setState({ canWrite: true }));
    await sleep(page, 200);
  });

  await step('sin errores (escritorio)', async () => {
    ok('sin tarjetas de error ni errores de consola', !(await errorCards(page)).length && !errors.length, errors.slice(0, 3));
    ok('sin desborde horizontal a 1360 px', (await horizontalOverflow(page)) <= 1);
    if (shots) await page.screenshot({ path: join(shots, 'catalogo-1360.png'), fullPage: true });
  });

  /* 300 recursos, 500 actividades */
  await step('300 recursos y 500 actividades', async () => {
    const pid2 = await createProject(page, { name: 'Proyecto grande', code: 'PRY-TEST-300', lifecycle: 'Híbrido', statusDate: STATUS });
    await page.evaluate(async (pid) => {
      const types = ['humano', 'maquinaria', 'herramienta', 'material', 'transporte', 'servicio'];
      const items = [];
      for (let k = 0; k < 300; k++) items.push({ id: 'r' + k, code: 'REC-' + String(k + 1).padStart(3, '0'), name: 'Recurso de carga ' + (k + 1), typeId: types[k % types.length], subtype: 'Grupo ' + (k % 9), unit: k % 6 === 3 ? 'm³' : 'unidad', availability: (k % 5) + 1, unitCost: k % 11 ? 10000 * ((k % 7) + 1) : null, origin: 'Interno', status: 'disponible', planned: k % 13 !== 0, reason: k % 13 === 0 ? 'rendimiento' : null, agileTeam: k % 6 === 0 && k % 12 === 0, dedication: 50, absences: [] });
      const tasks = [];
      for (let t = 0; t < 500; t++) tasks.push({ id: 't' + t, name: 'Actividad ' + (t + 1), duration: (t % 9) + 1, deps: [], cost: 100000, costMode: t % 3 ? 'recursos' : 'global', resources: [{ resourceId: 'r' + (t % 300), name: 'Recurso de carga ' + ((t % 300) + 1), units: 1 }, { name: 'Recurso de carga ' + (((t * 7) % 300) + 1), units: 2, qty: 5 }, { name: 'Nombre suelto ' + (t % 20), units: 1 }] });
      await PM.store.set(PM.paths.tool(pid, 'resources'), { preset: 'general', types: [], items });
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks });
    }, pid2);
    await sleep(page, 300);
    const t0 = Date.now();
    await page.evaluate(() => PM.navigate('prueba-catalogo'));
    await page.waitForFunction(() => document.querySelectorAll('tr[data-rcat-row]').length >= 320, null, { timeout: 15000 });
    const tRender = Date.now() - t0;
    ok('320 filas (300 + 20 sin clasificar) en menos de 4 s', tRender < 4000, tRender);
    ok('indicadores con datos grandes', (await tile(page, 'total')) === '320' && (await tile(page, 'sin-clasificar')) === '20', [await tile(page, 'total'), await tile(page, 'sin-clasificar')]);
    const tf = await page.evaluate(async () => {
      const inp = document.querySelector('input[aria-label="Buscar recursos"]');
      const t1 = performance.now();
      inp.value = 'carga 29'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const n = document.querySelectorAll('tr[data-rcat-row]').length;
      return { ms: performance.now() - t1, n };
    });
    ok('búsqueda rápida sobre 320 recursos', tf.ms < 600 && tf.n === 11, tf);
    await page.getByLabel('Buscar recursos').fill('');
    const te = Date.now();
    await row(page, 'Recurso de carga 5').getByRole('button', { name: 'Editar «Recurso de carga 5»' }).click();
    await top(page).locator('#rce-cost').waitFor();
    ok('el editor abre rápido', Date.now() - te < 2500, Date.now() - te);
    await fillNum(top(page).locator('#rce-cost'), '99000');
    await top(page).getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 500);
    const it = (await readTool(page, pid2, 'resources')).items.find((x) => x.id === 'r4');
    ok('guardar con datos grandes', it.unitCost === 99000);
    ok('equipo ágil en proyecto híbrido (columna o dentro de la disponibilidad en la tabla compacta)', (await page.locator('.rcat-table').getAttribute('data-compact')) === '1' ? /Equipo ágil · 50 %/.test(await row(page, 'Recurso de carga 1').innerText()) : await page.locator('.rcat-table th', { hasText: 'Equipo ágil' }).count() === 1);
    /* casilla del equipo ágil para un recurso de trabajo que no es de tipo personal (p. ej. un consultor) */
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 300);
    const ed = top(page);
    await ed.locator('#rce-name').fill('Consultor funcional externo');
    await ed.locator('#rce-type').selectOption('servicio');
    await sleep(page, 100);
    ok('servicio en proyecto híbrido: ofrece la casilla del equipo ágil', await ed.locator('#rce-agile').count() === 1 && await ed.locator('#rce-ded').count() === 0 && (await ed.locator('[data-rcat-time]').innerText()).trim() === 'Equipo ágil y disponibilidad');
    await ed.locator('#rce-agile').focus();
    await page.keyboard.press('Space');
    await sleep(page, 100);
    ok('al marcarla aparecen dedicación y horas', await ed.locator('#rce-ded').count() === 1 && await ed.locator('#rce-hours').count() === 1);
    await page.keyboard.press('Space');
    await sleep(page, 100);
    ok('al desmarcarla la casilla sigue visible y conserva el foco', await ed.locator('#rce-agile').count() === 1 && (await active(page)).id === 'rce-agile' && !(await ed.locator('#rce-agile').isChecked()));
    await page.keyboard.press('Space');
    await ed.getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 500);
    const cons = itemByName(await readTool(page, pid2, 'resources'), 'Consultor funcional externo');
    ok('guardado en el equipo ágil con su tipo de servicio', cons && cons.agileTeam === true && cons.typeId === 'servicio' && (cons.dedication ?? 100) === 100, cons);
    ok('sin errores con datos grandes', !(await errorCards(page)).length && !errors.length, errors.slice(0, 3));
  });

  /* integridad del catálogo: disponibilidad heredada de resourceLimits, renombrar al nombre de un «Sin clasificar»,
     recursos importados sin id, tipo sugerido según el proyecto, plural de las unidades, clase al eliminar o cambiar tipos */
  await step('integridad del catálogo', async () => {
    const pid3 = await createProject(page, { name: 'Proyecto de enlaces', code: 'PRY-TEST-ENL', lifecycle: 'Predictivo', statusDate: STATUS });
    await page.evaluate(async (pid) => {
      await PM.store.set(PM.paths.tool(pid, 'resources'), { preset: 'general', types: [], items: [
        { id: 'g1', code: 'REC-001', name: 'Grúa', typeId: 'maquinaria', unit: 'equipo', unitCost: 1000000 },
        { id: 'g2', code: 'REC-002', name: 'Camión grúa', typeId: 'transporte', unit: 'equipo', unitCost: 900000 },
        { id: 'g3', code: 'REC-003', name: 'Grúa torre del cliente', typeId: 'transporte', unit: 'equipo' },
        { id: 'c1', code: 'REC-004', name: 'Concreto 3000 psi', typeId: 'material', unit: 'm³', unitCost: 500000 },
        { id: 'c2', code: 'REC-005', name: 'Cuadrilla', typeId: 'humano', unit: 'cuadrilla', unitCost: 300000 },
        { id: 'k1', code: 'REC-006', name: 'Kit de anclaje', typeId: 'material', unit: 'kit', unitCost: 20000 },
        { id: 'l1', code: 'REC-007', name: 'Licencia de diseño', typeId: 'software', unit: 'licencia', unitCost: 100000 },
        { name: 'Grúa telescópica', typeId: 'maquinaria', unitCost: 2000000, supplier: 'Arrendadora de izaje' },
        { name: 'Andamio colgante', typeId: 'herramienta', unitCost: 50000 },
      ] });
      await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [], resourceLimits: { 'Grúa': 2, 'Grúa 2': 1 } }, tasks: [
        { id: 'a', name: 'Izaje 1', duration: 2, deps: [], costMode: 'recursos', resources: [{ resourceId: 'g1', name: 'Grúa', units: 1 }] },
        { id: 'b', name: 'Izaje 2 (grúa del contratista)', duration: 3, deps: [], costMode: 'recursos', resources: [{ name: 'Grúa 2', units: 1 }] },
        { id: 'f', name: 'Fundir placa', duration: 5, deps: [], costMode: 'recursos', resources: [{ resourceId: 'c1', name: 'Concreto 3000 psi', units: 1, qty: 12 }, { resourceId: 'c2', name: 'Cuadrilla', units: 2 }] },
        { id: 'k', name: 'Anclajes', duration: 1, deps: [], cost: 100000, resources: [{ resourceId: 'k1', name: 'Kit de anclaje', units: 1, qty: 10 }] },
        { id: 'd', name: 'Diseño de anclajes', duration: 4, deps: [], costMode: 'recursos', resources: [{ resourceId: 'l1', name: 'Licencia de diseño', units: 1, qty: 3 }] },
        { id: 'gt', name: 'Izaje de vigas', duration: 1, deps: [], cost: 500000, resources: [{ name: 'Grúa telescópica', units: 1 }, { name: 'Andamio colgante', units: 1 }] },
      ] });
    }, pid3);
    await sleep(page, 300);
    await goto(page);
    const costOf = (id) => page.evaluate(async ({ pid, id }) => { await PM.flushAll(); const r = await PM.store.get(PM.paths.tool(pid, 'resources')); const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); return PM.res.taskCost(s.tasks.find((t) => t.id === id), PM.res.catalog(r, s)).total; }, { pid: pid3, id });

    /* plural de la unidad en «Uso planificado» */
    ok('uso planificado: unidad en plural («10 kits»)', /10 kits/.test(await row(page, 'Kit de anclaje').innerText()), await row(page, 'Kit de anclaje').innerText());

    /* disponibilidad heredada de resourceLimits: vaciarla en el editor la quita */
    ok('disponibilidad heredada de resourceLimits', /2 por día/.test(await row(page, 'Grúa').innerText()));
    await row(page, 'Grúa').getByRole('button', { name: 'Editar «Grúa»' }).click();
    await sleep(page, 300);
    let ed = top(page);
    ok('el editor muestra la disponibilidad heredada', (await ed.locator('#rce-avail').inputValue()) === '2');
    await fillNum(ed.locator('#rce-avail'), '');
    await ed.getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 500);
    let sch = await readTool(page, pid3, 'schedule');
    ok('vaciar la disponibilidad: «Sin límite» y se quita la clave de resourceLimits', /Sin límite/.test(await row(page, 'Grúa').innerText()) && !('Grúa' in sch.settings.resourceLimits) && sch.settings.resourceLimits['Grúa 2'] === 1, sch.settings.resourceLimits);

    /* renombrar al nombre de un recurso «Sin clasificar»: confirma y enlaza */
    ok('antes: «Izaje 2» sin costo (Grúa 2 sin clasificar)', (await costOf('b')) === 0);
    await row(page, 'Grúa').getByRole('button', { name: 'Editar «Grúa»' }).click();
    await sleep(page, 300);
    ed = top(page);
    await ed.locator('#rce-name').fill('Grúa 2');
    await ed.getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 300);
    let cf = top(page);
    const mt = await cf.innerText();
    ok('renombrar al nombre de un «Sin clasificar»: pide confirmación con asignaciones y costo', await cf.locator('[data-rcat-merge]').count() === 1 && /1 asignación de 1 actividad/.test(mt) && /suma \$ 3\.000\.000/.test(mt) && /Izaje 2/.test(mt), mt.slice(0, 400));
    await cf.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 250);
    ok('cancelar: el editor sigue abierto con el foco en el nombre y nada cambia', await modalCount(page) === 1 && (await active(page)).id === 'rce-name' && !!itemByName(await readTool(page, pid3, 'resources'), 'Grúa') && (await costOf('b')) === 0, await active(page));
    await top(page).getByRole('button', { name: 'Guardar cambios' }).click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Guardar y enlazar' }).click();
    await sleep(page, 600);
    sch = await readTool(page, pid3, 'schedule');
    const res3 = await readTool(page, pid3, 'resources');
    const ab = sch.tasks.find((t) => t.id === 'b').resources[0];
    ok('enlazado: la asignación queda con resourceId y sin la clave antigua de resourceLimits', (itemByName(res3, 'Grúa 2') || {}).id === 'g1' && ab.resourceId === 'g1' && !('Grúa 2' in sch.settings.resourceLimits) && await row(page, 'Grúa 2').count() === 1 && (await costOf('b')) === 3000000, [ab, sch.settings.resourceLimits]);

    /* tipo sugerido: el que ya usa el proyecto para recursos con la misma palabra clave */
    await bar(page).getByRole('button', { name: 'Agregar recurso' }).click();
    await sleep(page, 250);
    ed = top(page);
    await ed.locator('#rce-name').fill('Grúa telescópica de 50 t');
    await ed.locator('#rce-name').press('Tab');
    await sleep(page, 100);
    ok('tipo sugerido según las grúas del proyecto (Transporte, 2 de 3)', (await ed.locator('#rce-type').inputValue()) === 'transporte', await ed.locator('#rce-type').inputValue());
    await page.keyboard.press('Escape');
    await sleep(page, 200);

    /* recurso importado sin id: el virtual con su nombre se clasifica sin falsos duplicados y lo reemplaza */
    const gtRow = row(page, 'Grúa telescópica');
    if (await gtRow.getByRole('button', { name: 'Clasificar «Grúa telescópica»' }).count()) {
      await gtRow.getByRole('button', { name: 'Clasificar «Grúa telescópica»' }).click();
      await sleep(page, 300);
      ed = top(page);
      ok('importado sin id: el editor toma sus datos (tipo y costo)', (await ed.locator('#rce-type').inputValue()) === 'maquinaria' && (await ed.locator('#rce-cost').inputValue()).replace(/\D/g, '') === '2000000');
      await ed.getByRole('button', { name: 'Guardar en el catálogo' }).click();
      await sleep(page, 500);
      ok('clasificar no da «Ya existe…»', await modalCount(page) === 0, await modalCount(page) ? await top(page).innerText() : null);
    }
    let raw = (await readTool(page, pid3, 'resources')).items.filter((x) => x.name === 'Grúa telescópica');
    ok('queda un solo recurso «Grúa telescópica», con id y sus datos', raw.length === 1 && !!raw[0].id && raw[0].typeId === 'maquinaria' && raw[0].unitCost === 2000000 && raw[0].supplier === 'Arrendadora de izaje', raw);
    if (await bar(page).getByRole('button', { name: 'Clasificar los sin clasificar' }).count()) {
      await bar(page).getByRole('button', { name: 'Clasificar los sin clasificar' }).click();
      await sleep(page, 300);
      const dl = top(page);
      ok('lote: el importado sin id trae su tipo', (await dl.locator('tr[data-rcat-crow="Andamio colgante"] select').inputValue()) === 'herramienta');
      await dl.getByRole('button', { name: 'Clasificar 1 recurso' }).click();
      await sleep(page, 500);
    }
    raw = (await readTool(page, pid3, 'resources')).items.filter((x) => x.name === 'Andamio colgante');
    ok('lote: un solo «Andamio colgante», con id', raw.length === 1 && !!raw[0].id && raw[0].typeId === 'herramienta' && raw[0].unitCost === 50000, raw);

    /* eliminar un tipo en uso sin otro de la misma clase: hay que elegir el destino */
    await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).click();
    await sleep(page, 300);
    let dl = top(page);
    await dl.getByRole('button', { name: 'Eliminar el tipo «Material»' }).click();
    await sleep(page, 150);
    let panel = dl.locator('[data-rcat-move]');
    ok('destino sugerido: el otro tipo consumible', (await panel.locator('select').inputValue()) === 'software');
    await panel.locator('select').selectOption('humano');
    await sleep(page, 100);
    ok('destino de otra clase: avisa que sus recursos conservan la clase', /sus 2 recursos conservan la clase consumible/.test(await panel.locator('[data-rcat-move-note]').innerText()));
    await panel.getByRole('button', { name: 'Eliminar y reasignar' }).click();
    await sleep(page, 150);
    await dl.getByRole('button', { name: 'Eliminar el tipo «Software y licencias»' }).click();
    await sleep(page, 150);
    panel = dl.locator('[data-rcat-move]');
    ok('sin otro tipo de la misma clase: no elige destino por omisión', (await panel.locator('select').inputValue()) === '');
    await panel.getByRole('button', { name: 'Eliminar y reasignar' }).click();
    await sleep(page, 150);
    ok('sin destino: pide elegirlo y lleva el foco a la lista', /Elige a qué tipo pasan sus recursos/.test(await panel.innerText()) && (await active(page)).id === 'rct-move-to', await active(page));
    await panel.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 120);
    await dl.getByRole('button', { name: 'Guardar tipos' }).click();
    await sleep(page, 500);
    let r3 = await readTool(page, pid3, 'resources');
    const conc = itemByName(r3, 'Concreto 3000 psi');
    ok('reasignado a otra clase: conserva la clase consumible y el costo no cambia', conc.typeId === 'humano' && conc.kind === 'consumible' && itemByName(r3, 'Kit de anclaje').kind === 'consumible' && (await costOf('f')) === 9000000 && await modalCount(page) === 0, [conc, await costOf('f')]);

    /* cambiar la clase de un tipo con recursos: aviso y confirmación con el efecto en el costo */
    await bar(page).getByRole('button', { name: 'Tipos de recurso…' }).click();
    await sleep(page, 300);
    dl = top(page);
    await dl.locator('li[data-type="software"] select[aria-label^="Clase"]').selectOption('trabajo');
    await sleep(page, 100);
    ok('cambiar la clase de un tipo con recursos: aviso en la fila', /Cambia la clase de 1 recurso de «Software y licencias» a trabajo/.test(await dl.locator('[data-rcat-note="kind-change"]').innerText()));
    await dl.getByRole('button', { name: 'Guardar tipos' }).click();
    await sleep(page, 300);
    cf = top(page);
    const kt = await cf.innerText();
    ok('al guardar: confirma con las actividades cuyo costo cambia', await cf.locator('[data-rcat-kindchange]').count() === 1 && /Cambia el costo de 1 actividad/.test(kt) && /\$ 300\.000 a \$ 400\.000/.test(kt), kt.slice(0, 400));
    await cf.getByRole('button', { name: 'Cancelar' }).click();
    await sleep(page, 250);
    r3 = await readTool(page, pid3, 'resources');
    ok('cancelar: no guarda los tipos', await modalCount(page) === 1 && r3.types.find((t) => t.id === 'software').kind === 'consumible' && (await costOf('d')) === 300000);
    await page.keyboard.press('Escape');
    await sleep(page, 200);

    /* eliminar desde el editor: el foco pasa a la fila siguiente */
    const order = await page.locator('tr[data-rcat-row]').evaluateAll((els) => els.map((e) => e.dataset.rcatRow));
    const nextName = order[order.indexOf('Kit de anclaje') + 1];
    await row(page, 'Kit de anclaje').locator('button.rcat-link').first().click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Eliminar' }).first().click();
    await sleep(page, 300);
    await top(page).getByRole('button', { name: 'Eliminar recurso' }).click();
    await sleep(page, 600);
    const af = await page.evaluate(() => { const a = document.activeElement; const tr = a && a.closest('tr[data-rcat-row]'); return { cls: a && a.className, row: tr && tr.dataset.rcatRow }; });
    ok('eliminar desde el editor: el foco pasa al nombre de la fila siguiente', await modalCount(page) === 0 && /rcat-link/.test(af.cls || '') && af.row === nextName, [af, nextName]);
    ok('sin errores en la integridad del catálogo', !(await errorCards(page)).length && !errors.length, errors.slice(0, 3));
  });
  await browser.close();
}

/* ================================================================= sesión 2: tema oscuro */
async function visualSession({ width, height, dark, tag }) {
  const { browser, page, errors } = await openApp({ file, width, height, dark });
  await mountView(page);
  const pid = await createProject(page, { lifecycle: 'Predictivo', statusDate: STATUS });
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 6, holidaysCO: true, extraHolidays: [] }, tasks: [
      { id: 't1', name: 'Montaje niveles 1 a 5', duration: 10, deps: [], cost: 9000000, costMode: 'recursos', resources: [{ resourceId: 'r1', name: 'Cuadrilla de montaje', units: 2 }, { name: 'Camión grúa', units: 1 }] },
      { id: 't2', name: 'Desmontaje', duration: 6, deps: [], cost: 5000000, resources: [{ name: 'Cuadrilla de montaje', units: 1 }, { name: 'Malla de seguridad', units: 1, qty: 120 }] },
    ] });
    await PM.store.set(PM.paths.tool(pid, 'resources'), { preset: 'alquiler', types: [], items: [
      { id: 'r1', code: 'REC-001', name: 'Cuadrilla de montaje', typeId: 'personal', subtype: 'Montadores certificados', unit: 'cuadrilla', availability: 3, unitCost: 450000, origin: 'Interno', status: 'disponible', planned: true, responsible: 'Supervisor de montaje' },
      { id: 'r2', code: 'REC-002', name: 'Grúa telescópica de 50 t', typeId: 'izaje', unit: 'equipo', unitCost: 2500000, origin: 'Alquilado', supplier: 'Proveedor de izaje', contract: 'OC-2026-118', status: 'solicitado', planned: false, reason: 'cambio-alcance', addedDate: '2026-10-02' },
      { id: 'r3', code: 'REC-003', name: 'Malla de seguridad', typeId: 'insumo', unit: 'm²', unitCost: 12000, availability: 500, status: 'disponible', planned: false, reason: 'riesgo', riskId: 'R-001', reserveAmount: 3000000, addedDate: '2026-09-20', availableFrom: '2026-09-01', availableTo: '2026-12-18' },
    ] });
  }, pid);
  await goto(page);
  const errs = [];
  if ((await errorCards(page)).length) errs.push('error-card');
  const ov = await horizontalOverflow(page);
  ok(tag + ': sin desborde horizontal de la página', ov <= 1, ov);
  if (shots) await page.screenshot({ path: join(shots, 'catalogo-' + tag + '.png'), fullPage: true });
  if (width <= 400) {
    const tw = await page.evaluate(() => { const w = document.querySelector('.rcat-twrap'); return { sw: w.scrollWidth, cw: w.clientWidth, right: w.getBoundingClientRect().right, vw: window.innerWidth }; });
    ok(tag + ': la tabla se desplaza dentro de su contenedor', tw.sw > tw.cw && tw.right <= tw.vw, tw);
    const sticky = await page.evaluate(() => { const w = document.querySelector('.rcat-twrap'); w.scrollLeft = 300; const td = document.querySelector('tr[data-rcat-row] td.rcat-c-name'); return Math.round(td.getBoundingClientRect().left - w.getBoundingClientRect().left); });
    ok(tag + ': la columna del recurso queda fija al desplazar', sticky <= 2, sticky);
    await page.evaluate(() => { document.querySelector('.rcat-twrap').scrollLeft = 0; });
  }
  /* 1360 y 1440 px: tabla compacta; la columna de acciones y «Uso planificado» quedan a la vista */
  const fit = () => page.evaluate(() => {
    const w = document.querySelector('.rcat-twrap'); const wr = w.getBoundingClientRect();
    const td = document.querySelector('tr[data-rcat-row] td.ctl').getBoundingClientRect();
    const th = [...document.querySelectorAll('.rcat-table thead th')].find((x) => /Uso planificado/.test(x.textContent)).getBoundingClientRect();
    return { compact: document.querySelector('.rcat-table').dataset.compact, cw: w.clientWidth, sw: w.scrollWidth, acts: td.right <= wr.right + 1 && td.left >= wr.left, use: th.right <= td.left + 1 };
  });
  if (width >= 1300 && width < 1900) {
    let tw = await fit();
    ok(tag + ': a ' + width + ' px la tabla se compacta y deja a la vista las acciones y el uso planificado', tw.compact === '1' && tw.acts && tw.use && tw.sw <= tw.cw + 1, tw);
    await page.setViewportSize({ width: 1440, height });
    await sleep(page, 400);
    tw = await fit();
    ok(tag + ': a 1440 px, igual', tw.compact === '1' && tw.acts && tw.use && tw.sw <= tw.cw + 1, tw);
    await page.setViewportSize({ width, height });
    await sleep(page, 300);
  }
  if (width >= 1900) {
    const fw = await page.evaluate(() => { const r = document.querySelector('[data-rcat]').getBoundingClientRect(); const p = document.querySelector('.page').getBoundingClientRect(); const w = document.querySelector('.rcat-twrap'); return { r: Math.round(r.width), p: Math.round(p.width), sw: w.scrollWidth, cw: w.clientWidth }; });
    ok(tag + ': ancho completo y tabla sin desplazamiento lateral', fw.p - fw.r < 60 && fw.sw <= fw.cw + 1, fw);
    ok(tag + ': con espacio, la tabla muestra todas las columnas', (await fit()).compact === '0' && await page.locator('.rcat-table th', { hasText: 'Clase y unidad' }).count() === 1);
  }
  await page.getByRole('button', { name: 'Agregar recurso' }).first().click();
  await sleep(page, 300);
  ok(tag + ': editor sin desborde', (await horizontalOverflow(page)) <= 1 && await page.evaluate(() => { const m = document.querySelector('.modal'); return m.scrollWidth <= m.clientWidth + 1; }));
  if (shots) await page.screenshot({ path: join(shots, 'editor-' + tag + '.png') });
  await page.keyboard.press('Escape');
  await sleep(page, 200);
  await page.getByRole('button', { name: 'Tipos de recurso…' }).click();
  await sleep(page, 300);
  ok(tag + ': tipos sin desborde', (await horizontalOverflow(page)) <= 1 && await page.evaluate(() => { const m = document.querySelector('.modal-body'); return m.scrollWidth <= m.clientWidth + 1; }));
  if (shots) await page.screenshot({ path: join(shots, 'tipos-' + tag + '.png') });
  await page.keyboard.press('Escape');
  await sleep(page, 200);
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.baseline(pid, 'b0'), { number: 0, label: 'LB0', date: '2026-08-01', includes: ['cost'], cost: { bac: 1, contingency: 10000000, management: 0, tasks: [] } });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [], statusUpdates: [], reserves: { contingency: 10000000, management: 0 } });
  }, pid);
  await sleep(page, 300);
  await row(page, 'Grúa telescópica de 50 t').getByRole('button', { name: 'Registrar solicitud' }).click();
  await sleep(page, 400);
  ok(tag + ': flujo de no planificado sin desborde', (await horizontalOverflow(page)) <= 1 && await page.evaluate(() => { const m = document.querySelector('.modal-body'); return m.scrollWidth <= m.clientWidth + 1; }));
  if (shots) await page.screenshot({ path: join(shots, 'flujo-' + tag + '.png') });
  await page.keyboard.press('Escape');
  await sleep(page, 200);
  if (dark) {
    const c = await page.evaluate(() => { const td = document.querySelector('tr[data-rcat-row] td.rcat-c-name'); return { bg: getComputedStyle(td).backgroundColor, body: getComputedStyle(document.body).backgroundColor }; });
    ok(tag + ': la columna fija usa la superficie oscura', c.bg !== 'rgb(255, 255, 255)' && c.bg !== 'rgba(0, 0, 0, 0)', c);
  }
  ok(tag + ': sin errores', !errs.length && !errors.length, errors.slice(0, 3));
  await browser.close();
}
await visualSession({ width: 1360, height: 900, dark: true, tag: 'oscuro' });
await visualSession({ width: 400, height: 860, dark: false, tag: '400px' });
await visualSession({ width: 1920, height: 1080, dark: false, tag: '1920px' });

const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

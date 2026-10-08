// Pruebas de interacción de la vista "flujogramas" (src/60-flow.js).
// Uso: node test/flow.test.mjs --file <ruta.html> [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, createExample, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (cond, msg, extra) => { console.log((cond ? 'OK   ' : 'FAIL ') + msg + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); if (!cond) failures++; };
const poll = async (page, getter, pred, timeout = 5000) => { const t0 = Date.now(); let v; do { v = await getter(); if (pred(v)) return v; await page.waitForTimeout(100); } while (Date.now() - t0 < timeout); return v; };
const center = async (loc) => { const b = await loc.boundingBox(); if (!b) throw new Error('sin caja: ' + loc); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
/* openApp carga la página dos veces (la primera solo para limpiar el almacenamiento). Los errores de esa primera
   carga descartable no son de esta vista (p. ej., si Chromium adivina mal la codificación de un file:// sin
   <meta charset>); se cuentan solo los errores posteriores, y se verifica que la página activa esté en UTF-8. */
async function freshErrors(app) { const boot = app.errors.length; const utf8 = (await app.page.evaluate(() => document.characterSet)) === 'UTF-8'; if (boot) console.log('     (aviso: ' + boot + ' error(es) en la carga inicial descartada por el arnés)'); return { utf8, list: () => app.errors.slice(boot) }; }
async function drag(page, from, to, steps = 12) { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + (to.x - from.x) * 0.2, from.y + (to.y - from.y) * 0.2, { steps: 3 }); await page.mouse.move(to.x, to.y, { steps }); await page.mouse.up(); }

async function main() {
  /* ================================================================ escritorio, tema claro */
  const app0 = await openApp({ file, width: 1360, height: 900 });
  const { browser, page } = app0;
  const fe0 = await freshErrors(app0);
  check(fe0.utf8, 'la página se interpreta como UTF-8');
  try {
    const pid = await createProject(page);
    await gotoView(page, 'flujogramas');
    const flows = () => page.evaluate(async (pid) => (await PM.store.list(PM.paths.flows(pid))).map((d) => ({ id: d.id, ...d.data })), pid);
    const activeFid = () => page.evaluate(() => document.querySelector('.flow-editor')?.dataset.fid || null);
    const getFlow = async () => { const fid = await activeFid(); return page.evaluate(async ([pid, fid]) => PM.store.get(PM.paths.flow(pid, fid)), [pid, fid]); };
    const canvas = page.locator('.flow-canvas');

    /* ---- estado vacío ---- */
    check(await page.getByText('Aún no hay diagramas de flujo').isVisible(), 'estado vacío visible');
    check(await page.locator('.flow-tpl-card').count() === 4, 'estado vacío ofrece 4 plantillas');
    if (shots) await page.screenshot({ path: join(shots, 't-empty.png'), fullPage: true });
    /* en pantallas anchas las tarjetas de plantilla llenan la fila (auto-fit): no queda franja vacía a la derecha */
    const tplFill = async () => page.evaluate(() => { const g = document.querySelector('.flow-tpls').getBoundingClientRect(); const cs = [...document.querySelectorAll('.flow-tpl-card')].map((c) => c.getBoundingClientRect()); return { grid: Math.round(g.width), gapRight: Math.round(g.right - Math.max(...cs.map((c) => c.right))), rows: new Set(cs.map((c) => Math.round(c.top))).size }; });
    for (const w of [1920, 2560]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(200);
      const r = await tplFill();
      check(r.rows === 1 && r.gapRight <= 1 && r.grid > w * 0.6, 'plantillas llenan el ancho a ' + w + ' px', r);
      if (shots && w === 2560) await page.screenshot({ path: join(shots, 't-empty-2560.png'), fullPage: true });
    }
    await page.setViewportSize({ width: 1360, height: 900 });
    await page.waitForTimeout(200);

    /* ---- crear desde plantilla ---- */
    await page.locator('.page-actions').getByRole('button', { name: 'Nuevo diagrama' }).click();
    await page.locator('label.flow-tpl-opt', { hasText: 'Control integrado de cambios' }).click();
    check(await page.locator('#flow-new-name').inputValue() === 'Control integrado de cambios', 'el nombre sigue a la plantilla elegida');
    await page.getByRole('button', { name: 'Crear diagrama' }).click();
    await page.waitForSelector('.flow-node');
    const tpl = await page.evaluate(() => { const t = PM.flowTools.templates.find((x) => x.id === 'cambios'); return { n: t.nodes.length, e: t.edges.length, l: t.lanes.length }; });
    check(tpl.n === 9 && tpl.e === 9 && tpl.l === 3, 'plantilla 4.6 define 9 elementos, 9 flechas y 3 carriles', tpl);
    let f = await poll(page, getFlow, (x) => x && x.nodes);
    check(f.nodes.length === 9 && f.edges.length === 9 && f.lanes.length === 3, 'documento guardado con 9/9/3', { n: f.nodes.length, e: f.edges.length, l: f.lanes.length });
    check(await page.locator('.flow-node').count() === 9, 'lienzo dibuja 9 elementos');
    check(await page.locator('.flow-edge').count() === 9, 'lienzo dibuja 9 flechas');
    check(await page.locator('rect.flow-lane').count() === 3, 'lienzo dibuja 3 carriles');
    check(await page.locator('.flow-elabel', { hasText: 'Sí' }).count() === 1 && await page.locator('.flow-elabel', { hasText: 'No' }).count() === 1, 'etiquetas Sí / No visibles');
    if (shots) await page.screenshot({ path: join(shots, 't-template.png'), fullPage: true });
    const firstFid = await activeFid();

    /* ---- crear en blanco ---- */
    await page.locator('.page-actions').getByRole('button', { name: 'Nuevo diagrama' }).click();
    await page.locator('#flow-new-name').fill('Despacho de equipos');
    await page.getByRole('button', { name: 'Crear diagrama' }).click();
    await poll(page, activeFid, (v) => v && v !== firstFid);
    await page.waitForSelector('.flow-empty-hint');
    check((await flows()).length === 2, 'dos diagramas en la colección');
    check(await page.locator('.flow-node').count() === 0, 'diagrama en blanco sin elementos');

    /* ---- paleta: clic agrega en el centro ---- */
    await page.locator('.flow-pal-btn[data-type="process"]').click();
    await page.locator('.flow-pal-btn[data-type="terminal"]').click();
    check(await page.locator('.flow-node').count() === 2, 'clic en la paleta agrega elementos');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 2);
    const proc = f.nodes.find((n) => n.type === 'process');
    const term = f.nodes.find((n) => n.type === 'terminal');
    check(proc && term && term.text === 'Inicio', 'primer terminal se llama «Inicio»', term);

    /* ---- paleta: arrastrar al lienzo ---- */
    const cbox = await canvas.boundingBox();
    const drop = { x: cbox.x + cbox.width * 0.78, y: cbox.y + cbox.height * 0.3 };
    await drag(page, await center(page.locator('.flow-pal-btn[data-type="decision"]')), drop, 15);
    await page.waitForTimeout(150);
    check(await page.locator('.flow-node').count() === 3, 'arrastrar desde la paleta agrega un elemento');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 3);
    const dec = f.nodes.find((n) => n.type === 'decision');
    const decC = await center(page.locator(`[data-node="${dec.id}"] .flow-shape`));
    check(Math.abs(decC.x - drop.x) < 12 && Math.abs(decC.y - drop.y) < 12, 'el elemento queda donde se soltó', { decC, drop });

    /* ---- mover arrastrando (escribe al soltar, ajusta a 8 px) ---- */
    const pShape = page.locator(`[data-node="${proc.id}"] .flow-shape`);
    const pc = await center(pShape);
    const k = await page.locator('.flow-svg > g').getAttribute('transform').then((t) => parseFloat(/scale\(([\d.]+)\)/.exec(t)[1]));
    await drag(page, pc, { x: pc.x - 150, y: pc.y - 90 });
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === proc.id).x !== proc.x);
    const moved = f.nodes.find((n) => n.id === proc.id);
    const ex = proc.x + Math.round(-150 / k / 8) * 8, ey = proc.y + Math.round(-90 / k / 8) * 8;
    check(moved.x === ex && moved.y === ey, 'mover por arrastre cambia y guarda coordenadas (ajuste 8 px)', { moved: [moved.x, moved.y], expected: [ex, ey], k });
    check(moved.x % 8 === 0 && moved.y % 8 === 0, 'coordenadas en la cuadrícula de 8 px');

    /* ---- conectar arrastrando desde un puerto ---- */
    const pc2 = await center(pShape);
    await page.mouse.move(pc2.x, pc2.y);
    await page.waitForSelector(`[data-node="${proc.id}"] .flow-port-hit[data-side="right"]`);
    check(await page.locator(`[data-node="${proc.id}"] .flow-port-hit`).count() === 4, 'al pasar el puntero aparecen 4 puertos');
    const port = await center(page.locator(`[data-node="${proc.id}"] .flow-port-hit[data-side="right"]`));
    const decC2 = await center(page.locator(`[data-node="${dec.id}"] .flow-shape`));
    await drag(page, port, decC2, 15);
    f = await poll(page, getFlow, (x) => x && x.edges.length === 1);
    check(f.edges.length === 1 && f.edges[0].from === proc.id && f.edges[0].to === dec.id, 'arrastrar desde un puerto crea la flecha', f.edges);
    const edgeId = f.edges[0].id;
    check(await page.locator(`[data-edge="${edgeId}"] .flow-edge-line`).count() === 1, 'flecha dibujada');
    const d = await page.locator(`[data-edge="${edgeId}"] .flow-edge-line`).getAttribute('d');
    check(/^M[\d.,-]+( L[\d.,-]+| Q[\d.,-]+ [\d.,-]+)+$/.test(d), 'ruta ortogonal con codos', d);

    /* ---- etiqueta desde el panel ---- */
    await page.getByLabel('Etiqueta', { exact: true }).fill('Sí');
    f = await poll(page, getFlow, (x) => x && x.edges[0].label === 'Sí');
    check(f.edges[0].label === 'Sí', 'etiqueta editada en el panel y guardada');
    check(await page.locator(`[data-edge-label="${edgeId}"] .flow-elabel`).textContent() === 'Sí', 'etiqueta dibujada en el punto medio');

    /* ---- etiqueta con doble clic ---- */
    const lbl = await center(page.locator(`[data-edge-label="${edgeId}"] .flow-elabel-bg`));
    await page.mouse.dblclick(lbl.x, lbl.y);
    await page.waitForSelector('.flow-editbox.is-input');
    await page.locator('.flow-editbox.is-input').fill('No');
    await page.keyboard.press('Enter');
    f = await poll(page, getFlow, (x) => x && x.edges[0].label === 'No');
    check(f.edges[0].label === 'No', 'doble clic en la flecha edita la etiqueta');

    /* ---- texto con doble clic ---- */
    await page.locator(`[data-node="${dec.id}"]`).dblclick();
    await page.waitForSelector('textarea.flow-editbox');
    await page.locator('textarea.flow-editbox').fill('¿Equipo completo?');
    await page.keyboard.press('Enter');
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?');
    check(f.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?', 'doble clic en el elemento edita su texto');
    check((await page.locator(`[data-node="${dec.id}"] .flow-text`).textContent()).includes('completo'), 'texto ajustado dentro de la forma');

    /* ---- deshacer / rehacer ---- */
    await canvas.focus();
    await page.keyboard.press('Control+z');
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === dec.id).text === '¿Condición?');
    check(f.nodes.find((n) => n.id === dec.id).text === '¿Condición?', 'Ctrl+Z deshace el cambio de texto');
    await page.keyboard.press('Control+y');
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?');
    check(f.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?', 'Ctrl+Y rehace');
    await page.getByRole('button', { name: 'Deshacer (Ctrl+Z)' }).click();
    await page.getByRole('button', { name: 'Deshacer (Ctrl+Z)' }).click();
    f = await poll(page, getFlow, (x) => x && x.edges[0] && x.edges[0].label === 'Sí');
    check(f.edges[0].label === 'Sí', 'botón Deshacer revierte dos pasos (texto y etiqueta)');
    await page.getByRole('button', { name: 'Rehacer (Ctrl+Y)' }).click();
    await page.getByRole('button', { name: 'Rehacer (Ctrl+Y)' }).click();
    f = await poll(page, getFlow, (x) => x && x.edges[0].label === 'No' && x.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?');
    check(f.edges[0].label === 'No' && f.nodes.find((n) => n.id === dec.id).text === '¿Equipo completo?', 'botón Rehacer reaplica');

    /* ---- redimensionar ---- */
    await page.locator(`[data-node="${proc.id}"]`).click();
    const hc = await center(page.locator(`[data-node="${proc.id}"] [data-handle="resize"]`));
    await drag(page, hc, { x: hc.x + 48, y: hc.y + 24 });
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === proc.id).w > proc.w);
    const rs = f.nodes.find((n) => n.id === proc.id);
    check(rs.w > proc.w && rs.h > proc.h && rs.w % 8 === 0, 'el control de la esquina cambia el tamaño', [rs.w, rs.h]);

    /* ---- flechas y Ctrl+D ---- */
    await canvas.focus();
    const bx = rs.x;
    await page.keyboard.press('ArrowRight');
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === proc.id).x === bx + 8);
    check(f.nodes.find((n) => n.id === proc.id).x === bx + 8, 'flecha derecha mueve 8 px');
    await page.locator(`[data-node="${dec.id}"]`).click({ modifiers: ['Shift'] });
    check(await page.locator('.flow-node.is-sel').count() === 2, 'Mayús+clic selecciona varios');
    await page.keyboard.press('Control+d');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 5);
    check(f.nodes.length === 5 && f.edges.length === 2, 'Ctrl+D duplica la selección y sus flechas internas', { n: f.nodes.length, e: f.edges.length });

    /* ---- eliminar con Supr ---- */
    await page.keyboard.press('Delete');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 3);
    check(f.nodes.length === 3 && f.edges.length === 1, 'Supr elimina la selección y sus flechas', { n: f.nodes.length, e: f.edges.length });
    await page.locator(`[data-node="${dec.id}"]`).click();
    await page.keyboard.press('Delete');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 2);
    check(f.nodes.length === 2 && f.edges.length === 0, 'eliminar un elemento quita sus flechas', { n: f.nodes.length, e: f.edges.length });

    /* ---- ruta solo con teclado (panel de propiedades) ---- */
    await canvas.focus();
    await page.keyboard.press('Escape');
    const addForm = page.locator('form[aria-label="Agregar elemento"]');
    await addForm.getByLabel('Tipo').focus();
    await addForm.getByLabel('Tipo').selectOption('document');
    await addForm.getByLabel('Texto').focus();
    await page.keyboard.type('Remisión firmada');
    await page.keyboard.press('Enter');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 3);
    const docNode = f.nodes.find((n) => n.text === 'Remisión firmada');
    check(docNode && docNode.type === 'document', 'agregar elemento con el teclado', docNode);
    await addForm.getByLabel('Tipo').selectOption('data');
    await addForm.getByLabel('Texto').fill('Inventario en obra');
    await addForm.getByLabel('Conectar desde').selectOption(docNode.id);
    await addForm.getByLabel('Texto').press('Enter');
    f = await poll(page, getFlow, (x) => x && x.nodes.length === 4);
    const dataNode = f.nodes.find((n) => n.text === 'Inventario en obra');
    check(dataNode && f.edges.some((e) => e.from === docNode.id && e.to === dataNode.id), 'agregar elemento conectado desde otro', f.edges);
    check(dataNode && dataNode.y > docNode.y + docNode.h, 'el nuevo elemento se ubica debajo del origen');
    await canvas.focus();
    await page.keyboard.press('Escape');
    const edgeForm = page.locator('form[aria-label="Agregar flecha"]');
    await edgeForm.getByLabel('Desde').selectOption(term.id);
    await edgeForm.getByLabel('Hacia').selectOption(proc.id);
    await edgeForm.getByLabel('Etiqueta (opcional)').fill('Inicio');
    await edgeForm.getByLabel('Etiqueta (opcional)').press('Enter');
    f = await poll(page, getFlow, (x) => x && x.edges.length === 2);
    check(f.edges.some((e) => e.from === term.id && e.to === proc.id && e.label === 'Inicio'), 'agregar flecha con los selectores Desde / Hacia', f.edges);
    await page.getByRole('tab', { name: /Elementos/ }).click();
    await page.locator('.flow-item[title$="Inventario en obra"]').click();
    check(await page.locator(`[data-node="${dataNode.id}"].is-sel`).count() === 1, 'seleccionar desde la lista de elementos');
    await page.getByLabel('Tipo de símbolo').selectOption('process');
    f = await poll(page, getFlow, (x) => x && x.nodes.find((n) => n.id === dataNode.id).type === 'process');
    check(f.nodes.find((n) => n.id === dataNode.id).type === 'process', 'cambiar el tipo desde el panel');

    /* ---- carriles ---- */
    await page.getByRole('button', { name: 'Carriles' }).click();
    f = await poll(page, getFlow, (x) => x && x.lanes && x.lanes.length === 3);
    check(await page.locator('rect.flow-lane').count() === 3, 'activar carriles dibuja 3 carriles por defecto');
    await page.getByLabel('Nombre del carril 1').fill('Almacén');
    await page.getByRole('button', { name: 'Agregar carril' }).click();
    f = await poll(page, getFlow, (x) => x && x.lanes.length === 4 && x.lanes[0].name === 'Almacén');
    check(f.lanes.length === 4 && f.lanes[0].name === 'Almacén', 'renombrar y agregar carriles', f.lanes);
    check((await page.locator('.flow-lane-label').first().textContent()).includes('Almacén'), 'nombre del carril en la columna de etiquetas');
    const labelBox = await page.locator('rect.flow-lane-head').first().boundingBox();
    const leftNode = await page.locator('.flow-node .flow-shape').evaluateAll((els) => Math.min(...els.map((e) => e.getBoundingClientRect().left)));
    check(leftNode >= labelBox.x + labelBox.width - 1, 'la columna de etiquetas no se superpone a los elementos');
    if (shots) await page.screenshot({ path: join(shots, 't-lanes.png'), fullPage: true });
    await page.getByRole('button', { name: 'Carriles' }).click();
    f = await poll(page, getFlow, (x) => x && x.lanesHidden === true);
    check(f.lanesHidden === true && f.lanes.length === 4 && await page.locator('rect.flow-lane').count() === 0, 'desactivar carriles los oculta y conserva los nombres');

    /* ---- desplazar y zoom ---- */
    const z0 = await page.locator('.flow-zoom').textContent();
    await page.getByRole('button', { name: 'Acercar' }).click();
    const z1 = await page.locator('.flow-zoom').textContent();
    check(z0 !== z1, 'zoom con botones', [z0, z1]);
    const tBefore = await page.locator('.flow-svg > g').getAttribute('transform');
    const cb2 = await canvas.boundingBox();
    await drag(page, { x: cb2.x + 12, y: cb2.y + cb2.height - 14 }, { x: cb2.x + 112, y: cb2.y + cb2.height - 64 });
    const tAfter = await page.locator('.flow-svg > g').getAttribute('transform');
    check(tBefore !== tAfter, 'arrastrar el fondo desplaza la vista');
    await page.mouse.move(cb2.x + cb2.width / 2, cb2.y + cb2.height / 2);
    await page.keyboard.down('Control'); await page.mouse.wheel(0, 240); await page.keyboard.up('Control');
    await page.waitForTimeout(100);
    check(await page.locator('.flow-zoom').textContent() !== z1, 'Ctrl + rueda cambia el zoom');
    await page.getByRole('button', { name: 'Ajustar a la vista' }).click();

    /* ---- descargas (SVG limpio y JSON) ---- */
    await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
    await page.getByRole('button', { name: 'Descargar SVG' }).click();
    const svgDl = await page.evaluate(() => window.__dl[0]);
    check(svgDl && /\.svg$/.test(svgDl.name) && svgDl.data.includes('<svg'), 'Descargar SVG entrega un documento SVG', svgDl && svgDl.name);
    check(svgDl && svgDl.data.includes('Remisión firmada') && !svgDl.data.includes('flow-port') && !svgDl.data.includes('pattern'), 'SVG exportado sin puertos ni retícula, con los textos');
    check(svgDl && !/var\(--/.test(svgDl.data), 'SVG exportado con colores resueltos');
    await page.getByRole('button', { name: 'Exportar JSON' }).click();
    const jsonDl = await page.evaluate(() => window.__dl[1]);
    let parsed = null; try { parsed = JSON.parse(jsonDl.data); } catch (e) { parsed = null; }
    check(parsed && parsed.format === 'gestor-pmbok-flujo' && parsed.nodes.length === 4, 'Exportar JSON entrega el diagrama completo');
    check(await page.locator('.flow-export-host').count() === 0, 'el SVG temporal de exportación se retira del documento');

    /* ---- renombrar, duplicar y eliminar diagrama ---- */
    await page.getByRole('button', { name: 'Acciones del diagrama' }).click();
    await page.getByRole('menuitem', { name: 'Renombrar' }).click();
    await page.locator('#pm-prompt').fill('Despacho y recepción de equipos');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();
    f = await poll(page, getFlow, (x) => x && x.name === 'Despacho y recepción de equipos');
    check(f.name === 'Despacho y recepción de equipos', 'renombrar diagrama');
    const keepFid = await activeFid();
    await page.getByRole('button', { name: 'Acciones del diagrama' }).click();
    await page.getByRole('menuitem', { name: 'Duplicar diagrama' }).click();
    let all = await poll(page, flows, (x) => x.length === 3);
    check(all.length === 3 && all.some((x) => x.name === 'Despacho y recepción de equipos (copia)' && x.nodes.length === 4), 'duplicar diagrama');
    await poll(page, activeFid, (v) => v && v !== keepFid);
    await page.getByRole('button', { name: 'Acciones del diagrama' }).click();
    await page.getByRole('menuitem', { name: 'Eliminar diagrama' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar diagrama' }).click();
    all = await poll(page, flows, (x) => x.length === 2);
    check(all.length === 2 && !all.some((x) => /\(copia\)/.test(x.name)), 'eliminar diagrama (con confirmación)');

    /* ---- importar JSON (válido e inválido) ---- */
    let [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Importar JSON' }).click()]);
    await chooser.setFiles({ name: 'flujo.json', mimeType: 'application/json', buffer: Buffer.from(jsonDl.data) });
    all = await poll(page, flows, (x) => x.length === 3);
    const imported = all.find((x) => x.id !== keepFid && x.name === 'Despacho de equipos');
    check(all.length === 3 && imported && imported.nodes.length === 4 && imported.edges.length === 2, 'importar un diagrama exportado en JSON', all.map((x) => x.name));
    [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Importar JSON' }).click()]);
    await chooser.setFiles({ name: 'otro.json', mimeType: 'application/json', buffer: Buffer.from('{"hola": 1}') });
    await page.waitForSelector('.toast.crit');
    check((await page.locator('.toast.crit').textContent()).includes('no es un diagrama válido'), 'importar un archivo no válido explica el error');
    check((await flows()).length === 3, 'el archivo no válido no crea diagramas');

    await page.locator('#flow-picker-select').selectOption(keepFid);
    await poll(page, activeFid, (v) => v === keepFid);

    /* ---- persistencia tras recargar ---- */
    const before = await getFlow();
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
    await gotoView(page, 'flujogramas');
    await page.waitForSelector('.flow-node');
    check(await activeFid() === keepFid, 'tras recargar se abre el último diagrama elegido');
    const after = await getFlow();
    check(after && JSON.stringify(after.nodes) === JSON.stringify(before.nodes) && JSON.stringify(after.edges) === JSON.stringify(before.edges) && after.name === before.name, 'diagrama persiste tras recargar');
    check(await page.locator('.flow-node').count() === 4, 'lienzo restaurado tras recargar');
    check((await flows()).length === 3, 'colección persiste tras recargar');

    /* ---- solo lectura ---- */
    await page.evaluate(() => PM.setState({ canWrite: false }));
    await page.waitForTimeout(100);
    check(await page.locator('.flow-palette').count() === 0, 'solo lectura: sin paleta');
    check(await page.getByRole('button', { name: 'Nuevo diagrama' }).count() === 0, 'solo lectura: sin «Nuevo diagrama»');
    check(await page.getByRole('button', { name: 'Deshacer (Ctrl+Z)' }).count() === 0, 'solo lectura: sin deshacer/eliminar');
    const roNode = page.locator(`[data-node="${proc.id}"]`);
    await roNode.click();
    check(await page.locator('.flow-port-hit').count() === 0 && await page.locator('[data-handle="resize"]').count() === 0, 'solo lectura: sin puertos ni control de tamaño');
    await page.keyboard.press('Delete');
    await roNode.dblclick();
    await page.waitForTimeout(300);
    check(await page.locator('.flow-editbox').count() === 0, 'solo lectura: el doble clic no edita');
    const roFlow = await getFlow();
    check(roFlow.nodes.length === 4, 'solo lectura: Supr no elimina');
    check(await page.getByRole('button', { name: 'Descargar SVG' }).count() === 1, 'solo lectura: descarga disponible');
    if (shots) await page.screenshot({ path: join(shots, 't-readonly.png'), fullPage: true });
    await page.evaluate(() => PM.setState({ canWrite: true }));

    const cards = await errorCards(page);
    check(cards.length === 0, 'sin tarjetas de error', cards);
    check(fe0.list().length === 0, 'sin errores de consola (escritorio)', fe0.list());
  } finally { await browser.close(); }

  /* ================================================================ verificaciones adicionales (revisión) */
  {
    const app1 = await openApp({ file, width: 1360, height: 900 });
    const { browser, page } = app1;
    const fe1 = await freshErrors(app1);
    try {
      const pid = await createProject(page);
      const getF = (fid) => page.evaluate(async ([pid, fid]) => PM.store.get(PM.paths.flow(pid, fid)), [pid, fid]);

      /* solo lectura sin diagramas: estado vacío sin acciones de edición */
      await page.evaluate(() => PM.setState({ canWrite: false }));
      await gotoView(page, 'flujogramas');
      check(await page.getByText('Aún no hay diagramas de flujo').isVisible(), 'solo lectura: estado vacío visible');
      check(await page.getByRole('button', { name: 'Nuevo diagrama' }).count() === 0 && await page.locator('.flow-tpl-card').count() === 0, 'solo lectura: estado vacío sin «Nuevo diagrama» ni plantillas');
      await page.evaluate(() => PM.setState({ canWrite: true }));

      /* el modal no crea un diagrama sin nombre */
      await page.locator('.page-actions').getByRole('button', { name: 'Nuevo diagrama' }).click();
      await page.locator('#flow-new-name').fill('   ');
      await page.getByRole('button', { name: 'Crear diagrama' }).click();
      check(await page.getByText('Escribe un nombre para el diagrama.').isVisible(), 'modal: nombre vacío muestra el error');
      check((await page.evaluate(async (pid) => (await PM.store.list(PM.paths.flows(pid))).length, pid)) === 0, 'modal: sin nombre no se crea el diagrama');
      await page.keyboard.press('Escape');

      /* las cuatro plantillas: etiquetas sin tapar elementos ni otras etiquetas, textos dentro de sus símbolos */
      const tplIds = ['cambios', 'recepcion', 'incidentes', 'entregables'];
      await page.evaluate(async ([pid, ids]) => { for (let i = 0; i < ids.length; i++) await PM.store.set(PM.paths.flow(pid, 'f_' + ids[i]), { ...PM.flowTools.fromTemplate(ids[i]), createdAt: '2026-01-0' + (i + 1) + 'T00:00:00Z' }); }, [pid, tplIds]);
      for (const t of tplIds) {
        await page.evaluate((fid) => PM.navigate('flujogramas', { fid }), 'f_' + t);
        await poll(page, () => page.evaluate(() => document.querySelector('.flow-editor')?.dataset.fid), (v) => v === 'f_' + t);
        await page.waitForTimeout(250);
        const geo = await page.evaluate(() => {
          const box = (e) => e.getBoundingClientRect();
          const hit = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
          const nodes = [...document.querySelectorAll('.flow-node .flow-shape')].map(box);
          const labels = [...document.querySelectorAll('.flow-elabel-bg')].map(box);
          let bad = 0;
          for (const l of labels) for (const n of nodes) if (hit(l, n)) bad++;
          for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (hit(labels[i], labels[j])) bad++;
          let outside = 0;
          document.querySelectorAll('.flow-node').forEach((g) => { const s = g.querySelector('.flow-shape').getBBox(); const tx = g.querySelector('.flow-text'); if (!tx) return; const b = tx.getBBox(); if (b.x < s.x - 1 || b.y < s.y - 1 || b.x + b.width > s.x + s.width + 1 || b.y + b.height > s.y + s.height + 1) outside++; });
          const c = box(document.querySelector('.flow-canvas'));
          const fits = nodes.every((n) => n.left >= c.left && n.right <= c.right && n.top >= c.top && n.bottom <= c.bottom);
          return { bad, outside, labels: labels.length, fits, zoom: document.querySelector('.flow-zoom').textContent };
        });
        check(geo.bad === 0 && geo.labels > 0, `plantilla ${t}: etiquetas sin superponerse a elementos ni entre sí`, geo);
        check(geo.outside === 0, `plantilla ${t}: textos dentro de sus símbolos`, geo);
        /* vista inicial legible (≥ 75 %) con el inicio a la vista; «Ajustar a la vista» muestra todo el diagrama */
        const iv = await page.evaluate(() => {
          const c = document.querySelector('.flow-canvas').getBoundingClientRect();
          const k = parseFloat(/scale\(([\d.]+)\)/.exec(document.querySelector('.flow-svg > g').getAttribute('transform'))[1]);
          const fid = document.querySelector('.flow-editor').dataset.fid;
          return { k, c: { l: c.left, r: c.right, t: c.top, b: c.bottom }, fid };
        });
        const tf = await getF('f_' + t);
        const st = await page.evaluate((f) => PM.flowTools.startNode(f.nodes, f.edges), tf);
        const sb = await page.locator(`[data-node="${st.id}"] .flow-shape`).boundingBox();
        check(iv.k >= 0.75, `plantilla ${t}: la vista inicial abre con zoom legible (≥ 75 %)`, iv.k);
        check(sb && sb.x >= iv.c.l && sb.x + sb.width <= iv.c.r && sb.y >= iv.c.t && sb.y + sb.height <= iv.c.b, `plantilla ${t}: la vista inicial muestra el inicio («${st.text}»)`, { sb, c: iv.c });
        await page.getByRole('button', { name: 'Ajustar a la vista' }).click();
        await page.waitForTimeout(100);
        const fitsAll = await page.evaluate(() => { const c = document.querySelector('.flow-canvas').getBoundingClientRect(); return [...document.querySelectorAll('.flow-node .flow-shape')].every((e) => { const n = e.getBoundingClientRect(); return n.left >= c.left && n.right <= c.right && n.top >= c.top && n.bottom <= c.bottom; }); });
        check(fitsAll, `plantilla ${t}: «Ajustar a la vista» muestra todo el diagrama`);
      }
      check(await page.locator('.flow-editor').getAttribute('data-fid') === 'f_entregables', 'params.fid abre el diagrama indicado');

      /* mover: el almacenamiento no cambia durante el arrastre, solo al soltar; las flechas siguen al elemento */
      const fid = 'f_recepcion';
      await page.evaluate((fid) => PM.navigate('flujogramas', { fid }), fid);
      await poll(page, () => page.evaluate(() => document.querySelector('.flow-editor')?.dataset.fid), (v) => v === fid);
      await page.waitForTimeout(250);
      await page.getByRole('button', { name: 'Ajustar a la vista' }).click();
      let f0 = await getF(fid);
      const nov = f0.nodes.find((n) => /Reportar novedad/.test(n.text));
      const novEdge = f0.edges.find((e) => e.to === nov.id);
      const dBefore = await page.locator(`[data-edge="${novEdge.id}"] .flow-edge-line`).getAttribute('d');
      const nb = await center(page.locator(`[data-node="${nov.id}"] .flow-shape`));
      await page.mouse.move(nb.x, nb.y); await page.mouse.down();
      await page.mouse.move(nb.x + 20, nb.y + 30, { steps: 4 }); await page.mouse.move(nb.x + 60, nb.y + 70, { steps: 6 });
      await page.waitForTimeout(800);
      const mid = await getF(fid);
      const dDuring = await page.locator(`[data-edge="${novEdge.id}"] .flow-edge-line`).getAttribute('d');
      check(JSON.stringify(mid.nodes) === JSON.stringify(f0.nodes), 'durante el arrastre no se escribe en el almacenamiento');
      check(dDuring !== dBefore, 'durante el arrastre la flecha sigue al elemento');
      await page.mouse.up();
      const after = await poll(page, () => getF(fid), (x) => x.nodes.find((n) => n.id === nov.id).x !== nov.x);
      check(after.nodes.find((n) => n.id === nov.id).x !== nov.x, 'al soltar se guarda la nueva posición');

      /* Mayús + arrastrar en el fondo: selección por área; Esc la limpia */
      await page.evaluate(() => document.querySelector('.flow-canvas').scrollIntoView({ block: 'end' }));
      await page.waitForTimeout(100);
      const cb = await page.locator('.flow-canvas').boundingBox();
      await page.keyboard.down('Shift');
      await drag(page, { x: cb.x + 6, y: cb.y + 6 }, { x: cb.x + cb.width - 6, y: cb.y + cb.height - 6 });
      await page.keyboard.up('Shift');
      check(await page.locator('.flow-node.is-sel').count() === f0.nodes.length, 'Mayús + arrastrar selecciona por área', await page.locator('.flow-node.is-sel').count());
      check(await page.getByText(f0.nodes.length + ' elementos seleccionados').isVisible(), 'el panel muestra la selección múltiple');
      await page.locator('.flow-canvas').focus();
      await page.keyboard.press('Escape');
      check(await page.locator('.flow-node.is-sel').count() === 0, 'Esc limpia la selección');

      /* soltar una flecha en un espacio vacío crea un proceso conectado */
      await page.getByRole('button', { name: 'Ajustar a la vista' }).click();
      const fin = after.nodes.find((n) => /Equipo disponible/.test(n.text));
      await page.evaluate(() => document.querySelector('.flow-canvas').scrollIntoView({ block: 'end' }));
      await page.waitForTimeout(100);
      const fc = await center(page.locator(`[data-node="${fin.id}"] .flow-shape`));
      await page.mouse.move(fc.x, fc.y);
      const portR = await center(page.locator(`[data-node="${fin.id}"] .flow-port-hit[data-side="right"]`));
      await drag(page, portR, { x: portR.x + 190, y: portR.y + 10 });
      const withNew = await poll(page, () => getF(fid), (x) => x.nodes.length === f0.nodes.length + 1);
      const created = withNew.nodes.find((n) => !after.nodes.some((m) => m.id === n.id));
      check(created && created.type === 'process' && withNew.edges.some((e) => e.from === fin.id && e.to === created.id), 'soltar la flecha en vacío crea un proceso conectado', created);

      /* flecha: Desde/Hacia no permite duplicar una flecha existente */
      const e1 = withNew.edges.find((e) => e.to === created.id);
      const dup = withNew.edges.find((e) => e.id !== e1.id && e.from !== created.id && e.to !== created.id);
      await page.getByRole('button', { name: 'Seleccionar esta flecha' }).first().click();
      await page.locator('[id$="-efrom"]').waitFor();
      await page.locator('[id$="-efrom"]').selectOption(dup.from);
      await poll(page, () => getF(fid), (x) => x.edges.find((e) => e.id === e1.id).from === dup.from);
      await page.locator('[id$="-eto"]').selectOption(dup.to);
      await page.waitForSelector('.toast');
      check((await page.locator('.toast').last().textContent()).includes('Ya existe una flecha'), 'cambiar extremos a un par existente avisa del duplicado');
      await page.waitForTimeout(800);
      const nd = await getF(fid);
      check(nd.edges.filter((e) => e.from === dup.from && e.to === dup.to).length === 1 && nd.edges.find((e) => e.id === e1.id).to === created.id, 'cambiar extremos no crea flechas duplicadas');

      /* foco: elegir en la lista «Elementos» lleva el foco a la sección de la selección */
      await page.getByRole('tab', { name: /Elementos/ }).click();
      await page.locator('.flow-item').first().focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      check(await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('flow-sel')), 'tras elegir desde la lista, el foco queda en la sección de la selección');
      await page.keyboard.press('Tab');
      check(await page.evaluate(() => document.activeElement && document.activeElement.tagName === 'TEXTAREA'), 'Tab lleva al campo de texto del elemento');
      await page.getByRole('button', { name: 'Eliminar elemento' }).click();
      check(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('flow-canvas')), 'tras eliminar desde el panel, el foco vuelve al lienzo');
      await page.keyboard.press('Control+z');
      const restored = await poll(page, () => getF(fid), (x) => x.nodes.length === nd.nodes.length);
      check(restored.nodes.length === nd.nodes.length && restored.edges.length === nd.edges.length, 'deshacer restaura el elemento y sus flechas', { n: restored.nodes.length, e: restored.edges.length });

      /* carriles: alto, orden y eliminación */
      await page.getByRole('button', { name: 'Carriles' }).click();
      await poll(page, () => getF(fid), (x) => x.lanes && x.lanes.length === 3);
      check(await page.getByText('Alto (px)').isVisible(), 'la lista de carriles rotula la columna de alto');
      const h0 = await page.locator('rect.flow-lane').nth(1).getAttribute('height');
      await page.getByLabel('Alto del carril 2 en píxeles').fill('240');
      await page.getByLabel('Alto del carril 2 en píxeles').press('Enter');
      let lf = await poll(page, () => getF(fid), (x) => x.lanes[1].h === 240);
      check(lf.lanes[1].h === 240 && await page.locator('rect.flow-lane').nth(1).getAttribute('height') !== h0, 'cambiar el alto de un carril');
      const firstName = lf.lanes[0].name;
      await page.getByRole('button', { name: 'Bajar el carril 1' }).click();
      lf = await poll(page, () => getF(fid), (x) => x.lanes[1].name === firstName);
      check(lf.lanes[1].name === firstName, 'reordenar carriles');
      await page.getByRole('button', { name: 'Eliminar el carril 3' }).click();
      lf = await poll(page, () => getF(fid), (x) => x.lanes.length === 2);
      check(lf.lanes.length === 2 && await page.locator('rect.flow-lane').count() === 2, 'eliminar un carril');

      /* texto: el editor sobre el lienzo muestra todas las líneas; la decisión no parte palabras si caben enteras */
      await page.evaluate(async (pid) => {
        await PM.store.set(PM.paths.flow(pid, 'f_txt'), { name: 'Textos', description: '', lanes: [], edges: [], createdAt: '2027-01-01T00:00:00Z', updatedAt: PM.nowIso(), nodes: [
          { id: 'd1', type: 'decision', x: 0, y: 0, w: 160, h: 96, text: '¿Aprobado por el comité?' },
          { id: 't1', type: 'terminal', x: 0, y: 160, w: 160, h: 48, text: 'Necesidad de cambio identificada' },
          { id: 'p1', type: 'process', x: 240, y: 0, w: 160, h: 80, text: 'Analizar el impacto en alcance, cronograma, costo, calidad y riesgos del cambio solicitado' },
        ] });
      }, pid);
      await page.evaluate(() => PM.navigate('flujogramas', { fid: 'f_txt' }));
      await page.waitForSelector('[data-node="d1"]');
      await page.waitForTimeout(250);
      const dLines = await page.locator('[data-node="d1"] .flow-text tspan').allTextContents();
      check(dLines.length >= 2 && !dLines.some((l) => /-$/.test(l) || /…/.test(l)), 'decisión: el texto se reparte en líneas sin partir palabras', dLines);
      const tText = await page.locator('[data-node="t1"] .flow-text').textContent();
      check(!tText.includes('…'), 'inicio/fin: el texto de dos líneas cabe en el óvalo', tText);
      await page.locator('.flow-zoom').click();
      await page.getByRole('button', { name: 'Alejar' }).click();
      await page.getByRole('button', { name: 'Alejar' }).click();
      await page.evaluate(() => document.querySelector('.flow-canvas').scrollIntoView({ block: 'end' }));
      await page.locator('[data-node="p1"] .flow-shape').dblclick();
      await page.waitForSelector('textarea.flow-editbox');
      const fitsEditor = await page.locator('textarea.flow-editbox').evaluate((el) => el.scrollHeight <= el.clientHeight + 2);
      check(fitsEditor, 'el editor de texto sobre el lienzo muestra todas las líneas');
      await page.keyboard.press('Escape');

      check(fe1.list().length === 0, 'verificaciones adicionales sin errores de consola', fe1.list());
    } finally { await browser.close(); }
  }

  /* ================================================================ regresiones de la auditoría (proyecto de ejemplo)
     - el diagrama abría al 50 % (texto de ~6 px) y por debajo del pliegue: ahora abre legible, anclado en el inicio,
       con el lienzo más arriba (paleta en una fila, título fundido con el selector, descripción recortada);
     - «Conector» nombraba a la vez el símbolo ISO 5807 y las líneas de flujo: las líneas ahora son «flechas». */
  for (const variant of [{ width: 1360, height: 900, name: 'ejemplo escritorio', maxTop: 520 }, { width: 400, height: 860, name: 'ejemplo 400 px', maxTop: 860 - 120 }]) {
    const app = await openApp({ file, width: variant.width, height: variant.height });
    const feX = await freshErrors(app);
    const { page } = app;
    try {
      const pid = await createExample(page);
      if (!pid) { console.log('     (esta compilación no incluye el proyecto de ejemplo: se omiten las regresiones de ' + variant.name + ')'); continue; }
      await page.waitForTimeout(400);
      await gotoView(page, 'flujogramas');
      await page.waitForSelector('.flow-node');
      await page.waitForTimeout(300);
      await page.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
      const fid = await page.evaluate(() => document.querySelector('.flow-editor').dataset.fid);
      const fx = await page.evaluate(async ([pid, fid]) => PM.store.get(PM.paths.flow(pid, fid)), [pid, fid]);
      const st = await page.evaluate((f) => PM.flowTools.startNode(f.nodes, f.edges), fx);
      const view = () => page.evaluate(() => {
        const c = document.querySelector('.flow-canvas').getBoundingClientRect();
        const k = parseFloat(/scale\(([\d.]+)\)/.exec(document.querySelector('.flow-svg > g').getAttribute('transform'))[1]);
        const inC = (e) => { const b = e.getBoundingClientRect(); return b.left >= c.left - 0.5 && b.right <= c.right + 0.5 && b.top >= c.top - 0.5 && b.bottom <= c.bottom + 0.5; };
        const lane = document.querySelector('.flow-lane-label');
        const pal = [...document.querySelectorAll('.flow-pal-btn')].map((b) => Math.round(b.getBoundingClientRect().top));
        const nodes = [...document.querySelectorAll('.flow-node .flow-shape')];
        return { k, top: Math.round(c.top), laneVisible: !lane || inC(lane), palRows: new Set(pal).size, palCount: pal.length, allFit: nodes.every(inC), font: 13 * k };
      });
      const v0 = await view();
      const sb = await page.locator(`[data-node="${st.id}"] .flow-shape`).boundingBox();
      const cb = await page.locator('.flow-canvas').boundingBox();
      check(st.type === 'terminal' && /necesidad|inicio/i.test(st.text), `${variant.name}: el punto de partida es el terminal de inicio`, st);
      check(v0.k >= 0.75, `${variant.name}: el diagrama abre con zoom legible (texto ≥ 10 px)`, v0);
      check(sb && sb.x >= cb.x && sb.x + sb.width <= cb.x + cb.width && sb.y >= cb.y && sb.y + sb.height <= cb.y + cb.height, `${variant.name}: la vista inicial muestra el terminal de inicio completo`, { sb, cb });
      check(v0.laneVisible, `${variant.name}: la vista inicial muestra la columna del primer carril`);
      check(v0.top <= variant.maxTop, `${variant.name}: el lienzo empieza en la primera pantalla (≤ ${variant.maxTop} px)`, v0.top);
      check(v0.palCount === 8 && v0.palRows === 1, `${variant.name}: la paleta ocupa una sola fila`, v0);
      await page.getByRole('button', { name: 'Ajustar a la vista' }).click();
      await page.waitForTimeout(100);
      const v1 = await view();
      check(v1.allFit && v1.k < v0.k, `${variant.name}: «Ajustar a la vista» sigue dando el panorama completo`, { v0: v0.k, v1: v1.k, allFit: v1.allFit });

      /* nombres: «flecha» para las líneas, «Conector» solo para el símbolo */
      check(await page.getByRole('button', { name: 'Agregar conector', exact: true }).count() === 0 && await page.locator('form[aria-label="Agregar conector"]').count() === 0, `${variant.name}: ya no existe «Agregar conector» para las líneas`);
      check(await page.locator('form[aria-label="Agregar flecha"]').count() === 1 && await page.getByRole('button', { name: 'Agregar flecha', exact: true }).count() === 1, `${variant.name}: el formulario de líneas se llama «Agregar flecha»`);
      check(await page.getByRole('button', { name: 'Agregar símbolo de conector', exact: true }).count() === 1, `${variant.name}: la paleta nombra el símbolo en minúscula («Agregar símbolo de conector»)`);
      const meta = await page.locator('.flow-head-text .xsmall').first().textContent();
      check(/\d+ flechas/.test(meta) && !/conector/i.test(meta), `${variant.name}: el resumen cuenta flechas, no conectores`, meta);
      await page.getByRole('tab', { name: /Elementos/ }).click();
      check(await page.locator('.flow-panel .label-caps', { hasText: /^Flechas \(\d+\)$/ }).count() === 1, `${variant.name}: la lista del panel se titula «Flechas (n)»`);
      const ttl = await page.locator('.flow-pal-btn[data-type="connector"]').getAttribute('title');
      check(/no es una flecha/.test(ttl), `${variant.name}: la ayuda del símbolo Conector lo distingue de las flechas`, ttl);

      /* encabezado compacto: el título sigue en el DOM; la descripción se recorta y «Ver más» la despliega */
      check((await page.locator('h2.flow-head-title').textContent()) === fx.name, `${variant.name}: el título del diagrama sigue disponible para lectores de pantalla`);
      const titleBox = await page.locator('h2.flow-head-title').boundingBox();
      check(titleBox && titleBox.width <= 1, `${variant.name}: con el selector a la vista, el título no se repite en pantalla`, titleBox);
      const desc = page.locator('.flow-desc');
      const h0 = (await desc.boundingBox()).height;
      check(await desc.evaluate((e) => e.classList.contains('is-clamped')) && await page.getByRole('button', { name: 'Ver más' }).isVisible(), `${variant.name}: la descripción larga se recorta con «Ver más»`);
      await page.getByRole('button', { name: 'Ver más' }).click();
      const h1 = (await desc.boundingBox()).height;
      check(h1 > h0 && await page.getByRole('button', { name: 'Ver menos' }).getAttribute('aria-expanded') === 'true', `${variant.name}: «Ver más» despliega la descripción completa`, { h0, h1 });
      await page.getByRole('button', { name: 'Ver menos' }).click();
      check(Math.abs((await desc.boundingBox()).height - h0) < 1, `${variant.name}: «Ver menos» la vuelve a recortar`);

      /* descargas desde «Acciones» (en 400 px los botones de exportar de la barra se ocultan) */
      await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
      if (variant.width === 400) check(!(await page.locator('.flow-tb-export').isVisible()), `${variant.name}: la barra no repite las descargas`);
      await page.getByRole('button', { name: 'Acciones del diagrama' }).click();
      await page.getByRole('menuitem', { name: 'Descargar SVG' }).click();
      const dl = await page.evaluate(() => window.__dl[0]);
      check(dl && /\.svg$/.test(dl.name) && dl.data.includes('<svg'), `${variant.name}: «Acciones › Descargar SVG» entrega el SVG`, dl && dl.name);
      const ov = await horizontalOverflow(page);
      check(ov <= 1, `${variant.name}: sin desplazamiento horizontal de la página`, ov);
      check(feX.list().length === 0, `${variant.name}: sin errores de consola`, feX.list());
    } finally { await app.browser.close(); }
  }

  /* vista inicial (función pura): ajusta si el diagrama cabe legible; si no, abre a 85 % con el inicio a la vista */
  {
    const app = await openApp({ file, width: 1360, height: 900 });
    try {
      const r = await app.page.evaluate(() => {
        const T = PM.flowTools;
        const small = T.initialView({ x: 0, y: 0, w: 400, h: 300 }, { w: 712, h: 610 }, [{ id: 'a', type: 'terminal', x: 0, y: 0, w: 144, h: 48 }], []);
        const nodes = [
          { id: 'n', type: 'note', x: 0, y: 0, w: 176, h: 72 },
          { id: 'p', type: 'process', x: 200, y: 200, w: 160, h: 64 },
          { id: 's', type: 'terminal', x: 1800, y: 40, w: 144, h: 48 },
          { id: 'f', type: 'terminal', x: 200, y: 400, w: 144, h: 48 },
        ];
        const edges = [{ id: 'e1', from: 's', to: 'p' }, { id: 'e2', from: 'p', to: 'f' }, { id: 'e3', from: 'n', to: 's' }];
        const big = T.initialView({ x: 0, y: 0, w: 2000, h: 500 }, { w: 712, h: 610 }, nodes, edges);
        const start = T.startNode(nodes, edges);
        const sx = big.x + 1800 * big.k, sw = 144 * big.k;
        return { small, big, start: start && start.id, startVisible: sx >= 0 && sx + sw <= 712 };
      });
      check(r.small.k === 1, 'vista inicial: un diagrama pequeño se ajusta sin ampliar más del 100 %', r.small);
      check(r.start === 's', 'vista inicial: el inicio es el terminal sin flechas de entrada (las notas no cuentan)', r.start);
      check(r.big.k === 0.85 && r.startVisible, 'vista inicial: un diagrama grande abre a 85 % con el inicio a la vista aunque esté lejos del borde', r);
    } finally { await app.browser.close(); }
  }

  /* ================================================================ 400 px y tema oscuro */
  for (const variant of [{ width: 400, height: 860, dark: false, name: 'm' }, { width: 400, height: 860, dark: true, name: 'm-dark' }, { width: 1360, height: 900, dark: true, name: 'dark' }]) {
    const app = await openApp({ file, width: variant.width, height: variant.height, dark: variant.dark });
    const feV = await freshErrors(app);
    try {
      const pid = await createProject(app.page);
      await app.page.evaluate(async (pid) => {
        await PM.store.set(PM.paths.flow(pid, 'f_a'), PM.flowTools.fromTemplate('recepcion'));
        await PM.store.set(PM.paths.flow(pid, 'f_b'), PM.flowTools.fromTemplate('cambios'));
      }, pid);
      await gotoView(app.page, 'flujogramas');
      await app.page.waitForSelector('.flow-node');
      await app.page.waitForTimeout(300);
      const ov = await horizontalOverflow(app.page);
      check(ov <= 1, `${variant.name}: sin desplazamiento horizontal de la página`, ov);
      if (variant.width === 400) {
        check(await app.page.locator('.flow-picker').isVisible() && !(await app.page.locator('.flow-list').isVisible()), `${variant.name}: selector de diagramas en lugar de lista`);
        const cb = await app.page.locator('.flow-canvas').boundingBox();
        const pb = await app.page.locator('.flow-panel').boundingBox();
        check(pb.y >= cb.y + cb.height, `${variant.name}: el panel queda debajo del lienzo`);
        check(cb.width <= variant.width, `${variant.name}: lienzo dentro del ancho`);
        if (!variant.dark) {
          const n = await app.page.locator('.flow-node').count();
          await app.page.locator('.flow-pal-btn[data-type="process"]').click();
          check(await app.page.locator('.flow-node').count() === n + 1, `${variant.name}: agregar desde la paleta en pantalla angosta`);
        }
      } else {
        await app.page.locator('#flow-picker-select').selectOption('f_b');
        await app.page.waitForTimeout(300);
        await app.page.getByRole('button', { name: 'Ajustar a la vista' }).click();
        await app.page.locator('.flow-node').nth(4).click();
      }
      if (shots) await app.page.screenshot({ path: join(shots, `t-${variant.name}.png`), fullPage: true });
      check(feV.list().length === 0, `${variant.name}: sin errores de consola`, feV.list());
    } finally { await app.browser.close(); }
  }
}

try { await main(); } catch (e) { failures++; console.error('EXCEPCIÓN', e); }
console.log(failures ? `\n${failures} verificación(es) fallaron.` : '\nTodas las verificaciones pasaron.');
process.exit(failures ? 1 : 0);

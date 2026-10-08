// Pruebas del armazón de escritorio (08-shell, head.html): riel plegable con tres modos (fijo, al pasar el mouse,
// con clic) que se alternan con un solo botón, accesibilidad del riel plegado, alineación plegado/desplegado, presencia
// del puntero cuando desaparece el nodo bajo él, riel en ventanas bajas, modo local sin espacio, panel móvil sin cambios
// y vistas que ocupan todo el ancho a 1920 y 2560 px.
// Uso: node test/shell.test.mjs --file <ruta.html> [--quick]   (--quick omite el recorrido de ancho completo)
import { openApp, createExample, gotoView, horizontalOverflow, waitScreenReady } from './harness.mjs';

const argv = process.argv.slice(2); const fi = argv.indexOf('--file');
const file = fi >= 0 ? argv[fi + 1] : 'gestor-pmbok.html';
const quick = argv.includes('--quick');
const results = [];
const check = (name, ok, extra) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 500))); };
const wait = (page, ms) => page.waitForTimeout(ms);
const RAIL_W = 252, MINI_W = 60;

/* estado visible del riel y del área principal */
const rail = (page) => page.evaluate(() => {
  const r = document.querySelector('.rail'); const m = document.querySelector('.main'); const pg = document.querySelector('.view-host .page');
  const mb = document.querySelector('.rail-mode'); const fb = document.querySelector('.rail-fold');
  return {
    mode: r.dataset.mode || null, mini: r.classList.contains('is-mini'), peek: r.classList.contains('is-peek'),
    w: Math.round(r.getBoundingClientRect().width), mainLeft: Math.round(m.getBoundingClientRect().left), mainW: Math.round(m.getBoundingClientRect().width),
    pageW: pg ? Math.round(pg.getBoundingClientRect().width) : null,
    modeLabel: mb ? mb.getAttribute('aria-label') : null, modeTitle: mb ? mb.getAttribute('title') : null,
    fold: fb ? { label: fb.getAttribute('aria-label'), expanded: fb.getAttribute('aria-expanded') } : null,
    view: PM.getState().view,
  };
});
const toastText = (page) => page.$$eval('.toast', (els) => els.map((e) => e.innerText).join(' | '));
/* el riel de escritorio arranca con las preferencias indicadas (y un proyecto de ejemplo) */
async function desktop({ width = 1440, height = 900, mode, collapsed, dark } = {}) {
  const s = await openApp({ file, width, height, dark });
  await createExample(s.page); await wait(s.page, 400);
  /* el puntero empieza sobre el contenido (Playwright lo deja en 0,0, encima del riel) */
  await s.page.mouse.move(Math.round(width * 0.6), Math.round(height * 0.6)); await wait(s.page, 50);
  if (mode || collapsed !== undefined) {
    await s.page.evaluate(({ mode, collapsed }) => { if (mode) PM.prefs.set('railMode', mode); if (collapsed !== undefined) PM.prefs.set('railCollapsed', collapsed); }, { mode, collapsed });
    await s.page.reload(); await waitScreenReady(s.page); await wait(s.page, 300);
    await s.page.mouse.move(Math.round(width * 0.6) + 5, Math.round(height * 0.6)); await wait(s.page, 500);
  }
  return s;
}
/* entra al riel con el teclado: foco en el primer control del contenido y Mayús+Tab (el riel va antes en el DOM) */
const kbIntoRail = async (page) => {
  await page.evaluate(() => { const f = [...document.querySelectorAll('.main button:not([disabled]), .main input:not([disabled]), .main select, .main textarea, .main a[href]')].find((el) => el.getClientRects().length); f.focus(); });
  await page.keyboard.press('Shift+Tab');
};
const MODE_LABEL = {
  fijo: 'Menú: fijo. Cambiar a: se abre al pasar el mouse',
  hover: 'Menú: se abre al pasar el mouse. Cambiar a: se abre con clic',
  clic: 'Menú: se abre con clic. Cambiar a: fijo',
};

/* ------------------------------------------------------------ 1. un solo botón alterna los tres modos y se recuerda */
{
  const { browser, page, errors } = await desktop();
  let r = await rail(page);
  check('por defecto: modo fijo, desplegado y parte del diseño', r.mode === 'fijo' && !r.mini && !r.peek && r.w === RAIL_W && r.mainLeft === RAIL_W, r);
  check('botón de modo: nombre y título dicen el modo actual y lo que hace', r.modeLabel === MODE_LABEL.fijo && r.modeTitle === MODE_LABEL.fijo, r);
  check('modo fijo: botón «Plegar menú» con aria-expanded=true', r.fold && r.fold.label === 'Plegar menú' && r.fold.expanded === 'true', r.fold);
  const seen = [];
  for (const expect of ['hover', 'clic', 'fijo']) {
    await page.click('.rail-mode'); await wait(page, 250);
    r = await rail(page);
    seen.push({ mode: r.mode, label: r.modeLabel, toast: await toastText(page), fold: !!r.fold });
  }
  check('el mismo botón alterna fijo → al pasar el mouse → con clic → fijo', seen.map((x) => x.mode).join(',') === 'hover,clic,fijo', seen);
  check('la etiqueta del botón cambia con el modo', seen[0].label === MODE_LABEL.hover && seen[1].label === MODE_LABEL.clic && seen[2].label === MODE_LABEL.fijo, seen);
  check('cada cambio muestra un aviso que explica el modo', /al pasar el mouse/i.test(seen[0].toast) && /con clic/i.test(seen[1].toast) && /3 segundos/.test(seen[1].toast) && /fijo/i.test(seen[2].toast), seen.map((x) => x.toast));
  check('«Plegar menú» solo existe en el modo fijo', !seen[0].fold && !seen[1].fold && seen[2].fold, seen);
  await page.click('.rail-mode'); await wait(page, 200); /* → hover */
  await page.reload(); await waitScreenReady(page); await wait(page, 300);
  r = await rail(page);
  check('el modo se recuerda al recargar (PM.prefs railMode)', r.mode === 'hover' && (await page.evaluate(() => PM.prefs.get('railMode'))) === 'hover', r);
  /* reducción de movimiento: sin transición */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const dur = await page.evaluate(() => ({ rail: getComputedStyle(document.querySelector('.rail')).transitionDuration, app: getComputedStyle(document.querySelector('.app')).transitionDuration }));
  check('prefers-reduced-motion: sin animación de ancho', dur.rail.split(',').every((d) => parseFloat(d) < 0.01) && dur.app.split(',').every((d) => parseFloat(d) < 0.01), dur);
  check('sin errores de consola (modos)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 2. modo fijo: plegar / desplegar y ancho del contenido */
{
  const { browser, page, errors } = await desktop();
  await gotoView(page, 'cronograma');
  const before = await rail(page);
  await page.click('.rail-fold'); await wait(page, 400);
  const after = await rail(page);
  check('fijo: «Plegar menú» deja el riel angosto y el contenido gana el ancho', after.mini && !after.peek && after.w === MINI_W && after.mainLeft === MINI_W && after.mainW - before.mainW === RAIL_W - MINI_W && after.pageW - before.pageW === RAIL_W - MINI_W, { before, after });
  check('fijo plegado: el botón pasa a «Desplegar menú» (aria-expanded=false)', after.fold && after.fold.label === 'Desplegar menú' && after.fold.expanded === 'false', after.fold);
  await page.mouse.move(30, 450); await wait(page, 700);
  check('fijo: pasar el mouse no despliega el riel', (await rail(page)).mini);
  await page.mouse.move(900, 500); await wait(page, 3400);
  check('fijo: no se despliega ni se pliega solo', (await rail(page)).mini);
  await page.reload(); await waitScreenReady(page); await wait(page, 300);
  const reloaded = await rail(page);
  check('fijo: el estado plegado se recuerda al recargar (railCollapsed)', reloaded.mini && reloaded.w === MINI_W, reloaded);
  /* clic en un ícono del riel plegado navega directamente (en modo fijo no hay «primer clic») */
  await page.click('.nav-item[aria-label="EDT"]'); await wait(page, 300);
  check('fijo plegado: un clic en un ícono navega', (await rail(page)).view === 'edt');
  /* selector de proyecto compacto: menú flotante junto al riel */
  await page.click('.switcher-btn'); await wait(page, 250);
  const fly = await page.evaluate(() => { const m = document.querySelector('.rail .switcher .menu'); if (!m) return null; const b = m.getBoundingClientRect(); return { left: Math.round(b.left), width: Math.round(b.width), items: m.querySelectorAll('.menu-item').length, focus: document.activeElement.getAttribute('role') }; });
  check('fijo plegado: el selector de proyecto abre su menú a la derecha del riel', fly && fly.left >= MINI_W && fly.width >= 240 && fly.items >= 2 && /menuitem/.test(fly.focus || ''), fly);
  await page.keyboard.press('Escape'); await wait(page, 150);
  check('fijo plegado: Escape cierra el menú y devuelve el foco al selector', await page.evaluate(() => !document.querySelector('.rail .switcher .menu') && document.activeElement.classList.contains('switcher-btn')));
  await page.click('.rail-fold'); await wait(page, 400);
  const open = await rail(page);
  check('fijo: «Desplegar menú» vuelve al ancho completo', !open.mini && open.w === RAIL_W && open.mainLeft === RAIL_W, open);
  check('sin errores de consola (fijo)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 3. riel plegado: nombres accesibles y etiquetas emergentes */
{
  const { browser, page, errors } = await desktop({ collapsed: true });
  const a11y = await page.evaluate(() => {
    const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 2 && b.height > 2; };
    const r = document.querySelector('.rail');
    const items = [...r.querySelectorAll('.nav-item')].map((b) => ({ label: b.getAttribute('aria-label'), text: b.querySelector('.nav-label').textContent.trim(), labelVisible: vis(b.querySelector('.nav-label')), title: b.getAttribute('title'), iconOnly: b.getBoundingClientRect().width <= 50 }));
    const sw = r.querySelector('.switcher-btn');
    return {
      items, sw: { label: sw.getAttribute('aria-label'), badge: sw.innerText.replace(/\s+/g, ' ').trim(), tip: sw.getAttribute('data-tip') },
      groupsSep: [...r.querySelectorAll('.nav-group-label')].map((g) => { const b = getComputedStyle(g, '::before'); return { line: b.content !== 'none' && b.height === '1px', text: g.textContent.trim(), textVisible: vis(g.querySelector('.nav-group-text')) }; }),
      ctl: [...r.querySelectorAll('.rail-mode, .rail-fold')].map((b) => ({ label: b.getAttribute('aria-label'), tip: b.getAttribute('data-tip'), title: b.getAttribute('title') })),
      brandText: vis(r.querySelector('.brand-text')), brandMark: vis(r.querySelector('.brand-mark')),
      foot: { store: r.querySelector('.rail-store-text').textContent.trim(), storeVisible: vis(r.querySelector('.rail-store-text')), legal: vis(r.querySelector('.rail-legal')), icon: vis(r.querySelector('.rail-store .icon')) },
      overflow: r.scrollWidth - r.clientWidth,
    };
  });
  check('plegado: cada ícono de navegación tiene nombre accesible (aria-label = etiqueta)', a11y.items.length >= 16 && a11y.items.every((i) => i.label && i.label === i.text && !i.labelVisible && i.iconOnly && !i.title), a11y.items.filter((i) => !(i.label && i.label === i.text && !i.labelVisible && i.iconOnly && !i.title)));
  check('plegado: selector de proyecto compacto con el código y nombre accesible completo', /PRY-2026-014/.test(a11y.sw.label) && /Cambiar de proyecto/.test(a11y.sw.label) && /014/.test(a11y.sw.badge) && /PRY-2026-014 · EJEMPLO/.test(a11y.sw.tip || ''), a11y.sw);
  check('plegado: los títulos de grupo se vuelven separadores (texto solo para lectores de pantalla)', a11y.groupsSep.length >= 4 && a11y.groupsSep.every((g) => g.line && g.text && !g.textVisible), a11y.groupsSep);
  check('plegado: los botones de modo y de plegar tienen etiqueta emergente (data-tip = nombre) y no title nativo', a11y.ctl.length === 2 && a11y.ctl.every((c) => c.label && c.tip === c.label && !c.title), a11y.ctl);
  check('plegado: solo la marca y el ícono de almacenamiento a la vista', a11y.brandMark && !a11y.brandText && a11y.foot.icon && !a11y.foot.storeVisible && !a11y.foot.legal && /navegador|artefacto/.test(a11y.foot.store), { brand: a11y.brandText, foot: a11y.foot });
  check('plegado: nada se desborda a lo ancho del riel', a11y.overflow <= 0, a11y.overflow);
  const byRole = await page.getByRole('button', { name: 'Cronograma (Gantt)', exact: true }).count();
  check('plegado: el ícono se encuentra por su rol y nombre', byRole === 1, byRole);
  /* etiqueta emergente al apuntar y al enfocar con el teclado */
  await page.hover('.nav-item[aria-label="Diagrama de red"]'); await wait(page, 120);
  const tipHover = await page.evaluate(() => { const t = document.querySelector('.rail-tip'); const b = document.querySelector('.nav-item[aria-label="Diagrama de red"]').getBoundingClientRect(); if (!t) return null; const tb = t.getBoundingClientRect(); return { text: t.textContent, left: Math.round(tb.left), right: Math.round(b.right), mid: Math.abs((tb.top + tb.height / 2) - (b.top + b.height / 2)) < 3 }; });
  check('plegado: al apuntar un ícono aparece su etiqueta a la derecha del riel', tipHover && tipHover.text === 'Diagrama de red' && tipHover.left > tipHover.right && tipHover.mid, tipHover);
  await page.mouse.move(900, 500); await wait(page, 100);
  check('plegado: la etiqueta desaparece al salir', await page.evaluate(() => !document.querySelector('.rail-tip')));
  await page.focus('.nav-item[aria-label="EDT"]'); await page.keyboard.press('Tab'); await wait(page, 120);
  const tipKey = await page.evaluate(() => ({ tip: document.querySelector('.rail-tip')?.textContent, focused: document.activeElement.getAttribute('aria-label') }));
  check('plegado: al enfocar con el teclado aparece la etiqueta del ícono', tipKey.tip && tipKey.tip === tipKey.focused, tipKey);
  await page.hover('.rail-mode'); await wait(page, 120);
  const tipMode = await page.evaluate(() => ({ tip: document.querySelector('.rail-tip')?.textContent, label: document.querySelector('.rail-mode').getAttribute('aria-label') }));
  check('plegado: al apuntar el botón de modo aparece su etiqueta (modo actual y siguiente)', tipMode.tip && tipMode.tip === tipMode.label, tipMode);
  await page.mouse.move(900, 500);
  /* el editor de documentos (vista oculta) marca como actual a «Documentos» */
  await page.evaluate(() => PM.openDocument('acta-constitucion')); await wait(page, 350);
  const cur = await page.evaluate(() => ({ view: PM.getState().view, current: [...document.querySelectorAll('.rail .nav-item[aria-current="page"]')].map((b) => b.getAttribute('aria-label')) }));
  check('plegado: al editar un documento, «Documentos» queda marcado como sección actual', cur.view === 'documento' && cur.current.length === 1 && cur.current[0] === 'Documentos', cur);
  check('sin errores de consola (accesibilidad)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 4. modo «al pasar el mouse» */
{
  const { browser, page, errors } = await desktop({ mode: 'hover' });
  await gotoView(page, 'tablero');
  let r = await rail(page);
  check('al pasar el mouse: en reposo plegado y el diseño reserva solo el riel angosto', r.mini && !r.peek && r.w === MINI_W && r.mainLeft === MINI_W, r);
  await page.mouse.move(30, 420); await wait(page, 50);
  const early = await rail(page);
  await wait(page, 250);
  r = await rail(page);
  check('al pasar el mouse: espera la intención (~120 ms) y se despliega', early.mini && !early.peek && r.peek && !r.mini && r.w === RAIL_W, { early, r });
  check('al pasar el mouse: se despliega encima del contenido, sin mover el diseño', r.mainLeft === MINI_W && (await page.evaluate(() => !!document.elementFromPoint(200, 420)?.closest('.rail'))) && (await page.evaluate(() => getComputedStyle(document.querySelector('.rail')).boxShadow !== 'none')), r);
  await page.mouse.move(130, 300); await page.mouse.move(200, 600); await wait(page, 500);
  check('al pasar el mouse: sigue desplegado mientras el mouse está encima', (await rail(page)).peek);
  await page.mouse.move(900, 500); await wait(page, 120);
  const grace = await rail(page);
  await wait(page, 400);
  r = await rail(page);
  check('al pasar el mouse: se pliega al salir (con ~300 ms de gracia)', grace.peek && r.mini && !r.peek, { grace, r });
  /* en este modo el propio despliegue muestra las etiquetas: no aparece la etiqueta emergente (sin destello) */
  await page.mouse.move(900, 500); await wait(page, 500);
  await page.evaluate(() => { window.__tips = 0; window.__tipObs = new MutationObserver(() => { if (document.querySelector('.rail-tip')) window.__tips++; }); window.__tipObs.observe(document.querySelector('.rail'), { childList: true, subtree: true }); });
  { const b = await (await page.$('.nav-item[aria-label="EDT"]')).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); }
  await wait(page, 400);
  check('al pasar el mouse: sin etiqueta emergente que destelle antes de desplegarse', (await page.evaluate(() => { window.__tipObs.disconnect(); return window.__tips; })) === 0 && (await rail(page)).peek);
  await page.mouse.move(900, 500); await wait(page, 500);
  /* un paso rápido sin intención no lo despliega */
  await page.mouse.move(30, 420); await wait(page, 40); await page.mouse.move(900, 420); await wait(page, 400);
  check('al pasar el mouse: un paso rápido (< 120 ms) no lo despliega', (await rail(page)).mini);
  /* clic en un ícono mientras está desplegado navega */
  await page.mouse.move(30, 420); await wait(page, 300);
  await page.click('.nav-item:has-text("EDT")'); await wait(page, 300);
  check('al pasar el mouse: un clic en el riel desplegado navega', (await rail(page)).view === 'edt');
  /* el menú de proyectos abierto lo mantiene desplegado */
  await page.click('.switcher-btn'); await wait(page, 200);
  await page.mouse.move(1100, 700); await wait(page, 900);
  const held = await rail(page);
  check('al pasar el mouse: no se pliega mientras el menú de proyectos está abierto', held.peek && (await page.evaluate(() => !!document.querySelector('.rail .switcher .menu'))), held);
  await page.mouse.click(1100, 700); await wait(page, 300);
  r = await rail(page);
  check('al pasar el mouse: un clic fuera cierra el menú y pliega el riel', r.mini && (await page.evaluate(() => !document.querySelector('.rail .switcher .menu'))), r);
  /* teclado: el foco dentro del riel lo despliega; Escape lo pliega */
  await kbIntoRail(page); await wait(page, 150);
  r = await rail(page);
  const inRail = await page.evaluate(() => !!document.activeElement.closest('.rail'));
  check('al pasar el mouse: el foco del teclado dentro del riel lo despliega', inRail && r.peek, { inRail, r });
  await wait(page, 700);
  check('al pasar el mouse: con el foco dentro no se pliega aunque el mouse esté fuera', (await rail(page)).peek);
  await page.keyboard.press('Escape'); await wait(page, 150);
  check('al pasar el mouse: Escape lo pliega', (await rail(page)).mini);
  await page.keyboard.press('Shift+Tab'); await wait(page, 150);
  check('al pasar el mouse: seguir con el teclado dentro del riel lo vuelve a desplegar', (await rail(page)).peek);
  await page.focus('.view-host .page button'); await wait(page, 150);
  check('al pasar el mouse: el foco que sale al contenido lo pliega', (await rail(page)).mini);
  check('sin errores de consola (al pasar el mouse)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 5. modo «con clic» */
{
  const { browser, page, errors } = await desktop({ mode: 'clic' });
  await gotoView(page, 'tablero');
  let r = await rail(page);
  check('con clic: en reposo plegado y el diseño reserva solo el riel angosto', r.mini && !r.peek && r.w === MINI_W && r.mainLeft === MINI_W, r);
  await page.mouse.move(30, 420); await wait(page, 600);
  check('con clic: pasar el mouse no lo despliega', (await rail(page)).mini);
  await page.click('.nav-item[aria-label="EDT"]'); await wait(page, 250);
  r = await rail(page);
  check('con clic: el primer clic sobre el riel plegado solo lo abre (no navega)', r.peek && !r.mini && r.view === 'tablero' && r.mainLeft === MINI_W, r);
  await wait(page, 3400);
  check('con clic: no se pliega a los 3 s si el mouse sigue sobre el riel', (await rail(page)).peek);
  await page.mouse.move(1000, 500); await wait(page, 2000);
  const mid = await rail(page);
  await wait(page, 1500);
  r = await rail(page);
  check('con clic: se pliega solo 3 s después de que el mouse sale del riel', mid.peek && r.mini, { mid, r });
  /* volver a entrar cancela el temporizador */
  await page.mouse.click(30, 420); await wait(page, 200);
  await page.mouse.move(1000, 500); await wait(page, 2000);
  await page.mouse.move(40, 500); await wait(page, 2200);
  const back = await rail(page);
  await page.mouse.move(1000, 500); await wait(page, 3400);
  r = await rail(page);
  check('con clic: volver a poner el mouse sobre el riel cancela el plegado', back.peek && r.mini, { back, r });
  /* 3 s después de abrir, si el puntero ya no está encima */
  await page.mouse.click(30, 420); await page.mouse.move(1000, 500); await wait(page, 3500);
  check('con clic: abierto y sin el mouse encima, se pliega a los 3 s', (await rail(page)).mini);
  /* un clic fuera lo pliega de inmediato (y la acción de ese clic se cumple) */
  await page.mouse.click(30, 420); await wait(page, 200);
  check('con clic: abierto', (await rail(page)).peek);
  await page.mouse.click(1200, 700); await wait(page, 60);
  check('con clic: un clic fuera del riel lo pliega de inmediato', (await rail(page)).mini);
  /* Escape */
  await page.mouse.click(30, 420); await wait(page, 200);
  await page.keyboard.press('Escape'); await wait(page, 100);
  check('con clic: Escape lo pliega', (await rail(page)).mini);
  /* abierto, el segundo clic navega */
  await page.mouse.click(30, 420); await wait(page, 250);
  await page.click('.nav-item:has-text("Cronograma (Gantt)")'); await wait(page, 300);
  check('con clic: con el riel abierto, un clic en una sección navega', (await rail(page)).view === 'cronograma');
  /* teclado: el foco dentro cuenta como mouse encima */
  await page.mouse.click(1200, 700); await wait(page, 100);
  await kbIntoRail(page); await wait(page, 200);
  const kb = await rail(page);
  await wait(page, 3400);
  const kbLater = await rail(page);
  check('con clic: el foco del teclado lo abre y lo mantiene abierto pasados 3 s', kb.peek && kbLater.peek && (await page.evaluate(() => !!document.activeElement.closest('.rail'))), { kb, kbLater });
  await page.keyboard.press('Escape'); await wait(page, 100);
  check('con clic: Escape lo pliega también con el foco dentro', (await rail(page)).mini);
  /* el botón de modo actúa siempre, aun con el riel plegado */
  await page.click('.rail-mode'); await wait(page, 250);
  r = await rail(page);
  check('con clic: el botón de modo responde al primer clic (pasa a fijo)', r.mode === 'fijo', r);
  check('sin errores de consola (con clic)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 5b. alineación: al desplegarse encima, cada ícono queda donde estaba */
for (const mode of ['hover', 'clic']) {
  const { browser, page, errors } = await desktop({ mode, height: 1000 });
  await gotoView(page, 'tablero'); await page.mouse.move(900, 500); await wait(page, 500);
  const tops = () => page.evaluate(() => [...document.querySelectorAll('.rail .rail-mode, .rail .switcher-btn, .rail .nav-group-label, .rail .nav-item')].map((b) => ({ n: (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 24), top: Math.round(b.getBoundingClientRect().top), h: Math.round(b.getBoundingClientRect().height) })));
  const before = await tops();
  if (mode === 'clic') await page.mouse.click(30, 300); else await page.mouse.move(30, 300, { steps: 3 });
  await wait(page, 450);
  const after = await tops(); const open = await rail(page);
  const moved = before.filter((b, i) => !after[i] || Math.abs(after[i].top - b.top) > 1 || Math.abs(after[i].h - b.h) > 1).map((b, i) => ({ ...b, after: after[before.indexOf(b)] }));
  check(`${mode}: plegado y desplegado, el botón de modo, el selector, los títulos y cada ícono conservan posición y altura`, open.peek && before.length >= 21 && moved.length === 0, moved);
  await page.keyboard.press('Escape'); await page.mouse.move(900, 500); await wait(page, 500);
  /* apuntar el centro de un ícono plegado y hacer clic (con clic: dos veces en el mismo punto) lleva a esa sección */
  const miss = [];
  for (const [label, id] of [['Documentos', 'documentos'], ['Diagrama de red', 'red'], ['Curva S y valor ganado', 'valor-ganado'], ['Diagramas de flujo', 'flujogramas']]) {
    const cy = await page.evaluate((l) => { const b = document.querySelector('.rail .nav-item[aria-label="' + l + '"]').getBoundingClientRect(); return Math.round(b.top + b.height / 2); }, label);
    if (mode === 'clic') { await page.mouse.click(30, cy); await wait(page, 300); await page.mouse.click(30, cy); }
    else { await page.mouse.move(30, cy, { steps: 4 }); await wait(page, 350); await page.mouse.click(30, cy); }
    await wait(page, 300);
    const v = (await rail(page)).view; if (v !== id) miss.push({ label, cy, view: v });
    await page.keyboard.press('Escape'); await page.mouse.move(900, 500); await wait(page, 500);
  }
  check(`${mode}: el clic sobre el ícono apuntado (riel ya desplegado) navega a esa sección`, miss.length === 0, miss);
  check(`sin errores de consola (alineación, ${mode})`, errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 5c. presencia del puntero: modal desde el menú de proyectos y Escape */
for (const mode of ['hover', 'clic']) {
  const { browser, page, errors } = await desktop({ mode });
  await gotoView(page, 'tablero'); await page.mouse.move(900, 500); await wait(page, 400);
  const settle = mode === 'clic' ? 3800 : 900;
  const roam = async (ms) => { for (let t = 0, i = 0; t < ms; t += 500, i++) { await page.mouse.move(700 + (i % 6) * 40, 450 + (i % 3) * 30, { steps: 3 }); await wait(page, 500); } };
  const openRail = async () => { if (mode === 'clic') await page.mouse.click(30, 420); else await page.mouse.move(30, 420, { steps: 3 }); await wait(page, 350); };
  /* «Nuevo proyecto» elimina el ítem bajo el puntero al abrir el modal: Chromium no envía pointerleave al riel */
  await openRail();
  await page.click('.switcher-btn'); await wait(page, 200);
  await page.click('.rail .switcher .menu .menu-item:has-text("Nuevo proyecto")'); await wait(page, 400);
  await page.mouse.move(720, 300, { steps: 6 }); await page.keyboard.press('Escape'); await wait(page, 300);
  await roam(settle);
  let r = await rail(page);
  check(`${mode}: tras abrir «Nuevo proyecto» desde el menú y cerrar el modal, el riel se pliega al mover el mouse fuera`, r.mini && !r.peek && !(await page.evaluate(() => !!document.querySelector('.modal-backdrop'))), r);
  /* menú de proyectos abierto con el mouse y cerrado con Escape: el foco vuelve al selector, pero no cuenta como teclado */
  await openRail();
  await page.click('.switcher-btn'); await wait(page, 200);
  await page.mouse.move(900, 500, { steps: 6 }); await wait(page, settle);
  const held = await rail(page);
  await page.keyboard.press('Escape'); await wait(page, 200);
  const focusBack = await page.evaluate(() => document.activeElement.classList.contains('switcher-btn') && !document.querySelector('.rail .switcher .menu'));
  await roam(settle);
  r = await rail(page);
  check(`${mode}: el menú abierto lo sostiene; al cerrarlo con Escape (foco de vuelta en el selector) el riel retoma el plegado`, held.peek && focusBack && r.mini, { held, focusBack, r });
  /* con el teclado (Tab) el mismo foco sí cuenta como presencia */
  await kbIntoRail(page); await wait(page, 200);
  await page.keyboard.press('Shift+Tab'); await wait(page, 100);
  await roam(settle);
  r = await rail(page);
  check(`${mode}: navegando con Tab, el foco dentro lo mantiene desplegado aunque el mouse se mueva fuera`, r.peek && (await page.evaluate(() => !!document.activeElement.closest('.rail'))), r);
  check(`sin errores de consola (presencia, ${mode})`, errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 5d. ventana baja (portátil): el riel plegado se desplaza y lo avisa */
{
  const { browser, page, errors } = await desktop({ width: 1366, height: 650, collapsed: true });
  const m = await page.evaluate(() => { const r = document.querySelector('.rail'); const cs = getComputedStyle(r); return { sh: r.scrollHeight, ch: r.clientHeight, oy: cs.overflowY, sb: cs.scrollbarWidth, bg: cs.backgroundImage, mini: r.classList.contains('is-mini') }; });
  check('1366×650, riel plegado: desborda en alto, se desplaza y conserva la barra delgada', m.mini && m.sh > m.ch && m.oy === 'auto' && m.sb === 'thin', m);
  check('1366×650, riel plegado: sombras de desplazamiento (arriba/abajo) en el fondo del riel', (m.bg.match(/radial-gradient/g) || []).length === 2 && /local|linear-gradient/.test(m.bg), m.bg.slice(0, 120));
  await page.focus('.nav-item[aria-label="Diagramas de flujo"]'); await wait(page, 150);
  const last = await page.evaluate(() => { const r = document.querySelector('.rail'); const b = document.querySelector('.nav-item[aria-label="Diagramas de flujo"]').getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), ch: r.clientHeight, st: r.scrollTop }; });
  check('1366×650, riel plegado: la última sección se alcanza desplazando el riel', last.st > 0 && last.top >= 0 && last.bottom <= last.ch, last);
  check('sin errores de consola (ventana baja)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 5e. modo local sin espacio: no se anuncia como guardado */
{
  const { browser, page, errors } = await desktop();
  const pidsBefore = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pmbok-gestor.data.v1') || '{}')).filter((k) => /^projects\/[^/]+$/.test(k)).length);
  /* simula la cuota del navegador: setItem falla si el contenido crece más de 20 000 caracteres */
  await page.evaluate(() => { const cur = (localStorage.getItem('pmbok-gestor.data.v1') || '').length; const orig = Storage.prototype.setItem; window.__quota = cur + 20000; Storage.prototype.setItem = function (k, v) { if (String(v).length > window.__quota) { const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); }; });
  /* el aviso «Proyecto de ejemplo creado.» del arranque puede seguir a la vista: se cuentan solo los avisos nuevos */
  const res = await page.evaluate(async () => { const created = () => [...document.querySelectorAll('.toast')].filter((t) => /Proyecto de ejemplo creado/.test(t.innerText)).length; const before = created(); const pid = await PM.createExampleProject('andamio'); return { pid, newCreated: created() - before, toasts: [...document.querySelectorAll('.toast')].map((t) => t.innerText).join(' | '), st: { persistFailed: PM.getState().persistFailed, warn: PM.getState().storageWarning } }; });
  await wait(page, 400);
  const projectsNow = await page.evaluate(() => PM.getState().projectId);
  check('sin espacio: crear el ejemplo falla con un aviso claro y no deja el proyecto a medias', res.pid === null && /No hay espacio/.test(res.toasts) && res.newCreated <= 0 && !res.st.persistFailed, { res, projectsNow });
  /* una edición que no cabe: el pie no dice «Cambios guardados» y aparece el aviso */
  await page.evaluate(() => { window.__quota = 10; });
  await page.evaluate(() => PM.projectOps.update(PM.getState().projectId, { description: 'x'.repeat(200) })); await wait(page, 600);
  const failed = await page.evaluate(() => ({ foot: document.querySelector('.rail-foot').innerText, st: PM.getState().persistFailed, banner: [...document.querySelectorAll('.banner')].map((b) => b.innerText).join(' | ') }));
  check('sin espacio: el pie del riel dice «Cambios sin guardar» y el aviso explica qué hacer', failed.st === true && /Cambios sin guardar/.test(failed.foot) && !/Cambios guardados/.test(failed.foot) && /no permitió guardar/.test(failed.banner), failed);
  await page.evaluate(() => { window.__quota = 1e9; });
  await page.evaluate(() => PM.projectOps.update(PM.getState().projectId, { description: 'y' })); await wait(page, 600);
  const ok = await page.evaluate(() => ({ foot: document.querySelector('.rail-foot').innerText, st: PM.getState().persistFailed, warn: PM.getState().storageWarning }));
  check('sin espacio: cuando vuelve a caber, se guarda y desaparece el aviso', ok.st === false && !ok.warn && /Cambios guardados/.test(ok.foot), ok);
  await page.reload(); await waitScreenReady(page); await wait(page, 300);
  const pidsAfter = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('pmbok-gestor.data.v1') || '{}')).filter((k) => /^projects\/[^/]+$/.test(k)).length);
  check('sin espacio: al recargar hay los mismos proyectos (el fallido no quedó registrado)', pidsAfter === pidsBefore && pidsBefore === 1, { pidsBefore, pidsAfter });
  check('sin errores de consola (sin espacio)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 6. móvil (400 px): el panel lateral no cambia */
{
  const { browser, page, errors } = await openApp({ file, width: 400, height: 860 });
  await createExample(page); await wait(page, 300);
  await page.evaluate(() => { PM.prefs.set('railMode', 'clic'); PM.prefs.set('railCollapsed', true); });
  await page.reload(); await waitScreenReady(page); await wait(page, 300);
  const m = await page.evaluate(() => { const r = document.querySelector('.rail'); const cs = getComputedStyle(r); return { mini: r.classList.contains('is-mini'), peek: r.classList.contains('is-peek'), mode: r.dataset.mode || null, ctl: !!r.querySelector('.rail-ctl'), pos: cs.position, vis: cs.visibility, topbar: getComputedStyle(document.querySelector('.topbar')).display, brand: getComputedStyle(r.querySelector('.brand-text')).display }; });
  check('móvil: sin botones de modo ni plegado, aunque haya preferencias de escritorio', !m.mini && !m.peek && !m.mode && !m.ctl && m.pos === 'fixed' && m.vis === 'hidden' && m.topbar === 'flex', m);
  await page.click('.topbar .topbar-menu'); await wait(page, 350);
  const open = await page.evaluate(() => { const r = document.querySelector('.rail'); const b = r.getBoundingClientRect(); const lab = r.querySelector('.nav-item .nav-label').getBoundingClientRect(); return { w: Math.round(b.width), left: Math.round(b.left), vis: getComputedStyle(r).visibility, label: lab.width > 20, brand: r.querySelector('.brand-text').getBoundingClientRect().width > 50, legal: r.querySelector('.rail-legal').getBoundingClientRect().height > 10, focusIn: !!document.activeElement.closest('.rail') }; });
  check('móvil: el panel se abre completo (300 px, etiquetas, marca y pie) con el foco dentro', open.w === 300 && open.left === 0 && open.vis === 'visible' && open.label && open.brand && open.legal && open.focusIn, open);
  await page.click('.nav-item:has-text("EDT")'); await wait(page, 350);
  check('móvil: navegar cierra el panel', await page.evaluate(() => PM.getState().view === 'edt' && !PM.getState().navOpen && getComputedStyle(document.querySelector('.rail')).visibility === 'hidden'));
  check('móvil: sin desborde horizontal', (await horizontalOverflow(page)) <= 1);
  /* pasar de escritorio plegado a móvil y volver */
  await page.setViewportSize({ width: 1440, height: 900 }); await wait(page, 300);
  const d = await rail(page);
  check('al ensanchar la ventana vuelve el riel de escritorio con el modo guardado', d.mode === 'clic' && d.mini && d.w === MINI_W, d);
  await page.setViewportSize({ width: 400, height: 860 }); await wait(page, 300);
  check('al angostar la ventana vuelve el panel lateral', await page.evaluate(() => { const r = document.querySelector('.rail'); return !r.classList.contains('is-mini') && getComputedStyle(r).position === 'fixed'; }));
  check('sin errores de consola (móvil)', errors.length === 0, errors);
  await browser.close();
}

/* ------------------------------------------------------------ 7. todas las vistas ocupan el ancho disponible */
if (!quick) {
  for (const [width, height] of [[1920, 1080], [2560, 1440]]) {
    const { browser, page, errors } = await desktop({ width, height });
    const views = await page.evaluate(() => PM.views.map((v) => v.id));
    for (const collapsed of [false, true]) {
      if (collapsed) { await page.click('.rail-fold'); await wait(page, 350); }
      const bad = [];
      for (const v of views) {
        if (v === 'documento') { await page.evaluate(() => PM.openDocument('acta-constitucion')); await wait(page, 350); } else await gotoView(page, v);
        await wait(page, 250);
        const m = await page.evaluate(() => {
          const host = document.querySelector('.view-host'); const cs = getComputedStyle(host);
          const right = host.getBoundingClientRect().right - parseFloat(cs.paddingRight);
          const pg = host.querySelector('.page'); if (!pg) return { right, page: null, content: null };
          const clip = (el) => { let r = el.getBoundingClientRect().right; for (let a = el.parentElement; a && a !== host; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') r = Math.min(r, a.getBoundingClientRect().right); return r; };
          let content = 0;
          for (const el of pg.querySelectorAll('.card, .table-wrap, .chart, .toolbar, .tabs, .sheet, .grid, table, svg')) { const b = el.getBoundingClientRect(); if (b.width && b.height) content = Math.max(content, clip(el)); }
          return { right: Math.round(right), page: Math.round(pg.getBoundingClientRect().right), content: Math.round(content) };
        });
        const ov = await horizontalOverflow(page);
        if (m.page === null || Math.abs(m.right - m.page) > 1 || m.right - m.content > 40 || ov > 1) bad.push({ v, ...m, ov });
      }
      check(`${width}×${height}, riel ${collapsed ? 'plegado' : 'desplegado'}: las ${views.length} vistas llegan al borde derecho (≤ 40 px)`, bad.length === 0, bad);
    }
    check(`sin errores de consola (${width} px)`, errors.length === 0, errors);
    await browser.close();
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length ? 1 : 0);

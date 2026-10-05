// Pruebas de interacción del módulo 40 (cronograma, diagrama de red y recursos).
// Uso: node test/schedule.test.mjs [--file ruta.html] [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, horizontalOverflow, errorCards } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info))); };

const { browser, page, errors } = await openApp({ file });
const shot = async (name, opts = {}) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true, ...opts }); };
try {
  const pid = await createProject(page, { start: '2026-08-03', statusDate: '2026-10-02' });
  await page.evaluate(async (pid) => {
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: [
      { id: 'w1', parentId: null, name: 'Ingeniería', order: 1 },
      { id: 'w11', parentId: 'w1', name: 'Diseño del andamio', order: 1, costEstimate: 1000000, responsible: 'Ingeniero de diseño' },
      { id: 'w2', parentId: null, name: 'Montaje', order: 2 },
      { id: 'w21', parentId: 'w2', name: 'Montaje niveles 1–5', order: 1 },
      { id: 'w22', parentId: 'w2', name: 'Montaje niveles 6–10', order: 2 },
    ] });
  }, pid);
  const stored = async (wait = 900) => { await page.waitForTimeout(wait); return page.evaluate(async (pid) => PM.store.get(PM.paths.tool(pid, 'schedule')), pid); };
  const computed = (sch) => page.evaluate((sch) => { const r = PM.calc.computeSchedule(sch, '2026-08-03'); return { tasks: r.tasks.map((t) => ({ id: t.id, startDate: t.startDate, finishDate: t.finishDate, duration: t.duration, critical: t.critical, milestone: t.milestone })), crit: [...r.criticalIds] }; }, sch);
  const fd = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(2, 4);
  const rows = () => page.locator('.sched-grid .sched-row[data-id]');
  const row = (i) => rows().nth(i);
  const editCell = async (i, col, value) => {
    await row(i).locator(`[data-col="${col}"] button.sched-cell`).click();
    const input = row(i).locator(`[data-col="${col}"] .sched-edit input`);
    await input.fill(value); await input.press('Enter');
  };

  /* ---------- vacío e importación desde la EDT */
  await gotoView(page, 'cronograma');
  check('estado vacío con «Importar desde la EDT»', await page.locator('.empty button:has-text("Importar desde la EDT")').isVisible());
  await page.click('.empty button:has-text("Importar desde la EDT")');
  await page.waitForSelector('.sched-row[data-id]');
  check('importar crea una actividad por paquete de trabajo', (await rows().count()) === 3, await rows().count());
  await page.click('label.check:has-text("Agrupar por EDT")');
  await page.waitForTimeout(200);
  check('modo plano sin filas resumen', (await page.locator('.sched-row.is-sum').count()) === 0);

  /* ---------- agregar actividad y edición en la tabla */
  await page.click('button:has-text("Agregar actividad")');
  await page.waitForSelector('.sched-edit input');
  await page.keyboard.type('Inspección y certificación');
  await page.keyboard.press('Enter');
  check('agregar actividad con nombre escrito en la fila', (await row(3).locator('[data-col="name"]').innerText()).includes('Inspección y certificación'));
  await editCell(1, 'dur', '4');
  await editCell(2, 'dur', '3');
  await editCell(3, 'dur', '2');
  await editCell(1, 'pred', '1');
  await editCell(2, 'pred', '2CC+1');
  // errores de análisis
  await row(3).locator('[data-col="pred"] button.sched-cell').click();
  let inp = row(3).locator('[data-col="pred"] .sched-edit input');
  await inp.fill('abc'); await inp.press('Enter');
  check('predecesora no válida muestra error', (await row(3).locator('.sched-err').innerText()).includes('no es válido'));
  await inp.fill('9'); await inp.press('Enter');
  check('fila inexistente muestra error', (await row(3).locator('.sched-err').innerText()).includes('La fila 9 no existe'));
  await inp.fill('3FS+2'); await inp.press('Enter');
  check('notación inglesa FS+2 aceptada', (await row(3).locator('[data-col="pred"]').innerText()).trim() === '3FC+2');
  await row(0).locator('[data-col="pred"] button.sched-cell').click();
  inp = row(0).locator('[data-col="pred"] .sched-edit input');
  await inp.fill('4'); await inp.press('Enter');
  check('dependencia circular rechazada', (await row(0).locator('.sched-err').innerText()).includes('circular'));
  await inp.press('Escape');

  let sch = await stored();
  check('dependencias guardadas (FC y CC)', sch.tasks[1].deps[0].type === 'FS' && sch.tasks[2].deps[0].type === 'SS' && sch.tasks[2].deps[0].lag === 1 && sch.tasks[3].deps[0].lag === 2, sch.tasks.map((t) => t.deps));
  let comp = await computed(sch);
  const gridDates = async () => { const out = []; const n = await rows().count(); for (let i = 0; i < n; i++) out.push([(await row(i).locator('[data-col="start"]').innerText()).trim(), (await row(i).locator('[data-col="finish"]').innerText()).trim()]); return out; };
  let gd = await gridDates();
  check('fechas de la tabla = computeSchedule', comp.tasks.every((t, i) => gd[i][0] === fd(t.startDate) && gd[i][1] === fd(t.finishDate)), { gd, comp: comp.tasks });
  check('festivo 7 ago excluido (5 d terminan el 10/08)', gd[0][1] === '10/08/26', gd[0]);

  /* ---------- ruta crítica */
  const critBars = () => page.locator('g.sched-bar[data-crit="1"]').count();
  check('barras críticas = criticalIds', (await critBars()) === comp.crit.length && comp.crit.length > 0, { bars: await critBars(), crit: comp.crit });
  await page.click('label.check:has-text("Ruta crítica")');
  check('ocultar ruta crítica', (await critBars()) === 0);
  await page.click('label.check:has-text("Ruta crítica")');

  /* ---------- sombreado de no laborables (semana con festivo) */
  await page.click('.btn-group button:has-text("Día")');
  await page.waitForTimeout(200);
  const nonwork = () => page.$$eval('rect.sched-nonwork', (els) => els.map((e) => e.getAttribute('data-date')).filter((d) => d >= '2026-08-03' && d <= '2026-08-09'));
  check('semana del 3 ago L-V: 3 días sombreados (festivo, sáb, dom)', (await nonwork()).length === 3, await nonwork());
  check('festivo con nombre en tooltip', (await page.locator('rect.sched-holiday[data-date="2026-08-07"] title').textContent()).includes('Batalla de Boyacá'));

  /* ---------- arrastrar una barra (sin predecesoras) */
  const ppd = +(await page.getAttribute('svg.sched-body', 'data-ppd'));
  const origin = await page.getAttribute('svg.sched-body', 'data-origin');
  const t0 = sch.tasks[0].id;
  const scrollTo = async (id) => { await page.evaluate((id) => { const f = document.querySelector('.sched-frame'); const r = document.querySelector(`g.sched-bar[data-id="${id}"] .sched-bar-main, g.sched-bar[data-id="${id}"] .sched-ms`); const x = +(r.getAttribute('x') || r.getAttribute('data-cx')); f.scrollLeft = Math.max(0, x - 120); }, id); await page.waitForTimeout(100); };
  const dragBy = async (sel, dx) => { const b = await page.locator(sel).boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2; await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / 2, y, { steps: 4 }); await page.mouse.move(x + dx, y, { steps: 4 }); await page.mouse.up(); };
  await scrollTo(t0);
  await dragBy(`g.sched-bar[data-id="${t0}"] .sched-bar-main`, 3 * ppd);
  sch = await stored();
  check('arrastrar barra fija «No comenzar antes de» (+3 días → 06/08)', sch.tasks[0].start === '2026-08-06', sch.tasks[0].start);
  gd = await gridDates();
  check('la barra arrastrada se recalcula', gd[0][0] === '06/08/26', gd[0]);

  /* ---------- arrastrar hacia atrás una actividad con predecesora: manda la dependencia */
  const t1 = sch.tasks[1].id;
  await scrollTo(t1);
  await dragBy(`g.sched-bar[data-id="${t1}"] .sched-bar-main`, -3 * ppd);
  await page.waitForTimeout(150);
  const toast = await page.locator('.toast').last().innerText();
  check('aviso: la dependencia manda', toast.includes('manda la dependencia'), toast);
  sch = await stored();
  comp = await computed(sch);
  check('restricción guardada pero la fecha la fija la predecesora', !!sch.tasks[1].start && comp.tasks[1].startDate > sch.tasks[1].start, { start: sch.tasks[1].start, comp: comp.tasks[1].startDate });

  /* ---------- redimensionar (duración) */
  const t3 = sch.tasks[3].id;
  await scrollTo(t3);
  const before3 = comp.tasks[3];
  const hb = await page.locator(`g.sched-bar[data-id="${t3}"] .sched-handle`).boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + 2 * ppd, hb.y + hb.height / 2, { steps: 4 }); await page.mouse.move(hb.x + hb.width / 2 + 4 * ppd, hb.y + hb.height / 2, { steps: 4 }); await page.mouse.up();
  const expDur = await page.evaluate(({ sch, start, finish }) => { const cal = PM.calc.computeSchedule(sch, '2026-08-03').cal; let nf = PM.date.add(finish, 4); while (!cal.isWork(nf)) nf = PM.date.add(nf, -1); return cal.countWork(start, nf); }, { sch, start: before3.startDate, finish: before3.finishDate });
  sch = await stored();
  check('arrastrar el borde cambia la duración en días hábiles', sch.tasks[3].duration === expDur && expDur !== before3.duration, { got: sch.tasks[3].duration, expDur });

  /* ---------- hito: posición del rombo al cierre de su fecha */
  await row(3).locator('[data-col="num"]').click();
  await page.click('button:has-text("Agregar hito")');
  await page.waitForSelector('.sched-edit input');
  await page.keyboard.type('Andamio entregado'); await page.keyboard.press('Enter');
  await editCell(4, 'pred', '4');
  sch = await stored();
  comp = await computed(sch);
  const ms = comp.tasks[4];
  check('hito agregado después de la fila seleccionada', ms.milestone && sch.tasks[4].name === 'Andamio entregado', sch.tasks.map((t) => t.name));
  const cxAttr = +(await page.getAttribute(`g.sched-bar[data-id="${ms.id}"] path.sched-ms`, 'data-cx'));
  const expCx = await page.evaluate(({ origin, d, ppd }) => (PM.date.diff(origin, d) + 1) * ppd, { origin, d: ms.startDate, ppd });
  check('rombo del hito al cierre de su fecha', Math.abs(cxAttr - expCx) < 0.01 && ms.startDate === comp.tasks[3].finishDate, { cxAttr, expCx, ms: ms.startDate });

  /* ---------- subir / bajar */
  await row(0).locator('[data-col="num"]').click();
  await page.click('button[aria-label="Bajar actividad"]');
  sch = await stored();
  const firstAfterDown = sch.tasks[1].id;
  await page.click('button[aria-label="Subir actividad"]');
  const sch2 = await stored();
  check('bajar y subir reordenan la lista', firstAfterDown === t0 && sch2.tasks[0].id === t0);

  /* ---------- línea base */
  await page.evaluate(async (pid) => {
    const s = await PM.store.get(PM.paths.tool(pid, 'schedule'));
    const sched = PM.calc.computeSchedule(s, '2026-08-03');
    const snap = PM.calc.makeBaselineSnapshot({ includes: ['schedule'], sched });
    await PM.store.set(PM.paths.baseline(pid, 'lb0'), { number: 0, label: 'LB0', date: '2026-08-01', includes: ['schedule'], note: '', changeRef: '', byId: null, ...snap });
  }, pid);
  await page.waitForTimeout(300);
  check('barras de línea base (una por actividad)', (await page.locator('.sched-base').count()) === 5, await page.locator('.sched-base').count());
  await page.click('label.check:has-text("Línea base")');
  check('ocultar línea base', (await page.locator('.sched-base').count()) === 0);
  await page.click('label.check:has-text("Línea base")');

  /* ---------- agrupar por EDT */
  await page.click('label.check:has-text("Agrupar por EDT")');
  await page.waitForTimeout(200);
  const sums = await page.$$eval('.sched-row.is-sum', (els) => els.map((e) => e.getAttribute('data-sum')));
  check('filas resumen por nodo de la EDT y «Sin paquete»', sums.length === 6 && sums.includes('__none'), sums);
  await page.locator('.sched-row.is-sum[data-sum="w2"] .sched-tog').click();
  check('contraer un resumen oculta sus actividades', (await page.locator('.sched-row.is-sum').count()) === 4 && (await rows().count()) === 3);
  await page.locator('.sched-row.is-sum[data-sum="w2"] .sched-tog').click();
  await page.click('label.check:has-text("Agrupar por EDT")');
  await shot('gantt');

  /* ---------- exportar CSV y SVG (descarga simulada) */
  await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
  await page.click('button:has-text("Exportar CSV")');
  await page.click('button:has-text("Descargar SVG")');
  const dl = await page.evaluate(() => window.__dl);
  check('CSV del cronograma', dl[0] && dl[0].name.endsWith('_cronograma.csv') && dl[0].data.includes('Predecesoras') && dl[0].data.includes('Andamio entregado'), dl[0] && dl[0].name);
  check('SVG del Gantt', dl[1] && dl[1].name.endsWith('.svg') && dl[1].data.startsWith('<?xml') && dl[1].data.includes('Andamio entregado'), dl[1] && dl[1].name);

  /* ---------- pestañas: actividades e hitos */
  await page.click('.tabs .tab:has-text("Actividades")');
  check('tabla completa con holguras', (await page.locator('.sched-tbl tbody tr').count()) === 5 && (await page.locator('.sched-tbl th:has-text("Holg. total")').count()) === 1);
  await page.click('.tabs .tab:has-text("Hitos")');
  check('lista de hitos con fecha de línea base', (await page.locator('.sched-tbl tbody tr').count()) === 1 && (await page.locator('.sched-tbl tbody tr td').nth(4).innerText()).includes('/'));

  /* ---------- calendario: semana L-S cambia las fechas */
  await page.click('.tabs .tab:has-text("Gantt")');
  const finBefore = (await gridDates())[3][1];
  await page.click('.tabs .tab:has-text("Calendario")');
  check('festivos de Colombia listados', (await page.locator('td:has-text("Batalla de Boyacá")').count()) >= 1);
  await page.click('button:has-text("Lunes a sábado")');
  sch = await stored();
  check('semana laboral guardada (6)', sch.settings.workweek === 6, sch.settings);
  await page.click('.tabs .tab:has-text("Gantt")');
  await page.waitForTimeout(150);
  gd = await gridDates();
  comp = await computed(sch);
  check('las fechas se recalculan con la semana L-S', gd[3][1] !== finBefore && comp.tasks.every((t, i) => gd[i][1] === fd(t.finishDate)), { finBefore, now: gd[3][1] });
  check('semana del 3 ago L-S: 2 días sombreados', (await nonwork()).length === 2, await nonwork());

  /* ---------- recursos desde el editor */
  const addResource = async (i, name, units) => {
    await row(i).locator('[data-col="num"]').dblclick();
    await page.waitForSelector('.modal');
    await page.click('.modal button:has-text("Agregar recurso")');
    await page.fill('.modal input[aria-label="Nombre del recurso 1"]', name);
    await page.fill('.modal input[aria-label="Unidades del recurso 1"]', String(units));
    await page.click('.modal button:has-text("Guardar cambios")');
    await page.waitForSelector('.modal', { state: 'detached' });
  };
  await addResource(1, 'Cuadrilla de montaje', 6);
  await addResource(2, 'Cuadrilla de montaje', 4);
  sch = await stored();
  check('recursos guardados desde el editor', sch.tasks[1].resources[0].units === 6 && sch.tasks[2].resources[0].name === 'Cuadrilla de montaje', sch.tasks.map((t) => t.resources));

  /* ---------- diagrama de red */
  await gotoView(page, 'red');
  comp = await computed(sch);
  check('nodos del diagrama de red (actividades + inicio y fin)', (await page.locator('g.sched-net-node').count()) === 5 && (await page.locator('g.sched-net-end').count()) === 2);
  check('nodos críticos resaltados', (await page.locator('g.sched-net-node.is-crit').count()) === comp.crit.length, { nodes: await page.locator('g.sched-net-node.is-crit').count(), crit: comp.crit.length });
  check('etiqueta de vínculo CC+1', (await page.locator('.sched-net-elbl:has-text("CC+1")').count()) === 1);
  await page.click('.btn-group button:has-text("Fechas")');
  check('modo fechas en la tabla de ruta crítica', (await page.locator('.sched-tbl tbody tr').first().innerText()).includes('ago'));
  await shot('red');

  /* ---------- recursos: histograma y sobreasignación */
  await gotoView(page, 'recursos');
  await page.fill('input[aria-label="Disponibilidad de Cuadrilla de montaje"]', '8');
  await page.waitForTimeout(300);
  check('conflicto de sobreasignación listado', (await page.locator('.sched-conflicts tbody tr').count()) >= 1);
  check('periodo sobreasignado resaltado en el histograma', (await page.locator('.sched-hist-over').count()) >= 1);
  await page.locator('.sched-reslist tbody tr').first().click();
  await page.waitForTimeout(150);
  check('histograma de un recurso con la parte sobreasignada', (await page.locator('path.sched-hist-over').count()) >= 1);
  sch = await stored();
  check('disponibilidad guardada en settings.resourceLimits', sch.settings.resourceLimits && sch.settings.resourceLimits['Cuadrilla de montaje'] === 8, sch.settings.resourceLimits);
  await shot('recursos');

  /* ---------- eliminar con limpieza de dependencias */
  await gotoView(page, 'cronograma');
  const del = sch.tasks[2].id;
  await row(2).locator('[data-col="num"]').click();
  await page.click('.toolbar button:has-text("Eliminar")');
  await page.click('.modal button:has-text("Eliminar actividad")');
  sch = await stored();
  check('eliminar actividad y quitarla de las predecesoras', sch.tasks.length === 4 && !sch.tasks.some((t) => t.id === del || (t.deps || []).some((d) => d.id === del)));

  /* ---------- persistencia tras recargar */
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
  await gotoView(page, 'cronograma');
  await page.waitForSelector('.sched-row[data-id]');
  const names = await page.$$eval('.sched-row[data-id] [data-col="name"]', (els) => els.map((e) => e.innerText.trim()));
  check('persistencia tras recargar', names.length === 4 && names.includes('Andamio entregado') && names.includes('Inspección y certificación'), names);

  /* ---------- solo lectura */
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await page.waitForTimeout(150);
  check('solo lectura: sin acciones de edición', (await page.locator('button:has-text("Agregar actividad")').count()) === 0 && (await page.locator('button.sched-cell').count()) === 0 && (await page.locator('.sched-handle').count()) === 0);
  await page.evaluate(() => PM.setState({ canWrite: true }));

  /* ---------- 400 px y tema oscuro */
  await page.setViewportSize({ width: 400, height: 860 });
  for (const tab of ['Gantt', 'Actividades', 'Hitos', 'Calendario']) {
    await page.click(`.tabs .tab:has-text("${tab}")`); await page.waitForTimeout(200);
    const ov = await horizontalOverflow(page);
    check(`400 px sin desborde: ${tab}`, ov <= 1, ov);
    if (tab === 'Gantt') await shot('gantt-400');
  }
  await page.click('.tabs .tab:has-text("Gantt")');
  check('400 px: columnas compactas en el Gantt', (await page.locator('.sched-ghead > div').count()) === 3);
  for (const v of ['red', 'recursos']) { await gotoView(page, v); const ov = await horizontalOverflow(page); check(`400 px sin desborde: ${v}`, ov <= 1, ov); }
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await gotoView(page, 'cronograma');
  await shot('gantt-dark');
  const cards = await errorCards(page);
  check('sin tarjetas de error', cards.length === 0, cards);

  /* ================= Bloque B (revisión): proyecto independiente para el resto de requisitos ================= */
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => { PM.prefs.set('sched.group', false); PM.prefs.set('sched.tab', 'gantt'); PM.prefs.set('sched.zoom', 'dia'); PM.prefs.set('sched.label', 'name'); PM.prefs.set('sched.deps', true); PM.prefs.set('sched.crit', true); });
  const pidB = await createProject(page, { name: 'Proyecto B', code: 'PRY-B', start: '2026-08-03', statusDate: '2026-08-20' });
  await page.evaluate(async (pid) => {
    const T = (id, name, duration, deps, extra = {}) => ({ id, name, wbsId: null, duration, milestone: duration === 0, start: null, deps, progress: 0, cost: 0, resources: [], responsible: '', actualStart: null, actualFinish: null, notes: '', ...extra });
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [
      T('a', 'Levantamiento', 3, [], { responsible: 'Ingeniero de diseño', cost: 3000000, progress: 100 }),
      T('b', 'Diseño', 4, [{ id: 'a', type: 'FS', lag: 0 }], { responsible: 'Ingeniero de diseño', cost: 5000000 }),
      T('m1', 'Levantamiento recibido', 0, [{ id: 'a', type: 'FS', lag: 0 }], { progress: 100 }),
      T('m2', 'Ingeniería entregada', 0, [{ id: 'b', type: 'FS', lag: 0 }]),
      T('c', 'Montaje', 5, [{ id: 'b', type: 'FS', lag: 1 }]),
    ] });
  }, pidB);
  await gotoView(page, 'cronograma');
  await page.waitForSelector('.sched-row[data-id="c"]');
  const storedB = async (wait = 900) => { await page.waitForTimeout(wait); return page.evaluate(async (pid) => PM.store.get(PM.paths.tool(pid, 'schedule')), pidB); };
  const rowB = (id) => page.locator(`.sched-grid .sched-row[data-id="${id}"]`);

  /* Esc cancela la edición (no guarda) y Enter confirma una sola vez */
  await rowB('a').locator('[data-col="name"] button.sched-cell').click();
  await rowB('a').locator('[data-col="name"] input').fill('Nombre que se cancela');
  await rowB('a').locator('[data-col="name"] input').press('Escape');
  let sB = await storedB();
  check('Esc cancela la edición en la tabla (no guarda)', sB.tasks[0].name === 'Levantamiento' && (await rowB('a').locator('[data-col="name"]').innerText()).includes('Levantamiento'), sB.tasks[0].name);
  await rowB('c').locator('[data-col="start"] button.sched-cell').click();
  await rowB('c').locator('[data-col="start"] input').fill('2026-08-22');
  await rowB('c').locator('[data-col="start"] input').press('Enter');
  await page.waitForTimeout(250);
  const montToasts = (await page.locator('.toast').allInnerTexts()).filter((x) => x.includes('«Montaje»'));
  check('restricción en sábado: un solo aviso que explica el día no hábil', montToasts.length === 1 && montToasts[0].includes('no es día hábil'), montToasts);
  sB = await storedB();
  const compB = await page.evaluate((sch) => PM.calc.computeSchedule(sch, '2026-08-03').byId.get('c').startDate, sB);
  check('restricción guardada y la actividad empieza el lunes siguiente', sB.tasks[4].start === '2026-08-22' && compB === '2026-08-24', { start: sB.tasks[4].start, compB });
  await rowB('c').locator('[data-col="start"] button.sched-cell').click();
  await rowB('c').locator('[data-col="start"] input').fill('');
  await rowB('c').locator('[data-col="start"] input').press('Enter');
  sB = await storedB();
  check('borrar la fecha quita la restricción', sB.tasks[4].start === null, sB.tasks[4].start);

  /* escala de tiempo: dos niveles según el zoom; línea de corte rotulada */
  const headText = () => page.$$eval('.sched-headrow svg text', (els) => els.map((e) => e.textContent).join('|'));
  check('zoom Día: semanas arriba y días abajo', /Semana 32/.test(await headText()) && /\b0?7\b/.test(await headText()));
  await page.click('.btn-group button:has-text("Semana")'); await page.waitForTimeout(150);
  check('zoom Semana: meses arriba', (await headText()).includes('agosto 2026'));
  await page.click('.btn-group button:has-text("Mes")'); await page.waitForTimeout(150);
  check('zoom Mes: años y meses', (await headText()).includes('2026') && (await headText()).includes('ago'));
  check('línea de fecha de corte rotulada', (await page.locator('.sched-headrow text.sched-mark').allTextContents()).some((x) => x.startsWith('Corte')));
  await page.click('.btn-group button:has-text("Día")'); await page.waitForTimeout(150);

  /* flechas de dependencia y etiquetas */
  check('una flecha por dependencia', (await page.locator('path.sched-dep').count()) === 4, await page.locator('path.sched-dep').count());
  await page.click('label.check:has-text("Dependencias")');
  check('ocultar dependencias', (await page.locator('path.sched-dep').count()) === 0);
  await page.click('label.check:has-text("Dependencias")');
  await page.selectOption('.sched-lblsel select', 'resp');
  check('etiqueta de barra con el responsable', (await page.locator('text.sched-lbl').allTextContents()).includes('Ingeniero de diseño'));
  await page.selectOption('.sched-lblsel select', 'name');

  /* tooltip de la barra */
  await page.evaluate(() => { const f = document.querySelector('.sched-frame'); const r = document.querySelector('g.sched-bar[data-id="b"] .sched-bar-main'); f.scrollLeft = Math.max(0, +r.getAttribute('x') - 60); });
  await page.waitForTimeout(100);
  await page.hover('g.sched-bar[data-id="b"] .sched-bar-main');
  await page.waitForTimeout(150);
  const tipTxt = await page.locator('.chart-tip').innerText().catch(() => '');
  check('tooltip con fechas, holguras, avance y costo', ['Inicio – fin', 'Duración', 'Holgura total / libre', 'Avance', 'Costo'].every((k) => tipTxt.includes(k)) && tipTxt.includes('5.000.000'), tipTxt);
  await page.mouse.move(5, 5);

  /* editor de actividad: predecesora CC con desfase, duración obligatoria y valores calculados */
  await rowB('c').locator('[data-col="num"]').dblclick();
  await page.waitForSelector('.modal');
  const kvTxt = (await page.locator('.modal .sched-kv').innerText()).toLowerCase();
  check('editor muestra valores calculados (fechas tempranas y tardías, holguras, crítica)', ['inicio temprano', 'fin tardío', 'holgura total', 'holgura libre', 'crítica'].every((k) => kvTxt.includes(k)), kvTxt);
  await page.click('.modal button:has-text("Agregar predecesora")');
  await page.selectOption('.modal select[aria-label="Predecesora 2"]', 'a');
  await page.selectOption('.modal select[aria-label="Tipo de dependencia 2"]', 'SS');
  await page.fill('.modal input[aria-label="Desfase en días 2"]', '2');
  check('tipos de dependencia con nombres en español', (await page.locator('.modal select[aria-label="Tipo de dependencia 2"] option').allInnerTexts()).join('|') === 'Fin a comienzo (FC)|Comienzo a comienzo (CC)|Fin a fin (FF)|Comienzo a fin (CF)');
  await page.fill('#te-dur', '');
  await page.click('.modal button:has-text("Guardar cambios")');
  check('duración vacía: error en el editor (no la convierte en hito)', (await page.locator('.modal .sched-banner').innerText()).includes('duración'));
  await page.fill('#te-dur', '6');
  await page.fill('#te-resp', 'Supervisor de montaje');
  await page.click('.modal button:has-text("Guardar cambios")');
  await page.waitForSelector('.modal', { state: 'detached' });
  sB = await storedB();
  const tc = sB.tasks.find((t) => t.id === 'c');
  check('editor guarda predecesora CC+2, duración y responsable', tc.duration === 6 && tc.responsible === 'Supervisor de montaje' && tc.deps.some((d) => d.id === 'a' && d.type === 'SS' && d.lag === 2) && tc.deps.some((d) => d.id === 'b' && d.type === 'FS' && d.lag === 1), tc);
  check('la tabla muestra la predecesora en notación española', (await rowB('c').locator('[data-col="pred"]').innerText()).trim() === '2FC+1;1CC+2', await rowB('c').locator('[data-col="pred"]').innerText());

  /* hitos: estados a la fecha de corte */
  await page.click('.tabs .tab:has-text("Hitos")');
  const msStates = await page.$$eval('.sched-tbl tbody tr', (trs) => trs.map((tr) => [tr.getAttribute('data-id'), tr.lastElementChild.previousElementSibling.innerText.trim()]));
  check('hitos: Cumplido (100 %) y Vencido (antes de la fecha de corte)', JSON.stringify(msStates) === JSON.stringify([['m1', 'Cumplido'], ['m2', 'Vencido']]), msStates);

  /* actividades: edición de costo y responsable en la tabla completa */
  await page.click('.tabs .tab:has-text("Actividades")');
  const actRow = page.locator('.sched-tbl tbody tr[data-id="b"]');
  await actRow.locator('button[aria-label^="Costo, fila 2"]').click();
  await actRow.locator('input[aria-label="Costo, fila 2"]').fill('7.500.000');
  await actRow.locator('input[aria-label="Costo, fila 2"]').press('Enter');
  sB = await storedB();
  check('costo editable en la tabla de actividades', sB.tasks[1].cost === 7500000, sB.tasks[1].cost);

  /* calendario: días no laborables adicionales y festivos */
  await page.click('.tabs .tab:has-text("Calendario")');
  await page.fill('input[aria-label="Día no laborable"]', '2026-08-11');
  await page.click('button:has-text("Agregar día no laborable")');
  sB = await storedB();
  check('día no laborable adicional guardado', (sB.settings.extraHolidays || []).includes('2026-08-11'), sB.settings);
  await page.fill('input[aria-label="Día no laborable"]', '2026-08-08');
  await page.click('button:has-text("Agregar día no laborable")');
  check('rechaza un día que ya es no laborable con un mensaje', (await page.locator('.field-error').innerText()).includes('ya es no laborable'));
  await page.click('button[aria-label="Quitar 11 de agosto de 2026"]');
  sB = await storedB();
  check('quitar día no laborable adicional', !(sB.settings.extraHolidays || []).includes('2026-08-11'), sB.settings);
  await page.click('label.check:has-text("Festivos de Colombia")');
  sB = await storedB();
  check('desactivar festivos de Colombia', sB.settings.holidaysCO === false);
  await page.click('.tabs .tab:has-text("Gantt")'); await page.waitForTimeout(150);
  check('sin festivos: el 7 ago deja de sombrearse', (await page.locator('rect.sched-nonwork[data-date="2026-08-07"]').count()) === 0);
  await page.click('.tabs .tab:has-text("Calendario")');
  await page.click('label.check:has-text("Festivos de Colombia")');
  await page.click('.tabs .tab:has-text("Gantt")');

  /* dependencias circulares (datos importados): aviso */
  await page.waitForTimeout(900);
  await page.evaluate(async (pid) => { const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); const n = PM.clone(s); n.tasks[0].deps = [{ id: 'c', type: 'FS', lag: 0 }]; await PM.store.set(PM.paths.tool(pid, 'schedule'), n); }, pidB);
  await page.waitForTimeout(300);
  check('aviso de dependencias circulares con las filas', (await page.locator('.sched-banner').innerText().catch(() => '')).includes('Dependencias circulares'));
  await page.evaluate(async (pid) => { const s = await PM.store.get(PM.paths.tool(pid, 'schedule')); const n = PM.clone(s); n.tasks[0].deps = []; await PM.store.set(PM.paths.tool(pid, 'schedule'), n); }, pidB);
  await page.waitForTimeout(300);
  check('el aviso desaparece al quitar el ciclo', (await page.locator('.sched-banner').count()) === 0);

  /* diagrama de red: zoom, días/fechas y descarga */
  await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
  await gotoView(page, 'red');
  const netW = async () => +(await page.getAttribute('.sched-net svg', 'width'));
  const w0 = await netW();
  await page.click('button[aria-label="Acercar"]'); await page.waitForTimeout(100);
  check('zoom del diagrama de red', (await netW()) > w0, { w0, w1: await netW() });
  await page.click('button[aria-label="Restablecer zoom"]');
  check('nodo con IT | duración | TT e IL | holgura | TL', (await page.locator('g.sched-net-node[data-id="b"] text.sched-net-v').count()) === 6);
  await page.click('.btn-group button:has-text("Días")');
  check('modo días: el nodo inicial empieza en el día 0', (await page.locator('g.sched-net-node[data-id="a"] text.sched-net-v').first().textContent()) === '0');
  await page.click('button:has-text("Descargar SVG")');
  const dlB = await page.evaluate(() => window.__dl);
  check('descarga SVG del diagrama de red', dlB.length === 1 && dlB[0].name.endsWith('_diagrama-red.svg') && dlB[0].data.includes('Inicio'), dlB.map((d) => d.name));

  /* recursos: más de 8 recursos → «Otros», histograma mensual, solo lectura */
  await page.waitForTimeout(900);
  await page.evaluate(async (pid) => {
    const s = PM.clone(await PM.store.get(PM.paths.tool(pid, 'schedule')));
    const names = ['Cuadrilla de montaje', 'Camión grúa', 'Ingeniero de diseño', 'Topógrafo', 'Coordinador SST', 'Almacén', 'Conductor', 'Soldador', 'Electricista', 'Ayudante'];
    let j = 0; s.tasks.forEach((t) => { if (!t.milestone) { t.resources = names.slice(j * 3, j * 3 + 4).map((n, k) => ({ name: n, units: k + 1 })); j++; } });
    await PM.store.set(PM.paths.tool(pid, 'schedule'), s);
  }, pidB);
  await gotoView(page, 'recursos');
  const legendTxt = await page.locator('.card .legend').first().innerText();
  check('más de 8 recursos: los demás se agrupan en «Otros»', legendTxt.includes('Otros (2)'), legendTxt);
  await page.click('.btn-group button:has-text("Mes")'); await page.waitForTimeout(150);
  check('histograma por mes', (await page.locator('.sched-hist svg text').allTextContents()).some((x) => x === 'ago 26'));
  check('matriz de asignación: actividades × recursos', (await page.locator('.sched-matrix thead th.u').count()) === 10 && (await page.locator('.sched-matrix tbody tr').count()) === 3);
  await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
  check('recursos en solo lectura: sin campos de disponibilidad', (await page.locator('input[aria-label^="Disponibilidad"]').count()) === 0);
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Calendario")');
  check('calendario en solo lectura: sin controles de edición', (await page.locator('button:has-text("Agregar día no laborable")').count()) === 0 && (await page.locator('button:has-text("Lunes a sábado")').count()) === 0 && (await page.locator('button.sched-day').count()) === 0);
  await page.click('.tabs .tab:has-text("Gantt")'); await page.waitForTimeout(150);
  await page.evaluate(() => { const f = document.querySelector('.sched-frame'); const r = document.querySelector('g.sched-bar[data-id="b"] .sched-bar-main'); f.scrollLeft = Math.max(0, +r.getAttribute('x') - 60); });
  const bb = await page.locator('g.sched-bar[data-id="b"] .sched-bar-main').boundingBox();
  await page.mouse.move(bb.x + 4, bb.y + 4); await page.mouse.down(); await page.mouse.move(bb.x + 4, bb.y + 260, { steps: 3 }); await page.mouse.up();
  await page.mouse.move(bb.x + 6, bb.y + 5); await page.mouse.move(bb.x + 8, bb.y + 6); await page.waitForTimeout(150);
  check('solo lectura: el tooltip sigue funcionando tras soltar fuera de la barra', (await page.locator('.chart-tip').count()) === 1);
  await page.evaluate(() => PM.setState({ canWrite: true }));
  await page.mouse.move(5, 5);

  /* estados vacíos */
  await createProject(page, { name: 'Proyecto vacío', code: 'PRY-V', start: '2026-08-03' });
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Actividades")');
  check('Actividades vacía con acción «Agregar actividad»', await page.locator('.empty button:has-text("Agregar actividad")').isVisible());
  await gotoView(page, 'recursos');
  check('Recursos vacío explica cómo asignar recursos', (await page.locator('.empty').innerText()).includes('Recursos'));
  await gotoView(page, 'red');
  check('Diagrama de red vacío', (await page.locator('.empty-title').innerText()).includes('Aún no hay actividades'));
  await page.evaluate(() => PM.setState({ canWrite: false }));
  await gotoView(page, 'cronograma');
  await page.click('.tabs .tab:has-text("Gantt")');
  check('Gantt vacío en solo lectura: sin botones y con texto adecuado', (await page.locator('.empty button').count()) === 0 && (await page.locator('.empty').innerText()).includes('permiso de edición'));
  await page.evaluate(() => PM.setState({ canWrite: true }));

  /* ================= Bloque C (regresiones de la auditoría) ================= */
  await page.evaluate(() => { PM.prefs.set('sched.group', false); PM.prefs.set('sched.tab', 'calendario'); PM.prefs.set('sched.zoom', 'semana'); PM.prefs.set('sched.cols', 'auto'); PM.prefs.set('red.zoom', 1); PM.prefs.set('red.mode', 'dias'); });
  const pidC = await createProject(page, { name: 'Proyecto C', code: 'PRY-C', start: '2026-08-03', statusDate: '2026-10-02' });
  await page.evaluate(async (pid) => {
    const T = (id, name, duration, deps, extra = {}) => ({ id, name, wbsId: null, duration, milestone: duration === 0, start: null, deps, progress: 0, cost: 1000000, resources: [], responsible: '', actualStart: null, actualFinish: null, notes: '', ...extra });
    const tasks = [];
    for (let i = 1; i <= 15; i++) tasks.push(T('x' + i, 'Paralela ' + i, 2, [], { progress: 100 }));
    for (let i = 1; i <= 12; i++) tasks.push(T('a' + i, 'Terminada ' + i, 3, i > 1 ? [{ id: 'a' + (i - 1), type: 'FS', lag: 0 }] : [], { progress: 100 }));
    for (let i = 1; i <= 6; i++) tasks.push(T('p' + i, 'Pendiente ' + i, 5, [{ id: i > 1 ? 'p' + (i - 1) : 'a12', type: 'FS', lag: 0 }]));
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks });
  }, pidC);
  await page.waitForTimeout(300);

  /* «Ver en el cronograma» (params.taskId): abre el Gantt aunque la última pestaña fuera Calendario, selecciona la actividad y la muestra */
  await page.evaluate(() => PM.navigate('cronograma', { taskId: 'p6' }));
  await page.waitForSelector('.sched-row[data-id="p6"]');
  await page.waitForTimeout(250);
  const focusInfo = await page.evaluate(() => {
    const f = document.querySelector('.sched-frame'); const fr = f.getBoundingClientRect(); const gw = document.querySelector('.sched-grid').getBoundingClientRect().width;
    const row = document.querySelector('.sched-row[data-id="p6"]').getBoundingClientRect();
    const bar = document.querySelector('g.sched-bar[data-id="p6"] .sched-bar-main').getBoundingClientRect();
    return { tab: document.querySelector('.tabs [aria-selected="true"]')?.textContent.trim(), sel: document.querySelector('.sched-row[data-id="p6"]').classList.contains('is-sel'),
      rowVisible: row.top >= fr.top + 57 && row.bottom <= fr.bottom + 1 && row.top >= 0 && row.bottom <= innerHeight, scrolledDown: f.scrollTop > 0,
      barVisible: bar.left >= fr.left + gw - 1 && bar.left < fr.right - 10 };
  });
  check('«Ver en el cronograma»: pestaña Gantt, actividad seleccionada y a la vista (fila y barra)', focusInfo.tab && focusInfo.tab.startsWith('Gantt') && focusInfo.sel && focusInfo.rowVisible && focusInfo.scrolledDown && focusInfo.barVisible, focusInfo);
  await page.evaluate(() => { PM.prefs.set('sched.tab', 'actividades'); PM.navigate('tablero'); });
  await page.waitForTimeout(200);
  await page.evaluate(() => PM.navigate('cronograma', { taskId: 'p6' }));
  await page.waitForSelector('.sched-tbl tr[data-id="p6"]');
  await page.waitForTimeout(250);
  const focusAct = await page.evaluate(() => { const tr = document.querySelector('.sched-tbl tr[data-id="p6"]'); const b = tr.getBoundingClientRect(); return { sel: tr.classList.contains('is-sel'), vis: b.top >= 0 && b.bottom <= innerHeight, tab: document.querySelector('.tabs [aria-selected="true"]')?.textContent.trim() }; });
  check('«Ver en el cronograma» desde Actividades: la fila queda seleccionada y a la vista', focusAct.tab.startsWith('Actividades') && focusAct.sel && focusAct.vis, focusAct);
  await page.evaluate(() => PM.navigate('cronograma', { taskId: 'no-existe' }));
  await page.waitForTimeout(250);
  check('«Ver en el cronograma» con una actividad eliminada: aviso', (await page.locator('.toast').allInnerTexts()).some((x) => x.includes('ya no está en el cronograma')));
  await page.evaluate(() => { PM.prefs.set('sched.tab', 'gantt'); PM.navigate('tablero'); });
  await page.waitForTimeout(200);

  /* Gantt: abre con la fecha de corte a la vista (no en el inicio del proyecto) y su rótulo completo */
  await gotoView(page, 'cronograma');
  await page.waitForSelector('.sched-row[data-id="p1"]');
  await page.waitForTimeout(200);
  const corte = await page.evaluate(() => {
    const f = document.querySelector('.sched-frame'); const fr = f.getBoundingClientRect(); const gr = document.querySelector('.sched-grid').getBoundingClientRect();
    const lbl = [...document.querySelectorAll('.sched-headrow text.sched-mark')].find((t) => t.textContent.startsWith('Corte')); const lb = lbl.getBoundingClientRect();
    return { left: gr.right, right: fr.right, lblL: lb.left, lblR: lb.right, scrollLeft: f.scrollLeft };
  });
  check('Gantt abre con la línea de corte y su rótulo dentro del área visible', corte.lblL >= corte.left && corte.lblR <= corte.right && corte.scrollLeft > 0, corte);

  /* edición en la tabla: Enter y Esc devuelven el foco a la celda (no a <body>) */
  await page.locator('.sched-row[data-id="p2"] [data-col="dur"] button.sched-cell').click();
  await page.keyboard.press('Control+a'); await page.keyboard.type('6'); await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const aeEnter = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.tagName));
  await page.keyboard.press('Enter'); await page.waitForTimeout(50);
  const reopened = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const aeEsc = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.tagName));
  check('Enter y Esc en una celda devuelven el foco al botón de la celda', /^Duración en días hábiles, fila 29: 6 d/.test(aeEnter) && reopened === 'INPUT' && /^Duración en días hábiles, fila 29/.test(aeEsc), { aeEnter, reopened, aeEsc });

  /* iniciales de los días en es-CO (sin «X») y criterio de criticidad explicado */
  await page.click('.btn-group button:has-text("Día")'); await page.waitForTimeout(150);
  const dayHead = await page.$$eval('.sched-headrow svg text', (els) => els.map((e) => e.textContent));
  check('escala diaria: sin la inicial «X» de España', !dayHead.some((x) => /^X\b/.test(x)), dayHead.filter((x) => /^[A-Z]\b/.test(x)).slice(0, 8));
  await page.click('.btn-group button:has-text("Semana")'); await page.waitForTimeout(150);
  const critStat = await page.locator('.sched-strip .stat', { hasText: 'Críticas' }).innerText();
  check('resumen: «Críticas» aclara que son las sin terminar', critStat.includes('sin terminar') && !critStat.includes('holgura ≤ 0'), critStat);
  await page.click('.tabs .tab:has-text("Calendario")');
  const dh = await page.$$eval('.sched-mgrid', (g) => [...g[0].querySelectorAll('.dh')].map((e) => e.textContent).join(' '));
  check('calendario mensual: encabezados L M M J V S D', dh === 'L M M J V S D', dh);
  await page.click('.tabs .tab:has-text("Gantt")');

  /* diagrama de red: abre con la ruta crítica pendiente a la vista; «Ajustar a la vista» y zoom mínimo 25 % */
  await gotoView(page, 'red');
  await page.waitForSelector('g.sched-net-node');
  await page.waitForTimeout(200);
  const netOpen = await page.evaluate(() => {
    const host = document.querySelector('.sched-net'); const a = host.getBoundingClientRect();
    const full = [...host.querySelectorAll('g.sched-net-node.is-crit')].filter((n) => { const b = n.getBoundingClientRect(); return b.left >= a.left - 1 && b.right <= a.right + 1 && b.top >= a.top - 1 && b.bottom <= a.bottom + 1; }).map((n) => n.getAttribute('data-id'));
    return { full, scrollLeft: host.scrollLeft, scrollTop: host.scrollTop, svgW: +host.querySelector('svg').getAttribute('width'), hostW: host.clientWidth };
  });
  check('diagrama de red abre con la primera actividad crítica pendiente a la vista', netOpen.full.includes('p1') && netOpen.scrollLeft > 0 && netOpen.svgW > netOpen.hostW, netOpen);
  await page.click('button:has-text("Ajustar a la vista")'); await page.waitForTimeout(150);
  const netFit = await page.evaluate(() => { const host = document.querySelector('.sched-net'); return { svgW: +host.querySelector('svg').getAttribute('width'), hostW: host.clientWidth, pressed: [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ajustar a la vista')).getAttribute('aria-pressed'), ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  check('«Ajustar a la vista»: todo el diagrama cabe en el ancho del recuadro', netFit.svgW <= netFit.hostW + 1 && netFit.pressed === 'true' && netFit.ov <= 1, netFit);
  await page.click('button[aria-label="Restablecer zoom"]');
  for (let i = 0; i < 4; i++) { const al = page.locator('button[aria-label="Alejar"]'); if (await al.isEnabled()) await al.click(); }
  check('zoom mínimo del diagrama de red: 25 %', (await page.locator('button[aria-label="Restablecer zoom"]').innerText()).trim() === '25 %' && await page.locator('button[aria-label="Alejar"]').isDisabled(), await page.locator('button[aria-label="Restablecer zoom"]').innerText());
  await page.click('button[aria-label="Restablecer zoom"]');
  const keyTxt = await page.locator('.sched-key').innerText();
  const redHeads = await page.$$eval('.sched-tbl thead th', (ths) => ths.map((t) => t.textContent.trim() + '|' + (t.title || '')).join(' '));
  check('clave del nodo y tabla con nombres completos (sin IL/TL ni «Terminación»)', ['Inicio temprano', 'Fin temprano', 'Inicio tardío', 'Fin tardío'].every((k) => keyTxt.includes(k) && redHeads.includes(k)) && !/\b(IT|TT|IL|TL)\b/.test(keyTxt + redHeads) && !redHeads.includes('Terminación'), { keyTxt, redHeads });
  const hdrTxt = await page.locator('.page').first().innerText();
  const doneRow = await page.locator('.sched-tbl tbody tr[data-id="a12"] td').last().innerText();
  check('ruta crítica: el texto aclara que las terminadas no se marcan y la tabla lo indica', hdrTxt.includes('actividades pendientes con holgura total ≤ 0') && doneRow.trim() === 'No (terminada)', doneRow);
  await page.evaluate(() => PM.prefs.set('red.zoom', 1));
  void pidC;

  /* ================= Bloque D: pronóstico al corte (red actualizada a la fecha de corte, 6.6) ================= */
  await page.evaluate(() => { PM.prefs.set('sched.group', false); PM.prefs.set('sched.tab', 'gantt'); PM.prefs.set('sched.zoom', 'semana'); PM.prefs.set('sched.cols', 'auto'); PM.prefs.set('sched.base', true); });
  const pidD = await createProject(page, { name: 'Proyecto D', code: 'PRY-D', start: '2026-08-03', statusDate: '2026-09-15' });
  await page.evaluate(async (pid) => {
    const T = (id, name, duration, deps, extra = {}) => ({ id, name, wbsId: null, duration, milestone: duration === 0, start: null, deps, progress: 0, cost: 1000000, resources: [], responsible: '', actualStart: null, actualFinish: null, notes: '', ...extra });
    const fs = (id) => [{ id, type: 'FS', lag: 0 }];
    await PM.store.set(PM.paths.tool(pid, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks: [
      T('a', 'Diseño del andamio', 10, [], { progress: 100 }),
      T('b', 'Alistamiento en bodega', 10, fs('a'), { progress: 40 }),
      T('m1', 'Equipo listo para despacho', 0, fs('b')),
      T('c', 'Montaje niveles 1 a 5', 8, fs('m1')),
      T('m2', 'Andamio certificado', 0, fs('c')),
      T('e', 'Mantenimiento programado', 3, [], { start: '2026-09-21' }),
    ] });
  }, pidD);
  await gotoView(page, 'cronograma');
  await page.waitForSelector('.sched-row[data-id="m2"]');
  await page.waitForTimeout(250);
  const storedD = () => page.evaluate(async (pid) => JSON.stringify(await PM.store.get(PM.paths.tool(pid, 'schedule'))), pidD);
  const expD = () => page.evaluate(async (pid) => {
    const project = await PM.store.get(PM.paths.project(pid));
    const schedule = await PM.store.get(PM.paths.tool(pid, 'schedule'));
    const bls = await PM.store.list(PM.paths.baselines(pid));
    const bl = bls.length ? bls[0].data : null;
    const sched = PM.calc.computeSchedule(schedule, project.start);
    const fc = PM.calc.computeSchedule(schedule, project.start, project.statusDate);
    const moved = sched.tasks.filter((t) => t.progress < 100 && (fc.byId.get(t.id).startDate !== t.startDate || fc.byId.get(t.id).finishDate !== t.finishDate)).map((t) => t.id);
    const ref = bl ? bl.schedule.finish : sched.finish;
    const v = sched.cal.indexOf(fc.finish) - sched.cal.indexOf(ref);
    const vs = bl ? 'frente a ' + bl.label : 'frente al fin planificado';
    const phrase = v === 0 ? 'sin variación ' + vs : Math.abs(v) + (Math.abs(v) === 1 ? ' día hábil' : ' días hábiles') + (v > 0 ? ' de atraso ' : ' de adelanto ') + vs;
    const fcDates = Object.fromEntries(sched.tasks.map((t) => [t.id, { plan: t.startDate, planFin: t.finishDate, f: fc.byId.get(t.id).startDate, ff: fc.byId.get(t.id).finishDate, blStart: bl ? (bl.schedule.tasks.find((x) => x.id === t.id) || {}).start : null }]));
    return { sd: project.statusDate, planFinish: PM.fmt.date(sched.finish), fcFinish: PM.fmt.date(fc.finish), fcFinishIso: fc.finish, planFinishIso: sched.finish, phrase, moved, fcDates };
  }, pidD);
  let eD = await expD();
  const stripText = async (id) => (await page.locator(`.sched-strip [data-stat="${id}"]`).innerText()).split('\n').map((x) => x.trim()).filter(Boolean);
  let fcStat = await stripText('forecast');
  check('pronóstico: hay trabajo pendiente desplazado (b en curso, m1, c y m2; no la terminada ni la que empieza después del corte)', JSON.stringify(eD.moved) === '["b","m1","c","m2"]' && eD.fcFinishIso > eD.planFinishIso, eD.moved);
  check('resumen: «Fin» sigue siendo el planificado', (await stripText('finish'))[1] === eD.planFinish, await stripText('finish'));
  check('resumen: «Fin pronosticado al corte» = fin de la red actualizada, con su variación en días hábiles frente al fin planificado (sin línea base)', fcStat[0] === 'Fin pronosticado al corte' && fcStat[1] === eD.fcFinish && fcStat[2] === eD.phrase && (await page.locator('.sched-strip [data-stat="forecast"] .stat-value').getAttribute('style')).includes('var(--crit)'), { fcStat, eD: [eD.fcFinish, eD.phrase] });
  const stripTops = await page.$$eval('.sched-strip > .stat', (els) => [...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top)))]);
  check('resumen: una sola fila a 1360 px', stripTops.length === 1, stripTops);
  /* conmutador «Pronóstico al corte»: activo por defecto cuando el corte desplaza trabajo pendiente */
  const fcToggle = page.locator('label.check:has-text("Pronóstico al corte") input');
  check('Gantt: «Pronóstico al corte» activo por defecto (corte posterior al inicio con trabajo pendiente desplazado)', (await fcToggle.isChecked()) && !(await fcToggle.isDisabled()));
  const ghosts = () => page.$$eval('g.sched-fc', (els) => els.map((e) => ({ id: e.getAttribute('data-id'), s: e.getAttribute('data-start'), f: e.getAttribute('data-finish') })));
  let gh = await ghosts();
  check('Gantt: una barra de pronóstico por actividad pendiente desplazada, con las fechas de la red actualizada', gh.length === eD.moved.length && gh.every((g) => eD.moved.includes(g.id) && g.s === eD.fcDates[g.id].f && g.f === eD.fcDates[g.id].ff), { gh, moved: eD.moved });
  const ghostGeo = await page.evaluate(() => {
    const svg = document.querySelector('svg.sched-body'); const origin = svg.getAttribute('data-origin'); const ppd = +svg.getAttribute('data-ppd');
    const g = document.querySelector('g.sched-fc[data-id="c"]'); const r = g.querySelector('rect');
    return { x: +r.getAttribute('x'), exp: PM.date.diff(origin, g.getAttribute('data-start')) * ppd, fill: r.getAttribute('fill'), stroke: r.getAttribute('stroke'), dash: r.getAttribute('stroke-dasharray'), ms: !!document.querySelector('g.sched-fc[data-id="m2"] path') };
  });
  check('Gantt: la barra del pronóstico empieza en la fecha pronosticada, con trama y contorno discontinuo en --signal (rombo para hitos)', Math.abs(ghostGeo.x - ghostGeo.exp) < 0.01 && /^url\(#/.test(ghostGeo.fill) && ghostGeo.stroke === 'var(--signal)' && !!ghostGeo.dash && ghostGeo.ms, ghostGeo);
  const gdD = await page.$$eval('.sched-row[data-id] [data-col="finish"]', (els) => els.map((e) => e.innerText.trim()));
  check('Gantt: las fechas de la tabla siguen siendo las planificadas', gdD.length === 6 && gdD[1] === fd(eD.fcDates.b.planFin) && gdD[3] === fd(eD.fcDates.c.planFin), gdD);
  check('Gantt: leyenda y nota del pronóstico al corte', (await page.locator('.sched-legend [data-legend="forecast"]').innerText()).includes('Pronóstico al corte') && (await page.locator('[data-fc-note]').innerText()).includes('4 actividades pendientes cambian de fecha'));
  /* línea de la fecha de corte: trazo --signal y rótulo --signal-ink */
  const statusLine = await page.evaluate(() => {
    const t = [...document.querySelectorAll('.sched-headrow text.sched-mark')].find((x) => x.textContent.startsWith('Corte'));
    const line = t && t.parentNode.querySelector('line');
    const probe = document.createElement('span'); probe.style.color = 'var(--signal-ink)'; document.body.appendChild(probe); const ink = getComputedStyle(probe).color; probe.remove();
    return { label: t && t.textContent, stroke: line && line.getAttribute('stroke'), fill: t && getComputedStyle(t).fill, ink };
  });
  check('línea de corte: trazo en --signal y rótulo en --signal-ink', String(statusLine.label || '').startsWith('Corte 15') && statusLine.stroke === 'var(--signal)' && !!statusLine.ink && statusLine.fill === statusLine.ink, statusLine);
  /* tooltip de una actividad desplazada */
  await page.evaluate(() => { const f = document.querySelector('.sched-frame'); const r = document.querySelector('g.sched-bar[data-id="c"] .sched-bar-main'); f.scrollLeft = Math.max(0, +r.getAttribute('x') - 60); });
  await page.waitForTimeout(100);
  await page.hover('g.sched-bar[data-id="c"] .sched-bar-main');
  await page.waitForTimeout(150);
  const tipD = await page.locator('.chart-tip').innerText().catch(() => '');
  check('tooltip: muestra el pronóstico al corte de una actividad desplazada', tipD.includes('Pronóstico al corte') && tipD.includes('Inicio – fin'), tipD);
  await page.mouse.move(5, 5);
  /* ocultar y volver a mostrar: no toca los datos guardados; la elección se recuerda por proyecto */
  const before = await storedD();
  await page.click('label.check:has-text("Pronóstico al corte")');
  await page.waitForTimeout(150);
  check('ocultar el pronóstico al corte: sin barras ni leyenda', (await page.locator('g.sched-fc').count()) === 0 && (await page.locator('.sched-legend [data-legend="forecast"]').count()) === 0 && (await page.evaluate((pid) => PM.prefs.get('sched.fcHide.' + pid), pidD)) === true);
  await page.click('label.check:has-text("Pronóstico al corte")');
  await page.waitForTimeout(950);
  check('mostrar de nuevo el pronóstico; el cronograma guardado no cambia', (await page.locator('g.sched-fc').count()) === eD.moved.length && (await storedD()) === before);
  /* descarga SVG con el pronóstico */
  await page.evaluate(() => { window.__dl = []; PM.download = async (name, data) => { window.__dl.push({ name, data }); return true; }; });
  await page.click('button:has-text("Descargar SVG")');
  const dlD = await page.evaluate(() => window.__dl);
  check('SVG del Gantt con el pronóstico al corte (barras con trama y nota al pie)', dlD.length === 1 && (dlD[0].data.match(/data-start=/g) || []).length === eD.moved.length && dlD[0].data.includes('<pattern') && dlD[0].data.includes('pronóstico al corte con trama'), dlD.map((d) => d.name));
  /* hitos: columna «Pronóstico al corte» con variación; «Vencido» sigue el plan */
  await page.click('.tabs .tab:has-text("Hitos")');
  await page.waitForTimeout(150);
  const msD = await page.$$eval('.sched-tbl tbody tr', (trs) => trs.map((tr) => { const c = tr.querySelector('[data-col="forecast"]'); return { id: tr.getAttribute('data-id'), state: tr.lastElementChild.previousElementSibling.innerText.trim(), date: c && c.getAttribute('data-date'), v: c && +c.getAttribute('data-var'), txt: c && c.innerText.trim() }; }));
  const wdv = (a, b) => page.evaluate(({ a, b }) => { const cal = PM.cal.make({ workweek: 5, holidaysCO: true }, '2026-08-03'); return cal.indexOf(a) - cal.indexOf(b); }, { a, b });
  const m1 = msD.find((x) => x.id === 'm1');
  check('hitos: columna «Pronóstico al corte» con la fecha de la red actualizada', (await page.locator('.sched-tbl thead th:has-text("Pronóstico al corte")').count()) === 1 && msD.length === 2 && msD.every((x) => x.date === eD.fcDates[x.id].f), msD);
  check('hitos: «Vencido» según la fecha planificada aunque el pronóstico quede después del corte', m1.state === 'Vencido' && eD.fcDates.m1.plan < eD.sd && m1.date > eD.sd, { m1, sd: eD.sd });
  check('hitos: variación del pronóstico en días hábiles frente a la fecha planificada (sin línea base)', m1.v === (await wdv(eD.fcDates.m1.f, eD.fcDates.m1.plan)) && m1.v > 0 && m1.txt.includes('+' + m1.v + ' d'), m1);
  check('hitos: chip con los hitos desplazados al corte', (await page.locator('.chip:has-text("desplazados al corte")').innerText()).trim() === '2 desplazados al corte');
  if (shots) await shot('pronostico-hitos');
  /* con línea base: la variación se mide frente a LB0 (fin y fechas de hitos) */
  await page.evaluate(async (pid) => {
    const project = await PM.store.get(PM.paths.project(pid));
    const s = await PM.store.get(PM.paths.tool(pid, 'schedule'));
    const snap = PM.calc.makeBaselineSnapshot({ includes: ['schedule'], sched: PM.calc.computeSchedule(s, project.start) });
    await PM.store.set(PM.paths.baseline(pid, 'lb0'), { number: 0, label: 'LB0', date: '2026-08-01', includes: ['schedule'], note: '', changeRef: '', byId: null, ...snap });
  }, pidD);
  await page.waitForTimeout(400);
  eD = await expD();
  const m1b = await page.$eval('.sched-tbl tbody tr[data-id="m1"] [data-col="forecast"]', (c) => +c.getAttribute('data-var'));
  check('hitos con LB0: variación del pronóstico frente a la fecha de LB0', m1b === (await wdv(eD.fcDates.m1.f, eD.fcDates.m1.blStart)), { m1b, d: eD.fcDates.m1 });
  await page.click('.tabs .tab:has-text("Gantt")');
  await page.waitForTimeout(150);
  fcStat = await stripText('forecast');
  const blStat = await stripText('baseline');
  check('resumen con LB0: variación del fin pronosticado «frente a LB0» y el fin de LB0 con la variación de lo planificado', fcStat[2] === eD.phrase && eD.phrase.endsWith('frente a LB0') && blStat[0] === 'Fin LB0' && blStat[2] === 'planificado 0 d', { fcStat, blStat, phrase: eD.phrase });
  if (shots) await shot('pronostico-gantt');
  /* solo lectura: el pronóstico es una vista, sigue disponible sin controles de edición */
  await page.evaluate(() => PM.setState({ canWrite: false })); await page.waitForTimeout(150);
  check('solo lectura: el pronóstico al corte se dibuja y se puede conmutar, sin controles de edición', (await page.locator('g.sched-fc').count()) === eD.moved.length && !(await fcToggle.isDisabled()) && (await page.locator('button:has-text("Agregar actividad")').count()) === 0 && (await page.locator('.sched-handle').count()) === 0);
  await page.evaluate(() => PM.setState({ canWrite: true }));
  /* 400 px y tema oscuro con el pronóstico */
  await page.setViewportSize({ width: 400, height: 860 });
  for (const tab of ['Gantt', 'Hitos']) {
    await page.click(`.tabs .tab:has-text("${tab}")`); await page.waitForTimeout(200);
    const ov = await horizontalOverflow(page);
    check(`400 px sin desborde con el pronóstico: ${tab}`, ov <= 1, ov);
  }
  await page.click('.tabs .tab:has-text("Gantt")');
  const fcBox = await page.locator('.sched-strip [data-stat="forecast"]').boundingBox();
  const stripBox = await page.locator('.sched-strip').boundingBox();
  check('400 px: «Fin pronosticado al corte» legible dentro del resumen', fcBox.width >= 200 && fcBox.x + fcBox.width <= stripBox.x + stripBox.width + 1 && !(await page.$eval('.sched-strip [data-stat="forecast"] .stat-label', (e) => e.scrollWidth > e.clientWidth + 1)), { fcBox, stripBox });
  if (shots) await shot('pronostico-400');
  await page.setViewportSize({ width: 1360, height: 900 });
  if (shots) { await page.emulateMedia({ colorScheme: 'dark' }); await shot('pronostico-dark'); await page.emulateMedia({ colorScheme: 'light' }); }
  /* corte anterior al inicio: la red actualizada coincide con lo planificado → conmutador desactivado y sin barras */
  await page.evaluate((pid) => PM.projectOps.update(pid, { statusDate: '2026-07-31' }), pidD);
  await page.waitForTimeout(350);
  eD = await expD();
  fcStat = await stripText('forecast');
  check('corte anterior al inicio: conmutador desactivado, sin barras de pronóstico y fin pronosticado = planificado', (await fcToggle.isDisabled()) && !(await fcToggle.isChecked()) && (await page.locator('g.sched-fc').count()) === 0 && eD.moved.length === 0 && fcStat[1] === eD.planFinish && fcStat[2] === 'sin variación frente a LB0', { fcStat, moved: eD.moved });
  void pidD;

  /* 300 actividades: respuesta y números de fila legibles */
  const pidBig = await page.evaluate(async () => {
    const id = await PM.projectOps.create({ name: 'Proyecto grande', code: 'PRY-G', start: '2026-01-05' });
    const tasks = []; for (let i = 0; i < 300; i++) tasks.push({ id: 't' + i, name: 'Actividad ' + (i + 1), wbsId: null, duration: 1 + (i % 9), milestone: false, start: null, deps: i ? [{ id: 't' + (i - 1), type: i % 3 === 0 ? 'SS' : 'FS', lag: i % 3 === 0 ? 1 : 0 }] : [], progress: i % 100, cost: 1e6, resources: [{ name: 'Cuadrilla ' + (i % 5), units: 2 }], responsible: '', actualStart: null, actualFinish: null, notes: '' });
    await PM.store.set(PM.paths.tool(id, 'schedule'), { settings: { workweek: 5, holidaysCO: true, extraHolidays: [] }, tasks });
    PM.selectProject(id, 'portafolio'); return id;
  });
  await page.waitForTimeout(300);
  let tb = Date.now(); await page.evaluate(() => PM.navigate('cronograma')); await page.waitForSelector('.sched-row[data-id="t299"]'); const tGantt = Date.now() - tb;
  check('300 actividades: el Gantt se dibuja en menos de 1,5 s', tGantt < 1500, tGantt);
  const clipped = await page.$$eval('.sched-row .sched-n', (els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  check('números de fila de 3 cifras no se recortan', clipped.length === 0, clipped.slice(0, 5));
  await page.locator('.sched-row[data-id="t5"] [data-col="dur"] button.sched-cell').click();
  await page.locator('.sched-row[data-id="t5"] [data-col="dur"] input').fill('4');
  tb = Date.now(); await page.locator('.sched-row[data-id="t5"] [data-col="dur"] input').press('Enter'); await page.waitForSelector('.sched-row[data-id="t5"] [data-col="dur"] button.sched-cell'); const tEdit = Date.now() - tb;
  check('300 actividades: editar una duración responde en menos de 0,8 s', tEdit < 800, tEdit);
  tb = Date.now(); await page.evaluate(() => PM.navigate('red')); await page.waitForSelector('g.sched-net-node'); const tNet = Date.now() - tb;
  check('300 actividades: diagrama de red en menos de 2 s', tNet < 2000, tNet);
  const startVisible = await page.evaluate(() => { const host = document.querySelector('.sched-net'); const n = document.querySelector('g.sched-net-end'); const a = host.getBoundingClientRect(), b = n.getBoundingClientRect(); return b.top >= a.top - 1 && b.bottom <= a.bottom + 1 && b.left >= a.left - 1; });
  check('diagrama de red grande: abre mostrando el nodo Inicio', startVisible);
  tb = Date.now(); await page.evaluate(() => PM.navigate('recursos')); await page.waitForSelector('.sched-reslist'); const tRes = Date.now() - tb;
  check('300 actividades: recursos en menos de 1,5 s', tRes < 1500, tRes);
  void pidBig;
  const cards2 = await errorCards(page);
  check('sin tarjetas de error (bloque B)', cards2.length === 0, cards2);
} catch (e) {
  check('excepción', false, String(e && e.stack || e));
} finally {
  check('sin errores de consola', errors.length === 0, errors);
  await browser.close();
}
const fails = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} correctas`);
process.exit(fails ? 1 : 0);

// Pruebas de interacción del módulo 70-matrices (RACI, probabilidad e impacto, interesados, calidad).
// Uso: node test/matrices.test.mjs --file <ruta.html> [--shots dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, gotoView, errorCards, horizontalOverflow } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const results = [];
async function step(name, fn) {
  try { await fn(); results.push('OK   ' + name); console.log('OK   ' + name); }
  catch (e) { failures++; results.push('FAIL ' + name); console.log('FAIL ' + name + '\n     ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n     ')); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg + ' — esperado ' + JSON.stringify(b) + ', obtenido ' + JSON.stringify(a)); };

/* ------------------------------------------------------------------ datos de prueba */
const WBS = [
  { id: 'w1', parentId: null, name: 'Gestión del proyecto', order: 1 },
  { id: 'w11', parentId: 'w1', name: 'Plan para la dirección del proyecto', order: 1 },
  { id: 'w2', parentId: null, name: 'Ingeniería', order: 2 },
  { id: 'w21', parentId: 'w2', name: 'Levantamiento en obra', order: 1 },
  { id: 'w22', parentId: 'w2', name: 'Diseño y memoria de cálculo del andamio', order: 2 },
  { id: 'w3', parentId: null, name: 'Suministro y logística', order: 3 },
  { id: 'w31', parentId: 'w3', name: 'Alistamiento e inspección en bodega', order: 1 },
  { id: 'w32', parentId: 'w3', name: 'Transporte a obra', order: 2 },
  { id: 'w4', parentId: null, name: 'Montaje', order: 4 },
];
const r = (id, descripcion, categoria, tipo, p, i, estrategia, propietario, reserva, estado) => ({ id, descripcion, causa: '', efecto: '', categoria, tipo, probabilidad: p, impacto: i, propietario, estrategia, respuesta: '', disparador: '', reserva, estado });
const RISKS = [
  r('R-001', 'Lluvias que detienen el montaje en altura', 'Externo', 'Amenaza', 4, 3, 'Mitigar', 'Residente de obra', 4500000, 'Abierto'),
  r('R-002', 'Accidente en trabajo en alturas', 'Técnico', 'Amenaza', 2, 5, 'Mitigar', 'Coordinador SST (HSE)', 6000000, 'En seguimiento'),
  r('R-003', 'Faltantes de piezas en bodega', 'De la organización', 'Amenaza', 3, 3, 'Mitigar', 'Coordinador logístico', 2800000, 'Abierto'),
  r('R-004', 'Cambios del cliente en la secuencia de obra', 'Externo', 'Amenaza', 4, 4, 'Aceptar', 'Director de proyecto', 3500000, 'Abierto'),
  r('R-005', 'Daño o pérdida de equipo en obra', 'Técnico', 'Amenaza', 3, 4, 'Transferir', 'Supervisor de montaje', 2000000, 'Abierto'),
  r('R-006', 'Retraso en pagos del cliente', 'Externo', 'Amenaza', 3, 3, 'Mitigar', 'Facturación y cartera', 0, 'Abierto'),
  r('R-007', 'Restricciones de circulación de carga en Bogotá', 'Externo', 'Amenaza', 4, 2, 'Evitar', 'Coordinador logístico', 900000, 'Cerrado'),
  r('R-008', 'Inspección de certificación no aprobada', 'Técnico', 'Amenaza', 2, 4, 'Mitigar', 'Ingeniero de diseño', 1500000, 'Abierto'),
  r('R-009', 'Disponibilidad de grúa del cliente', 'Externo', 'Amenaza', null, 3, '', 'Residente de obra', 0, 'Abierto'),
  r('R-010', 'Reutilizar piezas devueltas de la Torre 1', 'De la organización', 'Oportunidad', 3, 3, 'Explotar', 'Almacén', null, 'Abierto'),
  r('R-011', 'Ampliación del contrato a la Torre 3', 'Externo', 'Oportunidad', 2, 5, 'Mejorar', 'Director de proyecto', null, 'Abierto'),
  r('R-012', 'Rotación del personal de la cuadrilla', 'De la organización', 'Amenaza', 3, 3, 'Mitigar', 'Supervisor de montaje', 800000, 'Abierto'),
  r('R-013', 'Demora en la aprobación del diseño por la interventoría', 'Externo', 'Amenaza', 3, 3, 'Mitigar', 'Ingeniero de diseño', 1200000, 'Abierto'),
];
const s = (nombre, cargo, rol, clasificacion, poder, interes, influencia, nivelActual, nivelDeseado) => ({ id: 'st_' + nombre.slice(0, 6).replace(/\W/g, ''), nombre, cargo, organizacion: '', rol, contacto: '', requisitos: '', expectativas: '', poder, interes, influencia, clasificacion, actitud: '', nivelActual, nivelDeseado });
const STAKE = [
  s('Gerencia General', 'Gerente general', 'Patrocinador', 'Interno', 5, 4, 5, 'Partidario', 'Líder'),
  s('Director de proyecto', 'Director de proyecto', 'Director de proyecto', 'Interno', 4, 5, 4, 'Líder', 'Líder'),
  s('Director de obra del cliente', 'Director de obra', 'Director de obra del cliente', 'Externo', 5, 5, 5, 'Neutral', 'Partidario'),
  s('Interventoría del cliente', 'Interventor', 'Interventoría del cliente', 'Externo', 4, 3, 4, 'Reticente', 'Partidario'),
  s('Coordinador SST', 'Coordinador SST (HSE)', 'Coordinador SST (HSE)', 'Interno', 3, 4, 3, 'Partidario', 'Partidario'),
  s('Cuadrilla de montaje', 'Montadores certificados', 'Cuadrilla de montaje', 'Interno', 2, 4, 2, 'Neutral', 'Partidario'),
  s('Almacén', 'Jefe de almacén', 'Almacén', 'Interno', 2, 4, 2, 'Neutral', 'Neutral'),
  s('ARL', 'Asesor de riesgos laborales', 'ARL', 'Externo', 3, 2, 3, 'Desconocedor', 'Neutral'),
  s('Vecinos del edificio', '', '', 'Externo', 1, 2, 1, 'Desconocedor', 'Neutral'),
  s('Secretaría de Movilidad', '', '', 'Externo', 4, 1, 3, '', ''),
  s('Curaduría urbana', '', '', 'Externo', null, null, null, '', ''),
];
const MEDICIONES = [
  ...Array.from({ length: 5 }, (_, k) => ({ id: 'm' + k, fecha: '2026-09-0' + (k + 1), entregable: 'Montaje niveles 1–5', metrica: 'Apriete de abrazaderas', resultado: 'No cumple', conforme: 'No', causa: 'Abrazadera floja', accion: 'Reapretar' })),
  ...Array.from({ length: 3 }, (_, k) => ({ id: 'n' + k, fecha: '2026-09-1' + k, entregable: 'Montaje niveles 6–10', metrica: 'Estado de piezas', resultado: 'No cumple', conforme: 'No', causa: 'Pieza deformada', accion: 'Reemplazar' })),
  { id: 'o1', fecha: '2026-09-15', entregable: 'Montaje', metrica: 'Pasadores', resultado: 'No cumple', conforme: 'No', causa: 'Falta de pasador', accion: '' },
  { id: 'o2', fecha: '2026-09-16', entregable: 'Montaje', metrica: 'Pasadores', resultado: 'No cumple', conforme: 'No', causa: 'falta de pasador', accion: '' },
  { id: 'o3', fecha: '2026-09-17', entregable: 'Montaje', metrica: 'Nivelación', resultado: 'No cumple', conforme: 'No', causa: '', accion: '' },
  ...Array.from({ length: 4 }, (_, k) => ({ id: 'y' + k, fecha: '2026-09-2' + k, entregable: 'Montaje', metrica: 'Verticalidad', resultado: 'Cumple', conforme: 'Sí', causa: '', accion: '' })),
];
const CONTROL_VALUES = [50.2, 49.8, 50.1, 49.9, 50.3, 49.7, 50.0, 50.4, 50.6, 50.5, 50.7, 50.5, 50.8, 50.6, 49.6, 50.1, 49.9, 54.6, 50.0, 49.8, 50.2, 49.9];
const QUALITY_FULL = {
  ishikawa: [{ id: 'ish1', name: 'Retraso en el montaje de los niveles 6–10', effect: 'Montaje de los niveles 6–10 con 4 días de retraso', categories: [
    { id: 'c1', name: 'Mano de obra', causes: [{ id: 'k1', text: 'Rotación de montadores certificados', sub: [{ id: 'q1', text: 'Salarios por debajo del mercado' }, { id: 'q2', text: 'Turnos extendidos' }] }, { id: 'k2', text: 'Curva de aprendizaje del sistema multidireccional', sub: [] }] },
    { id: 'c2', name: 'Método', causes: [{ id: 'k3', text: 'Secuencia de montaje cambiada por el cliente', sub: [] }] },
    { id: 'c3', name: 'Maquinaria', causes: [{ id: 'k4', text: 'Grúa del cliente no disponible en la mañana', sub: [{ id: 'q3', text: 'Prioridad a vaciado de concreto' }] }] },
    { id: 'c4', name: 'Materiales', causes: [{ id: 'k5', text: 'Faltantes de rosetas y diagonales en el despacho', sub: [] }, { id: 'k6', text: 'Piezas deformadas devueltas por otra obra', sub: [] }] },
    { id: 'c5', name: 'Medición', causes: [] },
    { id: 'c6', name: 'Medio ambiente', causes: [{ id: 'k7', text: 'Lluvias en la tarde', sub: [{ id: 'q4', text: 'Temporada de lluvias de octubre' }] }] },
  ] }],
  pareto: [{ id: 'par1', name: 'No conformidades del montaje', source: 'manual', items: [
    { id: 'a', cause: 'Abrazaderas sin torque', count: 40 }, { id: 'b', cause: 'Rodapiés faltantes', count: 25 }, { id: 'c', cause: 'Barandas mal aseguradas', count: 15 },
    { id: 'd', cause: 'Plataformas sin traba', count: 10 }, { id: 'e', cause: 'Base sin nivelar', count: 6 }, { id: 'f', cause: 'Señalización incompleta', count: 4 }] }],
  control: [{ id: 'ctl1', name: 'Torque de apriete de abrazaderas', unit: 'N·m', target: 50, lsl: 45, usl: 54, points: CONTROL_VALUES.map((v, k) => ({ id: 'pt' + k, date: '2026-09-' + String(k + 1).padStart(2, '0'), value: v })) }],
};
const RACI_FULL = {
  roles: [{ id: 'ro1', name: 'Director de proyecto' }, { id: 'ro2', name: 'Ingeniero de diseño' }, { id: 'ro3', name: 'Residente de obra' }, { id: 'ro4', name: 'Coordinador logístico' }, { id: 'ro5', name: 'Coordinador SST (HSE)' }, { id: 'ro6', name: 'Interventoría del cliente' }],
  rows: [
    { id: 'x1', wbsId: 'w11', activity: 'Plan para la dirección del proyecto', cells: { ro1: 'RA', ro2: 'C', ro3: 'C', ro5: 'C', ro6: 'I' } },
    { id: 'x2', wbsId: 'w21', activity: 'Levantamiento en obra', cells: { ro1: 'A', ro2: 'R', ro3: 'R', ro6: 'I' } },
    { id: 'x3', wbsId: 'w22', activity: 'Diseño y memoria de cálculo del andamio', cells: { ro1: 'A', ro2: 'R', ro5: 'C', ro6: 'C' } },
    { id: 'x4', wbsId: 'w31', activity: 'Alistamiento e inspección en bodega', cells: { ro1: 'I', ro4: 'R' } },
    { id: 'x5', wbsId: 'w32', activity: 'Transporte a obra', cells: { ro1: 'A', ro3: 'A', ro4: 'R', ro6: 'I' } },
  ],
};

async function seed(page, pid, { full = false } = {}) {
  await page.evaluate(async ({ pid, WBS, RISKS, STAKE, MEDICIONES, QUALITY_FULL, RACI_FULL, full }) => {
    const now = PM.nowIso();
    const doc = (template, title, fields) => ({ template, title, status: 'borrador', rev: null, fields, titleBlock: { codigo: '', elaboro: '', reviso: '', aprobo: '', fechaAprobacion: null }, createdAt: now, updatedAt: now, createdBy: null, updatedBy: null });
    await PM.store.set(PM.paths.tool(pid, 'wbs'), { nodes: WBS });
    await PM.store.set(PM.paths.tool(pid, 'costs'), { actuals: [], statusUpdates: [], reserves: { contingency: 22600000, management: 11900000 } });
    await PM.store.set(PM.paths.doc(pid, 'registro-riesgos'), doc('registro-riesgos', 'Registro de riesgos', { riesgos: RISKS }));
    await PM.store.set(PM.paths.doc(pid, 'registro-interesados'), doc('registro-interesados', 'Registro de interesados', { interesados: STAKE }));
    await PM.store.set(PM.paths.doc(pid, 'mediciones-control-calidad'), doc('mediciones-control-calidad', 'Mediciones de control de calidad', { mediciones: MEDICIONES }));
    if (full) { await PM.store.set(PM.paths.tool(pid, 'quality'), QUALITY_FULL); await PM.store.set(PM.paths.tool(pid, 'raci'), RACI_FULL); }
  }, { pid, WBS, RISKS, STAKE, MEDICIONES, QUALITY_FULL, RACI_FULL, full });
}
const getStore = (page, path) => page.evaluate((p) => PM.store.get(p), path);
const flush = async (page) => { await page.evaluate(() => PM.flushAll()); await page.waitForTimeout(150); };
const modal = (page) => page.locator('.modal').last();
const pop = (page) => page.locator('.matrices-pop');
/* Escribe en el campo nuevo que recibió el foco (espera a que el foco llegue a un campo vacío). */
const typeNew = async (page, text) => { await page.waitForFunction(() => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && !a.value; }); await page.keyboard.type(text); };
/* Colores de fondo calculados → [r,g,b] 0–255 (acepta rgb() y color(srgb …) de color-mix). */
const bgOf = (page, sel) => page.locator(sel).evaluate((el) => {
  const c = getComputedStyle(el).backgroundColor; const n = (c.match(/[\d.]+/g) || []).map(Number);
  return c.startsWith('color(') ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3);
});
const colorDist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
/* Etiquetas de la matriz de poder e interés: ¿alguna queda más cerca de otra burbuja que de la suya? */
const ambiguousLabels = (page) => page.evaluate(() => {
  const svg = document.querySelector('[data-pi-chart]');
  const dots = [...svg.querySelectorAll('g.matrices-dot')].map((g) => { const c = g.querySelectorAll('circle')[2]; return { idx: g.getAttribute('data-stake'), name: g.getAttribute('aria-label').split(':')[0], x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r') }; });
  const out = [];
  for (const g of svg.querySelectorAll('g[data-label-for]')) {
    const t = g.querySelector('text'); const b = t.getBBox();
    const d = (p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.width)), Math.max(b.y - p.y, 0, p.y - (b.y + b.height))) - p.r;
    const own = dots.find((p) => p.idx === g.getAttribute('data-label-for'));
    if (!own) { out.push('sin punto: ' + t.textContent); continue; }
    if (!own.name.replace(/\s+/g, '').startsWith(t.textContent.replace('…', '').replace(/\s+/g, ''))) out.push('texto distinto: ' + t.textContent + ' / ' + own.name);
    const other = dots.filter((p) => p !== own && d(p) < d(own) - 2);
    if (other.length) out.push(t.textContent + ' → ' + other.map((p) => p.name).join(', '));
  }
  return out;
});
/* Rótulos del eje X del Pareto: cada rótulo debe conservar palabras completas. */
const brokenParetoLabels = (page) => page.evaluate(() => [...document.querySelectorAll('[data-pareto-chart] g[data-xlabel]')].map((g) => {
  const cause = g.getAttribute('data-xlabel'); const lines = [...g.querySelectorAll('text')].map((t) => t.textContent);
  const joined = lines.join(' ');
  const ok = joined.endsWith('…') ? cause.startsWith(joined.slice(0, -1).trimEnd()) : joined === cause;
  return ok ? null : cause + ' → ' + JSON.stringify(lines);
}).filter(Boolean));

/* ------------------------------------------------------------------ prueba interactiva */
const { browser, page, errors } = await openApp({ file });
let pid;
try {
  pid = await createProject(page);
  await page.waitForTimeout(300);
  await seed(page, pid);
  function PM_PATH(k) { return 'projects/' + pid + '/' + k; }

  /* =========================== RACI */
  await step('RACI: estado vacío con acciones', async () => {
    await gotoView(page, 'raci');
    await page.getByText('La matriz RACI está vacía').waitFor();
    assert(await page.getByRole('button', { name: 'Importar de la EDT' }).count() > 0, 'falta botón Importar de la EDT');
    // el proceso 9.1 se nombra igual que en PM.KB y el mapa de procesos
    eq(await page.locator('.page .eyebrow').first().textContent(), '9.1 Planificar la gestión de recursos · Matriz de asignación de responsabilidades', 'eyebrow de la matriz RACI');
  });
  await step('RACI: agregar roles de la lista de ejemplo (selección parcial)', async () => {
    await page.getByRole('button', { name: 'Agregar roles de ejemplo' }).click();
    const m = modal(page);
    await m.getByRole('button', { name: 'Quitar selección' }).click();
    for (const n of ['Director de proyecto', 'Ingeniero de diseño', 'Residente de obra', 'Supervisor de montaje']) await m.locator('label', { hasText: n }).first().locator('input').check();
    await m.getByRole('button', { name: 'Agregar 4 roles' }).click();
    await page.locator('.matrices-role-h').nth(3).waitFor();
    eq(await page.locator('.matrices-role-name').allInnerTexts(), ['Director de proyecto', 'Ingeniero de diseño', 'Residente de obra', 'Supervisor de montaje'], 'roles en encabezado');
  });
  await step('RACI: importar paquetes de trabajo de la EDT con códigos', async () => {
    await page.getByRole('button', { name: 'Importar filas o roles' }).click();
    await page.getByRole('menuitem', { name: 'Importar de la EDT' }).click();
    const m = modal(page);
    await m.getByRole('button', { name: 'Importar 6 elementos' }).click();
    await page.locator('tr[id^="matrices-row-"]').nth(5).waitFor();
    const codes = await page.locator('tbody th.matrices-act .code-tag').allInnerTexts();
    eq(codes, ['1.1.1', '1.2.1', '1.2.2', '1.3.1', '1.3.2', '1.4'], 'códigos EDT importados');
    // Volver a importar: todo omitido
    await page.getByRole('button', { name: 'Importar filas o roles' }).click();
    await page.getByRole('menuitem', { name: 'Importar de la EDT' }).click();
    await modal(page).getByRole('button', { name: 'Nada nuevo para importar' }).waitFor();
    await modal(page).getByRole('button', { name: 'Entregables de nivel 1' }).click();
    await modal(page).getByRole('button', { name: 'Importar 3 elementos' }).waitFor();
    await modal(page).getByRole('button', { name: 'Cancelar' }).click();
  });
  await step('RACI: asignar celdas con el popover (clic)', async () => {
    const rows = page.locator('tr[id^="matrices-row-"]');
    await rows.nth(0).locator('button.matrices-cell').nth(1).click();
    await pop(page).getByRole('button', { name: 'Responsable', exact: true }).click();
    await rows.nth(0).locator('button.matrices-cell').nth(0).click();
    await pop(page).getByRole('button', { name: 'Rinde cuentas', exact: true }).click();
    eq((await rows.nth(0).locator('button.matrices-cell').nth(0).innerText()).trim(), 'A', 'celda A');
    eq((await rows.nth(0).locator('button.matrices-cell').nth(1).innerText()).trim(), 'R', 'celda R');
    assert((await rows.nth(0).locator('.matrices-check').innerText()).includes('Completa'), 'fila 1 debería quedar completa');
    assert(!(await pop(page).count()), 'el popover debe cerrarse');
  });
  await step('RACI: teclado (atajo de letra, Enter + flechas, Escape)', async () => {
    const rows = page.locator('tr[id^="matrices-row-"]');
    const c10 = rows.nth(1).locator('button.matrices-cell').nth(0);
    await c10.focus(); await page.keyboard.press('a');
    eq((await c10.innerText()).trim(), 'A', 'atajo A');
    const c12 = rows.nth(1).locator('button.matrices-cell').nth(2);
    await c12.focus(); await page.keyboard.press('Enter');
    await pop(page).waitFor();
    const focusedName = await page.evaluate(() => document.activeElement.innerText.trim());
    assert(focusedName.includes('Sin asignar'), 'el foco inicial debe estar en la opción actual (Sin asignar): ' + focusedName);
    await page.keyboard.press('ArrowDown'); // vuelve a R
    await page.keyboard.press('Enter');
    eq((await c12.innerText()).trim(), 'R', 'flechas + Enter asignan R');
    await page.waitForTimeout(60);
    const active = await page.evaluate(() => document.activeElement.getAttribute('data-cell'));
    assert(active, 'el foco vuelve a la celda');
    await c12.press('Enter'); await pop(page).waitFor(); await page.keyboard.press('Escape');
    assert(!(await pop(page).count()), 'Escape cierra el popover');
    await c12.press('Delete');
    eq((await c12.innerText()).trim(), '·', 'Supr vacía la celda');
    await c12.press('r');
  });
  await step('RACI: validación (sin A, varios A, sin R) y resumen', async () => {
    const rows = page.locator('tr[id^="matrices-row-"]');
    const r2 = rows.nth(2);
    assert((await r2.locator('.matrices-check').innerText()).includes('Sin A · Sin R'), 'fila 3 sin A ni R');
    await r2.locator('button.matrices-cell').nth(0).focus(); await page.keyboard.press('a');
    await r2.locator('button.matrices-cell').nth(3).focus(); await page.keyboard.press('a');
    assert((await r2.locator('.matrices-check').innerText()).includes('2 A · Sin R'), 'fila 3 con 2 A y sin R');
    assert(await r2.evaluate((el) => el.classList.contains('matrices-row-bad')), 'fila resaltada');
    const summary = await page.locator('[data-raci-issues]').innerText();
    assert(summary.includes('Tiene 2 roles que rinden cuentas (A); debe haber uno solo'), 'resumen menciona varios A');
    assert(summary.includes('Falta quien ejecuta (R)'), 'resumen menciona falta de R');
    assert(summary.includes('4 filas'), 'resumen cuenta 4 filas con observaciones: ' + summary.slice(0, 120));
    await r2.locator('button.matrices-cell').nth(3).focus(); await page.keyboard.press('r');
    assert((await r2.locator('.matrices-check').innerText()).includes('Completa'), 'fila 3 corregida');
  });
  await step('RACI: agregar, renombrar, mover y eliminar roles', async () => {
    await page.getByRole('button', { name: 'Agregar rol', exact: true }).click();
    await modal(page).locator('#pm-prompt').fill('Interventoría del cliente');
    await modal(page).getByRole('button', { name: 'Agregar rol' }).click();
    await page.locator('.matrices-role-h').nth(4).waitFor();
    await page.getByRole('button', { name: 'Opciones del rol Interventoría del cliente' }).click();
    await pop(page).getByRole('button', { name: 'Renombrar' }).click();
    await modal(page).locator('#pm-prompt').fill('Interventoría');
    await modal(page).getByRole('button', { name: 'Guardar nombre' }).click();
    await page.getByRole('button', { name: 'Opciones del rol Interventoría' }).click();
    await pop(page).getByRole('button', { name: 'Mover a la izquierda' }).click();
    eq((await page.locator('.matrices-role-name').allInnerTexts())[3], 'Interventoría', 'rol movido a la izquierda');
    // eliminar Supervisor de montaje (tiene un A en fila 3 → pide confirmación)
    await page.getByRole('button', { name: 'Opciones del rol Supervisor de montaje' }).click();
    await pop(page).getByRole('button', { name: 'Eliminar rol' }).click();
    await modal(page).getByRole('button', { name: 'Eliminar rol' }).click();
    await page.waitForTimeout(100);
    eq(await page.locator('.matrices-role-name').allInnerTexts(), ['Director de proyecto', 'Ingeniero de diseño', 'Residente de obra', 'Interventoría'], 'roles tras eliminar');
  });
  await step('RACI: agregar, renombrar, mover y eliminar filas', async () => {
    await page.getByLabel('Nombre de la nueva actividad o entregable').fill('Acta de entrega del andamio');
    await page.getByRole('button', { name: 'Agregar actividad' }).click();
    const rows = page.locator('tr[id^="matrices-row-"]');
    eq(await rows.count(), 7, 'filas tras agregar');
    await rows.nth(6).locator('textarea.matrices-autotext').fill('Acta de entrega y recibo del andamio');
    await rows.nth(6).getByRole('button', { name: 'Subir fila' }).click();
    eq(await rows.nth(5).locator('textarea.matrices-autotext').inputValue(), 'Acta de entrega y recibo del andamio', 'fila subida');
    await rows.nth(5).getByRole('button', { name: 'Eliminar fila' }).click(); // sin asignaciones: sin confirmación
    eq(await rows.count(), 6, 'fila eliminada');
  });
  await step('RACI: importar roles del registro de interesados', async () => {
    await page.getByRole('button', { name: 'Importar filas o roles' }).click();
    await page.getByRole('menuitem', { name: 'Importar roles del registro de interesados' }).click();
    const m = modal(page);
    await m.getByText('Patrocinador').waitFor();
    assert(await m.locator('label.is-dup', { hasText: 'Director de proyecto' }).count() === 1, 'Director de proyecto marcado como existente');
    await m.getByRole('button', { name: 'Quitar selección' }).click();
    await m.locator('label', { hasText: 'Coordinador SST (HSE)' }).locator('input').check();
    await m.getByRole('button', { name: 'Agregar 1 rol' }).click();
    assert((await page.locator('.matrices-role-name').allInnerTexts()).includes('Coordinador SST (HSE)'), 'rol importado');
  });
  await step('RACI: importar roles eligiendo la columna del registro (cargo)', async () => {
    await page.getByRole('button', { name: 'Importar filas o roles' }).click();
    await page.getByRole('menuitem', { name: 'Importar roles del registro de interesados' }).click();
    const m = modal(page);
    await m.getByRole('button', { name: 'Cargo', exact: true }).click();
    await m.getByText('Asesor de riesgos laborales').waitFor();
    eq(await m.getByText('Patrocinador', { exact: true }).count(), 0, 'con Cargo ya no se listan los roles');
    await m.getByRole('button', { name: 'Agregar 6 roles' }).waitFor({ timeout: 3000 }); // selección reiniciada: los 6 cargos nuevos (2 ya están en la matriz)
    await m.getByRole('button', { name: 'Cancelar' }).click();
    eq(await page.locator('.matrices-role-h').count(), 5, 'cancelar no agrega roles');
  });
  await step('RACI: renombrar un rol con un nombre que ya existe se rechaza', async () => {
    await page.getByRole('button', { name: 'Opciones del rol Interventoría' }).click();
    await pop(page).getByRole('button', { name: 'Renombrar' }).click();
    await modal(page).locator('#pm-prompt').fill('director de proyecto');
    await modal(page).getByRole('button', { name: 'Guardar nombre' }).click();
    await page.getByText('Ya existe otro rol con ese nombre').waitFor();
    assert((await page.locator('.matrices-role-name').allInnerTexts()).includes('Interventoría'), 'el rol conserva su nombre');
  });
  await step('RACI: eliminar una fila con asignaciones pide confirmación', async () => {
    const rows = page.locator('tr[id^="matrices-row-"]');
    const before = await rows.count();
    await rows.nth(0).getByRole('button', { name: 'Eliminar fila' }).click();
    await modal(page).getByText('asignaciones').waitFor();
    await modal(page).getByRole('button', { name: 'Cancelar' }).click();
    eq(await rows.count(), before, 'cancelar conserva la fila');
  });
  await step('RACI: carga por rol y exportación CSV', async () => {
    const loadTxt = await page.locator('section.card', { hasText: 'Carga por rol' }).innerText();
    assert(/Director de proyecto\s+0\s+3\s+0\s+0/.test(loadTxt.replace(/\t/g, ' ')), 'conteo R/A/C/I del director: ' + loadTxt.slice(0, 200));
    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    const csv = await modal(page).locator('textarea').inputValue();
    assert(csv.includes('Código EDT;Actividad / entregable;Director de proyecto;Ingeniero de diseño'), 'cabecera CSV: ' + csv.slice(0, 120));
    assert(csv.includes('1.1.1;Plan para la dirección del proyecto;A;R'), 'fila CSV');
    await modal(page).getByRole('button', { name: 'Cerrar' }).click();
  });
  await step('RACI: datos guardados en tools/raci', async () => {
    await flush(page);
    const data = await getStore(page, PM_PATH('tools/raci'));
    eq(data.roles.length, 5, 'roles guardados');
    eq(data.rows.length, 6, 'filas guardadas');
    const dir = data.roles.find((x) => x.name === 'Director de proyecto').id;
    eq(data.rows[0].cells[dir], 'A', 'celda guardada');
    eq(data.rows[0].wbsId, 'w11', 'wbsId guardado');
  });

  /* =========================== RIESGOS */
  await step('Riesgos: mapa de calor con chips, desborde +n y matrices separadas', async () => {
    await gotoView(page, 'riesgos-matriz');
    await page.locator('[data-heat="a44"]').waitFor();
    eq(await page.locator('[data-heat="a44"] .matrices-rid').allInnerTexts(), ['R-004'], 'celda P4×I4');
    eq(await page.locator('[data-heat="a33"] .matrices-rid').allInnerTexts(), ['R-003', 'R-006', 'R-012', '+1'], 'celda P3×I3 con +1');
    eq(await page.locator('[data-heat="o33"] .matrices-rid').allInnerTexts(), ['R-010'], 'oportunidad en su matriz');
    assert((await page.locator('[data-heat="a44"]').getAttribute('title')).includes('Nivel Alto'), 'tooltip con nivel');
    assert(await page.locator('[data-heat="a44"]').evaluate((el) => el.classList.contains('matrices-wash-signal')), 'tono alto');
    const order = await page.locator('table.matrices-risk-table').first().locator('tbody tr td:first-child').allInnerTexts();
    eq(order.slice(0, 4), ['R-004', 'R-005', 'R-001', 'R-002'], 'orden por puntuación (desempate por impacto)');
    assert((await page.locator('[data-unevaluated]').innerText()).includes('R-009'), 'R-009 sin evaluar');
  });
  await step('Riesgos: filtrar por celda y quitar filtro', async () => {
    await page.locator('[data-heat="a33"]').click();
    const ids = await page.locator('table.matrices-risk-table').first().locator('tbody tr td:first-child').allInnerTexts();
    eq(ids, ['R-003', 'R-006', 'R-012', 'R-013'], 'lista filtrada');
    await page.getByText('Celda seleccionada').waitFor();
    await page.getByRole('button', { name: 'Quitar filtro' }).click();
    assert((await page.locator('table.matrices-risk-table').first().locator('tbody tr').count()) === 12, 'lista completa');
  });
  await step('Riesgos: alternar amenazas / oportunidades y filtro por celda de oportunidades', async () => {
    await page.getByRole('group', { name: 'Matrices visibles' }).getByRole('button', { name: 'Oportunidades', exact: true }).click();
    eq(await page.locator('[data-heat^="a"]').count(), 0, 'sin matriz de amenazas');
    eq(await page.locator('[data-heat^="o"]').count(), 25, 'matriz de oportunidades');
    eq(await page.locator('table.matrices-risk-table').first().locator('tbody tr td:first-child').allInnerTexts(), ['R-011', 'R-010'], 'solo oportunidades, por puntuación');
    await page.locator('[data-heat="o33"]').click();
    eq(await page.locator('table.matrices-risk-table').first().locator('tbody tr td:first-child').allInnerTexts(), ['R-010'], 'filtro de oportunidades');
    await page.getByRole('group', { name: 'Matrices visibles' }).getByRole('button', { name: 'Amenazas', exact: true }).click();
    eq(await page.getByText('Celda seleccionada').count(), 0, 'el filtro de oportunidades se quita al ver solo amenazas');
    eq(await page.locator('[data-heat^="o"]').count(), 0, 'sin matriz de oportunidades');
    await page.getByRole('group', { name: 'Matrices visibles' }).getByRole('button', { name: 'Amenazas y oportunidades' }).click();
    eq(await page.locator('[data-heat]').count(), 50, 'ambas matrices');
  });
  await step('Riesgos: los cuatro niveles tienen tonos distinguibles y el nivel también en texto', async () => {
    const bajo = await bgOf(page, '[data-heat="a13"]'), medio = await bgOf(page, '[data-heat="a23"]'), alto = await bgOf(page, '[data-heat="a34"]'), muy = await bgOf(page, '[data-heat="a45"]');
    assert(colorDist(medio, alto) > 40, 'medio y alto casi iguales: ' + medio + ' / ' + alto);
    assert(colorDist(alto, muy) > 40, 'alto y muy alto casi iguales: ' + alto + ' / ' + muy);
    assert(colorDist(bajo, medio) > 40, 'bajo y medio casi iguales');
    assert((await page.locator('[data-heat="a23"]').getAttribute('aria-label')).includes('nivel Medio'), 'nivel en la etiqueta accesible');
    const legend = await page.getByLabel('Niveles de riesgo').innerText();
    for (const t of ['Bajo (1–4)', 'Medio (5–9)', 'Alto (10–19)', 'Muy alto (20–25)']) assert(legend.includes(t), 'leyenda: ' + t);
  });
  await step('Riesgos: resúmenes por nivel, categoría y estado', async () => {
    const lvl = (await page.locator('section.card', { hasText: 'Por nivel' }).innerText()).replace(/\s+/g, ' ');
    assert(/Muy alto 0 Alto 5 Medio 7 Bajo 0 Sin evaluar 1/.test(lvl), 'por nivel: ' + lvl);
    const cat = (await page.locator('section.card', { hasText: 'Por categoría' }).innerText()).replace(/\s+/g, ' ');
    assert(/Técnico 3 Externo 7 De la organización 3/.test(cat), 'por categoría: ' + cat);
    const est = (await page.locator('section.card', { hasText: 'Por estado' }).innerText()).replace(/\s+/g, ' ');
    assert(/Abierto 11 En seguimiento 1 Cerrado 1/.test(est), 'por estado: ' + est);
  });
  await step('Riesgos: edición rápida de P, I y estado actualiza el documento', async () => {
    await page.getByLabel('Probabilidad de R-003').selectOption('5');
    await page.getByLabel('Impacto de R-003').selectOption('4');
    await page.getByLabel('Estado de R-005').selectOption('En seguimiento');
    await page.getByLabel('Probabilidad de R-009').selectOption('2');
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-riesgos'));
    const byId = Object.fromEntries(d.fields.riesgos.map((x) => [x.id, x]));
    eq([byId['R-003'].probabilidad, byId['R-003'].impacto], [5, 4], 'P×I de R-003');
    eq(byId['R-005'].estado, 'En seguimiento', 'estado de R-005');
    eq(byId['R-009'].probabilidad, 2, 'R-009 evaluado');
    eq(await page.locator('[data-heat="a54"] .matrices-rid').allInnerTexts(), ['R-003'], 'R-003 movido a P5×I4');
    eq(await page.locator('[data-unevaluated]').count(), 0, 'sin riesgos pendientes');
  });
  await step('Riesgos: agregar riesgo con id automático', async () => {
    await page.getByRole('button', { name: 'Agregar riesgo' }).first().click();
    const m = modal(page);
    await m.getByRole('button', { name: 'Agregar riesgo' }).click();
    await m.getByText('Describe el riesgo para poder registrarlo.').waitFor();
    await m.locator('#mx-r-desc').fill('Daño de la malla de protección por vientos fuertes');
    await m.locator('#mx-r-cat').selectOption('Externo');
    await m.locator('#mx-r-p').selectOption('2');
    await m.locator('#mx-r-i').selectOption('3');
    await m.locator('#mx-r-estr').selectOption('Mitigar');
    await m.locator('#mx-r-res input, input#mx-r-res').fill('750000');
    await m.getByRole('button', { name: 'Agregar riesgo' }).click();
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-riesgos'));
    const nr = d.fields.riesgos.find((x) => x.id === 'R-014');
    assert(nr, 'R-014 creado');
    eq([nr.probabilidad, nr.impacto, nr.categoria, nr.tipo, nr.estrategia, nr.reserva, nr.estado], [2, 3, 'Externo', 'Amenaza', 'Mitigar', 750000, 'Abierto'], 'campos de R-014');
    eq(await page.locator('[data-heat="a23"] .matrices-rid').allInnerTexts(), ['R-009', 'R-014'], 'R-014 en la matriz (junto a R-009, evaluado antes)');
  });
  await step('Riesgos: resumen de reservas frente a contingencia', async () => {
    const txt = await page.locator('section.card', { hasText: 'Reserva para contingencias' }).innerText();
    assert(txt.includes('$ 22,6 M'), 'contingencia: ' + txt.slice(0, 300));
    assert(txt.includes('superan la reserva para contingencias en $ 450.000'), 'mensaje de exceso: ' + txt.slice(0, 400));
  });

  await step('Riesgos: etiquetas iguales a las del plan y el registro (impacto 3 «Medio», «Respuesta acordada»)', async () => {
    const axis = await page.locator('.matrices-axis-i').allInnerTexts();
    assert(axis.some((t) => t.replace(/\s+/g, ' ').trim() === '3 Medio'), 'eje de impacto: ' + JSON.stringify(axis));
    assert(!axis.some((t) => /Moderado/.test(t)), 'sin «Moderado» en el eje');
    assert((await page.locator('[data-heat="a23"]').getAttribute('aria-label')).includes('impacto 3 (Medio)'), 'etiqueta accesible con «Medio»');
    eq(await page.getByLabel('Impacto de R-001').locator('option[value="3"]').textContent(), '3 · Medio', 'opción 3 del impacto en la tabla');
    await page.getByRole('button', { name: 'Agregar riesgo' }).first().click();
    const m = modal(page);
    eq(await m.locator('#mx-r-i option[value="3"]').textContent(), '3 · Medio', 'opción 3 del impacto en el formulario');
    eq(await m.getByLabel('Respuesta acordada').count(), 1, 'campo «Respuesta acordada»');
    eq(await m.getByText('Respuesta planificada').count(), 0, 'sin «Respuesta planificada»');
    await m.getByRole('button', { name: 'Cancelar' }).click();
  });
  await step('Riesgos: un registro aprobado no se modifica desde la matriz hasta crear una nueva revisión', async () => {
    const path = PM_PATH('docs/registro-riesgos');
    await flush(page);
    // el formulario abierto mientras otra pestaña aprueba el registro no guarda
    await page.getByRole('button', { name: 'Agregar riesgo' }).first().click();
    await modal(page).locator('#mx-r-desc').fill('Riesgo que no debe guardarse');
    await page.evaluate(async (p) => { const d = await PM.store.get(p); await PM.store.set(p, { ...d, status: 'aprobado', rev: '1', titleBlock: { ...d.titleBlock, fechaAprobacion: '2026-09-15', aprobo: 'Director de proyecto' } }); }, path);
    await page.locator('[data-mx-lock="aprobado"]').waitFor();
    const before = await getStore(page, path);
    await modal(page).getByRole('button', { name: 'Agregar riesgo' }).click();
    await page.locator('.toast', { hasText: 'No se guardó: el registro de riesgos quedó bloqueado' }).waitFor();
    eq(await page.locator('.modal').count(), 1, 'el formulario sigue abierto');
    await modal(page).getByRole('button', { name: 'Cancelar' }).click();
    // modo de consulta: sin selects ni «Agregar riesgo»; la vista sigue filtrando
    const note = await page.locator('[data-mx-lock]').innerText();
    assert(note.includes('aprobado (revisión 1)') && note.includes('Crear nueva revisión (2A)'), 'aviso de registro aprobado: ' + note);
    eq(await page.locator('.matrices-risk-table select').count(), 0, 'sin selects de P, I y estado');
    eq(await page.getByRole('button', { name: 'Agregar riesgo' }).count(), 0, 'sin «Agregar riesgo»');
    await page.locator('[data-heat="a54"]').click();
    await page.getByText('Celda seleccionada').waitFor();
    await page.getByRole('button', { name: 'Quitar filtro' }).click();
    await flush(page);
    eq(await getStore(page, path), before, 'el registro aprobado no cambia');
    // cancelar la confirmación no cambia nada
    await page.getByRole('button', { name: 'Crear nueva revisión (2A)' }).click();
    await modal(page).getByRole('button', { name: 'Cancelar' }).click();
    eq((await getStore(page, path)).status, 'aprobado', 'sigue aprobado al cancelar');
    // nueva revisión: vuelve a borrador 2A, sin fecha de aprobación, y la matriz se puede editar
    await page.getByRole('button', { name: 'Crear nueva revisión (2A)' }).click();
    assert((await modal(page).innerText()).includes('borrador 2A a partir del contenido de la revisión 1'), 'texto de la confirmación');
    await modal(page).getByRole('button', { name: 'Crear revisión 2A' }).click();
    await page.getByLabel('Probabilidad de R-001').waitFor();
    eq(await page.locator('[data-mx-lock]').count(), 0, 'sin aviso de bloqueo');
    const d = await getStore(page, path);
    eq([d.status, d.rev, d.titleBlock.fechaAprobacion, d.titleBlock.aprobo, d.fields.riesgos.length], ['borrador', '2A', null, 'Director de proyecto', before.fields.riesgos.length], 'registro reabierto como borrador 2A');
    eq(await page.getByRole('button', { name: 'Agregar riesgo' }).count(), 1, '«Agregar riesgo» disponible otra vez');
  });

  /* =========================== INTERESADOS */
  await step('Interesados: ubicación por cuadrante', async () => {
    await gotoView(page, 'interesados-matriz');
    await page.locator('[data-pi-chart]').waitFor();
    const q = async (id) => page.locator('[data-quad="' + id + '"] .matrices-quad-list li .truncate').allInnerTexts();
    const cerca = (await q('cerca')).map((t) => t.split(' · ')[0]);
    assert(cerca.includes('Director de obra del cliente') && cerca.includes('Interventoría del cliente') && cerca.includes('Coordinador SST'), 'gestionar de cerca: ' + cerca);
    assert((await q('satisfechos')).some((t) => t.startsWith('Secretaría de Movilidad')), 'mantener satisfechos');
    assert((await q('informados')).some((t) => t.startsWith('Cuadrilla de montaje')), 'mantener informados');
    assert((await q('monitorear')).some((t) => t.startsWith('Vecinos del edificio')), 'monitorear');
    assert((await page.locator('[data-stake-pending]').innerText()).includes('Curaduría urbana'), 'pendiente sin evaluar');
    eq(await page.locator('[data-pi-chart] g.matrices-dot').count(), 10, 'puntos dibujados');
  });
  await step('Interesados: etiquetas sin superposición y puntos idénticos separados', async () => {
    const boxes = await page.evaluate(() => {
      const svg = document.querySelector('[data-pi-chart]');
      const texts = [...svg.querySelectorAll('g[pointer-events="none"] text')].map((t) => t.getBBox());
      const a = document.querySelector('[data-stake="5"] circle:last-of-type'), b = document.querySelector('[data-stake="6"] circle:last-of-type');
      return { texts: texts.map((r) => [r.x, r.y, r.width, r.height]), a: [+a.getAttribute('cx'), +a.getAttribute('cy')], b: [+b.getAttribute('cx'), +b.getAttribute('cy')] };
    });
    let overlaps = 0;
    for (let i = 0; i < boxes.texts.length; i++) for (let j = i + 1; j < boxes.texts.length; j++) { const [x1, y1, w1, h1] = boxes.texts[i], [x2, y2, w2, h2] = boxes.texts[j]; if (x1 < x2 + w2 - 1 && x2 < x1 + w1 - 1 && y1 < y2 + h2 - 1 && y2 < y1 + h1 - 1) overlaps++; }
    eq(overlaps, 0, 'etiquetas superpuestas');
    assert(Math.hypot(boxes.a[0] - boxes.b[0], boxes.a[1] - boxes.b[1]) > 10, 'puntos con la misma posición deben separarse');
  });
  await step('Interesados: cada etiqueta queda más cerca de su propio punto', async () => {
    eq(await ambiguousLabels(page), [], 'etiquetas ambiguas');
  });
  await step('Interesados: tooltip al pasar sobre un punto', async () => {
    const dot = page.locator('[data-stake="2"] circle').nth(2);
    await dot.hover();
    const tipTxt = await page.locator('.chart-tip').innerText();
    assert(tipTxt.includes('Director de obra del cliente') && tipTxt.includes('Poder 5 · Interés 5') && tipTxt.includes('Gestionar de cerca'), 'tooltip: ' + tipTxt);
    await page.mouse.move(5, 5);
  });
  await step('Interesados: arrastrar un punto actualiza poder e interés', async () => {
    const geo = await page.evaluate(() => {
      const svg = document.querySelector('[data-pi-chart]');
      const r = svg.getBoundingClientRect();
      const lines = [...svg.querySelectorAll('line.grid-line')];
      const vx = lines.filter((l) => l.getAttribute('x1') === l.getAttribute('x2')).map((l) => +l.getAttribute('x1'));
      const hy = lines.filter((l) => l.getAttribute('y1') === l.getAttribute('y2')).map((l) => +l.getAttribute('y1'));
      const dot = document.querySelector('[data-stake="7"] circle:last-of-type');
      return { left: r.left, top: r.top, vx, hy, cx: +dot.getAttribute('cx'), cy: +dot.getAttribute('cy') };
    });
    // ARL (índice 7): poder 3, interés 2 → soltar en interés 5, poder 1
    await page.mouse.move(geo.left + geo.cx, geo.top + geo.cy);
    await page.mouse.down();
    const tx = geo.left + geo.vx[4], ty = geo.top + geo.hy[0];
    for (let k = 1; k <= 8; k++) await page.mouse.move(geo.left + geo.cx + ((tx - geo.left - geo.cx) * k) / 8, geo.top + geo.cy + ((ty - geo.top - geo.cy) * k) / 8);
    assert((await page.getByText('Soltar en: poder 1 · interés 5').count()) === 1, 'aviso de destino durante el arrastre');
    const before = await page.evaluate((p) => PM.store.get(p), PM_PATH('docs/registro-interesados'));
    eq([before.fields.interesados[7].poder, before.fields.interesados[7].interes], [3, 2], 'no escribe durante el arrastre');
    await page.mouse.up();
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-interesados'));
    eq([d.fields.interesados[7].poder, d.fields.interesados[7].interes], [1, 5], 'ARL movido');
    assert((await page.locator('[data-quad="informados"]').innerText()).includes('ARL'), 'ARL en mantener informados');
  });
  await step('Interesados: mover con el teclado', async () => {
    await page.locator('[data-stake="8"]').focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-interesados'));
    eq([d.fields.interesados[8].poder, d.fields.interesados[8].interes], [2, 3], 'vecinos movidos con flechas');
  });
  await step('Interesados: evaluación del involucramiento (C y D) y brechas', async () => {
    await page.getByRole('tab', { name: /Evaluación del involucramiento/ }).click();
    await page.locator('[data-eng-table]').waitFor();
    // Secretaría de Movilidad (índice 9) sin C ni D
    await page.locator('[data-eng="9:1"]').click();
    await pop(page).getByRole('button', { name: 'Marcar como nivel actual' }).click();
    await page.locator('[data-eng="9:3"]').click();
    await pop(page).getByRole('button', { name: 'Marcar como nivel deseado' }).click();
    const row = page.locator('[data-eng-row="9"]');
    assert((await row.innerText()).includes('Brecha: 2 niveles'), 'brecha de 2 niveles: ' + (await row.innerText()));
    eq(await row.locator('.matrices-eng-path').count(), 3, 'camino sombreado');
    // atajo de teclado D sobre Líder para Almacén (índice 6)
    await page.locator('[data-eng="6:4"]').focus();
    await page.keyboard.press('d');
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-interesados'));
    eq([d.fields.interesados[9].nivelActual, d.fields.interesados[9].nivelDeseado], ['Reticente', 'Partidario'], 'C y D guardados');
    eq(d.fields.interesados[6].nivelDeseado, 'Líder', 'D por teclado');
    await page.getByLabel(/Solo interesados con brecha/).check();
    const shown = await page.locator('[data-eng-table] tbody tr').count();
    const gapItems = await page.locator('[data-gap-list] li').count();
    eq(shown, gapItems, 'filtro muestra solo los que tienen brecha');
    assert(!(await page.locator('[data-eng-row="1"]').count()), 'Director de proyecto (sin brecha) oculto');
  });
  await step('Interesados: agregar interesado desde el modal', async () => {
    await page.getByRole('button', { name: 'Agregar interesado' }).first().click();
    const m = modal(page);
    await m.locator('#mx-s-nombre').fill('Junta de acción comunal');
    await m.locator('#mx-s-clas').selectOption('Externo');
    await m.locator('#mx-s-poder').selectOption('2');
    await m.locator('#mx-s-interes').selectOption('3');
    await m.locator('#mx-s-influencia').selectOption('2');
    await m.getByRole('button', { name: 'Agregar interesado' }).click();
    await flush(page);
    const d = await getStore(page, PM_PATH('docs/registro-interesados'));
    const last = d.fields.interesados[d.fields.interesados.length - 1];
    eq([last.nombre, last.poder, last.interes, last.clasificacion], ['Junta de acción comunal', 2, 3, 'Externo'], 'interesado agregado');
  });

  await step('Interesados: un registro obsoleto no se modifica desde las matrices hasta crear una nueva revisión', async () => {
    const path = PM_PATH('docs/registro-interesados');
    await flush(page);
    await page.getByRole('tab', { name: 'Poder e interés' }).click();
    await page.evaluate(async (p) => { const d = await PM.store.get(p); await PM.store.set(p, { ...d, status: 'obsoleto', rev: '0' }); }, path);
    await page.locator('[data-mx-lock="obsoleto"]').waitFor();
    const before = await getStore(page, path);
    assert((await page.locator('[data-mx-lock]').innerText()).includes('obsoleto (revisión 0)'), 'aviso de registro obsoleto');
    eq(await page.locator('[data-pi-chart] g.matrices-dot.is-ro').count(), await page.locator('[data-pi-chart] g.matrices-dot').count(), 'puntos de solo lectura');
    await page.locator('[data-stake="0"]').focus();
    await page.keyboard.press('ArrowDown');
    eq(await page.getByRole('button', { name: 'Agregar interesado' }).count(), 0, 'sin «Agregar interesado»');
    eq(await page.locator('[data-stake-pending] select').count(), 0, 'sin selects de poder e interés');
    await page.getByRole('tab', { name: /Evaluación del involucramiento/ }).click();
    eq(await page.locator('button.matrices-eng-cell').count(), 0, 'involucramiento no editable');
    await flush(page);
    eq(await getStore(page, path), before, 'el registro obsoleto no cambia');
    await page.getByRole('button', { name: 'Crear nueva revisión (1A)' }).click();
    await modal(page).getByRole('button', { name: 'Crear revisión 1A' }).click();
    await page.locator('button.matrices-eng-cell').first().waitFor();
    const d = await getStore(page, path);
    eq([d.status, d.rev, d.fields.interesados.length], ['borrador', '1A', before.fields.interesados.length], 'registro reabierto como borrador 1A');
    await page.getByRole('tab', { name: 'Poder e interés' }).click();
  });

  /* =========================== CALIDAD */
  await step('Calidad: crear diagrama de Ishikawa con causas y subcausas', async () => {
    await gotoView(page, 'calidad');
    await page.getByRole('button', { name: 'Crear diagrama de Ishikawa' }).click();
    await modal(page).locator('#pm-prompt').fill('Retraso en el montaje');
    await modal(page).getByRole('button', { name: 'Crear diagrama' }).click();
    await page.locator('#mx-ish-effect').waitFor();
    assert(await page.evaluate(() => document.activeElement && document.activeElement.id === 'mx-ish-effect'), 'foco en el efecto');
    await page.locator('#mx-ish-effect').fill('Montaje de los niveles 6–10 con 4 días de retraso');
    eq(await page.locator('.matrices-cat-head input').evaluateAll((els) => els.map((e) => e.value)), ['Mano de obra', 'Método', 'Maquinaria', 'Materiales', 'Medición', 'Medio ambiente'], 'categorías 6M');
    const cat = (n) => page.locator('.matrices-cat').nth(n);
    await cat(0).getByRole('button', { name: 'Agregar causa' }).click();
    await typeNew(page, 'Rotación de montadores certificados');
    await cat(0).getByRole('button', { name: 'Agregar subcausa' }).click();
    await typeNew(page, 'Salarios por debajo del mercado');
    await cat(0).getByRole('button', { name: 'Agregar causa' }).click();
    await typeNew(page, 'Curva de aprendizaje del sistema multidireccional de andamios');
    await cat(3).getByRole('button', { name: 'Agregar causa' }).click();
    await typeNew(page, 'Faltantes de rosetas y diagonales en el despacho');
    await cat(5).getByRole('button', { name: 'Agregar causa' }).click();
    await typeNew(page, 'Lluvias en la tarde');
    await cat(1).getByRole('button', { name: 'Agregar causa' }).click();
    await typeNew(page, 'Secuencia de montaje cambiada por el cliente');
    await cat(0).getByRole('button', { name: 'Bajar causa' }).first().click();
    eq(await cat(0).locator('.matrices-cause textarea').evaluateAll((els) => els.map((e) => e.value)), ['Curva de aprendizaje del sistema multidireccional de andamios', 'Rotación de montadores certificados'], 'causa reordenada');
    await page.getByRole('button', { name: 'Agregar categoría' }).click();
    await typeNew(page, 'Gestión');
    await page.locator('.matrices-cat').nth(6).getByRole('button', { name: 'Eliminar categoría' }).click();
    eq(await page.locator('.matrices-cat').count(), 6, 'categoría eliminada');
    const svgText = await page.locator('[data-fishbone] svg').textContent();
    for (const t of ['Rotación de montadores', 'Salarios por debajo', 'Lluvias en la tarde', 'EFECTO', 'Mano de obra', 'Medio ambiente']) assert(svgText.includes(t), 'texto en el diagrama: ' + t);
  });
  await step('Calidad: el diagrama de Ishikawa no superpone textos', async () => {
    const res = await page.evaluate(() => {
      const svg = document.querySelector('[data-fishbone] svg');
      const els = [...svg.querySelectorAll('text')].map((t) => { const b = t.getBBox(); return [b.x, b.y, b.width, b.height, t.textContent]; });
      const W = +svg.getAttribute('width'), H = +svg.getAttribute('height');
      const bones = [...svg.querySelectorAll('line[data-bone]')].map((l) => [+l.getAttribute('x1'), +l.getAttribute('y1'), +l.getAttribute('x2'), +l.getAttribute('y2')]);
      return { els, W, H, bones };
    });
    const bad = [];
    for (let i = 0; i < res.els.length; i++) for (let j = i + 1; j < res.els.length; j++) { const [x1, y1, w1, h1, t1] = res.els[i], [x2, y2, w2, h2, t2] = res.els[j]; if (x1 < x2 + w2 - 1 && x2 < x1 + w1 - 1 && y1 < y2 + h2 - 1 && y2 < y1 + h1 - 1) bad.push(t1 + ' / ' + t2); }
    eq(bad, [], 'textos superpuestos');
    for (const [x, y, w, h, t] of res.els) assert(x >= 0 && y >= 0 && x + w <= res.W + 1 && y + h <= res.H + 1, 'texto fuera del lienzo: ' + t);
    // ningún texto de causa cruza una espina
    const cross = [];
    for (const [x, y, w, h, t] of res.els) for (const [x1, y1, x2, y2] of res.bones) {
      for (let k = 0; k <= 10; k++) { const yy = y + (h * k) / 10; if ((yy - y1) * (yy - y2) > 0) continue; const xx = x1 + ((x2 - x1) * (yy - y1)) / (y2 - y1 || 1); if (xx > x + 1 && xx < x + w - 1) { cross.push(t); break; } }
    }
    eq([...new Set(cross)], [], 'textos que cruzan espinas');
  });
  await step('Calidad: descargar SVG del Ishikawa, renombrar y eliminar diagramas', async () => {
    await page.getByRole('button', { name: 'Descargar SVG' }).click();
    const svgTxt = await modal(page).locator('textarea').inputValue();
    assert(svgTxt.includes('<svg') && svgTxt.includes('Rotación de montadores') && !svgTxt.includes('var(--'), 'SVG autónomo con colores resueltos');
    await modal(page).getByRole('button', { name: 'Cerrar' }).click();
    await page.getByRole('button', { name: 'Nuevo diagrama' }).click();
    await modal(page).locator('#pm-prompt').fill('Diagrama temporal');
    await modal(page).getByRole('button', { name: 'Crear diagrama' }).click();
    await page.getByRole('button', { name: 'Opciones del diagrama' }).click();
    await page.getByRole('menuitem', { name: 'Renombrar' }).click();
    await modal(page).locator('#pm-prompt').fill('Diagrama para borrar');
    await modal(page).getByRole('button', { name: 'Guardar nombre' }).click();
    assert((await page.getByLabel('Diagrama de Ishikawa', { exact: true }).locator('option').allInnerTexts()).includes('Diagrama para borrar'), 'renombrado');
    await page.getByRole('button', { name: 'Opciones del diagrama' }).click();
    await page.getByRole('menuitem', { name: 'Eliminar diagrama' }).click();
    await modal(page).getByRole('button', { name: 'Eliminar diagrama' }).click();
    eq(await page.getByLabel('Diagrama de Ishikawa', { exact: true }).locator('option').allInnerTexts(), ['Retraso en el montaje'], 'queda un diagrama');
    assert((await page.locator('[data-fishbone]').textContent()).includes('Lluvias en la tarde'), 'se muestra el diagrama restante');
  });
  await step('Calidad: Pareto manual (orden, acumulado, pocos vitales)', async () => {
    await page.getByRole('tab', { name: /Diagrama de Pareto/ }).click();
    await page.getByRole('button', { name: 'Nuevo análisis de Pareto' }).click();
    await modal(page).locator('#mx-par-name').fill('No conformidades del montaje');
    await modal(page).getByRole('button', { name: 'Crear análisis' }).click();
    const data = [['Barandas mal aseguradas', 15], ['Abrazaderas sin torque', 40], ['Rodapiés faltantes', 25], ['Plataformas sin traba', 10], ['Base sin nivelar', 6], ['Señalización incompleta', 4]];
    for (let k = 0; k < data.length; k++) {
      await page.getByRole('button', { name: 'Agregar causa' }).click();
      await page.getByLabel('Causa — fila ' + (k + 1)).fill(data[k][0]);
      await page.getByLabel('Frecuencia — fila ' + (k + 1)).fill(String(data[k][1]));
    }
    await page.locator('[data-pareto-chart]').waitFor();
    eq(await page.locator('[data-pareto-chart] path[data-vital="1"]').count(), 3, 'pocos vitales');
    eq(await page.locator('[data-pareto-chart] path[data-vital]').count(), 6, 'barras');
    const rows = await page.locator('[data-pareto-table] tbody tr').allInnerTexts();
    assert(rows[0].startsWith('Abrazaderas sin torque') && rows[0].includes('40 %'), 'primera fila: ' + rows[0]);
    assert(rows[2].includes('80 %') && rows[2].includes('Vital'), 'tercera fila 80 %: ' + rows[2]);
    assert(!rows[3].includes('Vital'), 'cuarta fila no vital');
    const svgText = await page.locator('[data-pareto-chart]').textContent();
    assert(svgText.includes('80 % acumulado'), 'línea del 80 %');
    assert(svgText.includes('65 %') && svgText.includes('100 %'), 'rótulos de % acumulado');
  });
  await step('Calidad: Pareto desde mediciones de control de calidad', async () => {
    await page.getByRole('button', { name: 'Nuevo análisis', exact: true }).click();
    await modal(page).locator('#mx-par-name').fill('Defectos registrados');
    await modal(page).getByRole('button', { name: 'Mediciones de control de calidad' }).click();
    await modal(page).getByText('Hoy hay 11 no conformidades').waitFor();
    await modal(page).getByRole('button', { name: 'Crear análisis' }).click();
    await page.getByText('Se calcula en vivo con 11 mediciones no conformes').waitFor();
    assert((await page.locator('.matrices-note', { hasText: 'Se calcula en vivo' }).innerText()).includes('agrupadas por la columna «Causa del defecto»'), 'nota del Pareto con el nombre de la columna del registro');
    const rows = await page.locator('[data-pareto-table] tbody tr').allInnerTexts();
    eq(rows.map((t) => t.split('\t')[0]), ['Abrazadera floja', 'Pieza deformada', 'Falta de pasador', 'Sin causa registrada'], 'causas agrupadas');
    assert(rows[2].includes('\t2\t'), 'agrupa sin distinguir mayúsculas: ' + rows[2]);
    eq(await brokenParetoLabels(page), [], 'rótulos partidos a mitad de palabra');
    // otra persona registra 3 no conformidades más por pieza deformada: el diagrama se recalcula en vivo
    await page.evaluate(async (pid) => {
      const p = PM.paths.doc(pid, 'mediciones-control-calidad'); const d = await PM.store.get(p);
      const extra = [1, 2, 3].map((k) => ({ id: 'z' + k, fecha: '2026-09-30', entregable: 'Montaje', metrica: 'Estado de piezas', resultado: 'No cumple', conforme: 'No', causa: 'Pieza deformada', accion: '' }));
      await PM.store.set(p, { ...d, fields: { ...d.fields, mediciones: [...d.fields.mediciones, ...extra] } });
    }, pid);
    await page.getByText('Se calcula en vivo con 14 mediciones no conformes').waitFor();
    const live = await page.locator('[data-pareto-table] tbody tr').allInnerTexts();
    assert(live[0].startsWith('Pieza deformada') && live[0].includes('\t6\t'), 'Pieza deformada pasa a ser la primera causa: ' + live[0]);
    await page.getByRole('button', { name: 'Opciones del análisis' }).click();
    await page.getByRole('menuitem', { name: 'Convertir en datos manuales' }).click();
    await modal(page).getByRole('button', { name: 'Convertir' }).click();
    await page.getByLabel('Causa — fila 1').waitFor();
    await flush(page);
    const q = await getStore(page, PM_PATH('tools/quality'));
    const frozen = q.pareto.find((x) => x.name === 'Defectos registrados');
    eq(frozen.source, 'manual', 'origen manual tras convertir');
    eq(frozen.items.map((x) => x.count).sort((a, b) => b - a), [6, 5, 2, 1], 'conteos copiados');
  });
  await step('Calidad: gráfico de control con punto fuera de control y regla de los siete', async () => {
    await page.getByRole('tab', { name: /Gráfico de control/ }).click();
    await page.getByRole('button', { name: 'Nueva serie de control' }).click();
    const m = modal(page);
    await m.locator('#mx-c-name').fill('Torque de apriete de abrazaderas');
    await m.locator('#mx-c-unit').fill('N·m');
    await m.locator('#mx-c-lsl').fill('55');
    await m.locator('#mx-c-usl').fill('45');
    await m.getByRole('button', { name: 'Crear serie' }).click();
    await m.getByText('El límite inferior de especificación debe ser menor que el superior.').waitFor();
    await m.locator('#mx-c-lsl').fill('45');
    await m.locator('#mx-c-usl').fill('54');
    await m.getByRole('button', { name: 'Crear serie' }).click();
    await page.getByRole('button', { name: 'Opciones de la serie' }).click();
    await page.getByRole('menuitem', { name: 'Pegar mediciones' }).click();
    const lines = ['2026-09-01;50,2', ...CONTROL_VALUES.slice(1).map((v) => String(v).replace('.', ',')), 'valor raro'];
    await modal(page).locator('#mx-paste').fill(lines.join('\n'));
    await modal(page).getByText('No se reconoció un número en la línea 23').waitFor();
    await modal(page).getByRole('button', { name: 'Agregar 22 mediciones' }).click();
    await page.locator('[data-control-chart]').waitFor();
    eq(await page.locator('[data-control-chart] circle[data-out="1"]').count(), 1, 'un punto fuera de control');
    const out = await page.locator('[data-out-list]').innerText();
    assert(out.includes('Muestra 18') && out.includes('54,6'), 'lista fuera de control: ' + out);
    const runs = await page.locator('[data-run-list]').innerText();
    assert(runs.includes('Muestras 1 a 7, por debajo de la media') && runs.includes('Muestras 8 a 14, por encima de la media'), 'regla de los siete: ' + runs);
    assert((await page.locator('[data-spec-list]').innerText()).includes('> LSE'), 'fuera de especificación');
    const stats = await page.locator('.matrices-stats').innerText();
    assert(stats.includes('50,37') && stats.includes('53,38'), 'media y LSC: ' + stats.replace(/\n/g, ' '));
    // editar un punto en la tabla: corregir el atípico
    await page.getByLabel('Valor (N·m) — fila 18').fill('50,3');
    await page.waitForTimeout(100);
    eq(await page.locator('[data-control-chart] circle[data-out="1"]').count(), 0, 'sin puntos fuera tras corregir');
    await page.getByLabel('Valor (N·m) — fila 18').fill('54,6');
    await page.locator('tr', { has: page.getByLabel('Valor (N·m) — fila 22') }).getByRole('button', { name: 'Eliminar fila' }).click();
    await flush(page);
    const q = await getStore(page, PM_PATH('tools/quality'));
    eq(q.control[0].points.length, 21, 'puntos guardados');
    eq(q.control[0].points[17].value, 54.6, 'valor editado');
    eq([q.control[0].lsl, q.control[0].usl, q.control[0].unit], [45, 54, 'N·m'], 'límites guardados');
    eq(q.ishikawa[0].categories[0].causes.length, 2, 'ishikawa guardado');
    eq(q.pareto.length, 2, 'pareto guardado');
  });

  await step('Calidad: crear y eliminar una serie de control', async () => {
    await page.getByRole('button', { name: 'Nueva serie', exact: true }).click();
    await modal(page).locator('#mx-c-name').fill('Verticalidad de pies derechos');
    await modal(page).getByRole('button', { name: 'Crear serie' }).click();
    await page.getByText('Registra al menos dos mediciones').waitFor();
    await page.getByRole('button', { name: 'Opciones de la serie' }).click();
    await page.getByRole('menuitem', { name: 'Eliminar serie' }).click();
    await modal(page).getByRole('button', { name: 'Eliminar serie' }).click();
    await page.locator('[data-control-chart]').waitFor();
    await flush(page);
    eq((await getStore(page, PM_PATH('tools/quality'))).control.length, 1, 'queda una serie');
  });

  /* =========================== PERSISTENCIA */
  await step('Persistencia tras recargar la página', async () => {
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForFunction(() => window.PM && PM.getState().mode !== 'loading');
    await gotoView(page, 'raci');
    await page.locator('tr[id^="matrices-row-"]').nth(5).waitFor();
    eq((await page.locator('tr[id^="matrices-row-"]').nth(0).locator('button.matrices-cell').nth(0).innerText()).trim(), 'A', 'RACI persistente');
    await gotoView(page, 'riesgos-matriz');
    await page.locator('[data-heat="a54"]').waitFor();
    eq(await page.locator('[data-heat="a54"] .matrices-rid').allInnerTexts(), ['R-003'], 'riesgo persistente');
    await gotoView(page, 'interesados-matriz');
    await page.getByRole('tab', { name: 'Poder e interés' }).click();
    await page.locator('[data-quad="informados"]').waitFor();
    assert((await page.locator('[data-quad="informados"]').innerText()).includes('ARL'), 'interesado persistente');
    await gotoView(page, 'calidad');
    await page.getByRole('tab', { name: /Diagrama de Ishikawa/ }).click();
    await page.locator('[data-fishbone]').waitFor();
    assert((await page.locator('[data-fishbone]').textContent()).includes('Lluvias en la tarde'), 'ishikawa persistente');
  });

  /* =========================== SOLO LECTURA */
  await step('Modo de solo lectura oculta la edición', async () => {
    await page.evaluate(() => PM.setState({ canWrite: false }));
    await gotoView(page, 'raci');
    eq(await page.locator('button.matrices-cell').count(), 0, 'celdas RACI no editables');
    eq(await page.getByRole('button', { name: 'Agregar rol' }).count(), 0, 'sin agregar rol');
    eq(await page.locator('.matrices-raci input, .matrices-raci textarea').count(), 0, 'sin campos editables');
    await gotoView(page, 'riesgos-matriz');
    eq(await page.locator('.matrices-risk-table select').count(), 0, 'sin selects de P/I');
    eq(await page.getByRole('button', { name: 'Agregar riesgo' }).count(), 0, 'sin agregar riesgo');
    await page.locator('[data-heat="a44"]').click();
    await page.getByText('Celda seleccionada').waitFor();
    await gotoView(page, 'interesados-matriz');
    eq(await page.locator('[data-pi-chart] g.matrices-dot.is-ro').count(), await page.locator('[data-pi-chart] g.matrices-dot').count(), 'puntos de solo lectura');
    await page.getByRole('tab', { name: /Evaluación del involucramiento/ }).click();
    eq(await page.locator('button.matrices-eng-cell').count(), 0, 'involucramiento no editable');
    await gotoView(page, 'calidad');
    eq(await page.locator('.matrices-cat input, .matrices-cat textarea, #mx-ish-effect').count(), 0, 'ishikawa no editable');
    await page.evaluate(() => PM.setState({ canWrite: true }));
  });

  await step('Sin errores de consola ni tarjetas de error', async () => {
    eq(await errorCards(page), [], 'tarjetas de error');
    eq(errors, [], 'errores de consola');
  });
} catch (e) {
  failures++; console.error('EXCEPCIÓN', e);
} finally {
  await browser.close();
}

/* ------------------------------------------------------------------ capturas: claro, oscuro y 400 px */
const VIEWS = ['raci', 'riesgos-matriz', 'interesados-matriz', 'calidad'];
for (const variant of [{ name: 'light' }, { name: 'dark', dark: true }, { name: 'mobile', width: 400, height: 860 }, { name: 'mobile-dark', width: 400, height: 860, dark: true }]) {
  const app = await openApp({ file, dark: !!variant.dark, width: variant.width || 1360, height: variant.height || 900 });
  try {
    const p2 = await createProject(app.page, { name: 'EJEMPLO · Andamio multidireccional Torre 2 — Edificio Altavista', code: 'PRY-2026-014' });
    await app.page.waitForTimeout(200);
    await seed(app.page, p2, { full: true });
    for (const v of VIEWS) {
      const tabs = v === 'calidad' ? ['ishikawa', 'pareto', 'control'] : v === 'interesados-matriz' ? ['poder', 'involucramiento'] : [null];
      for (const tab of tabs) {
        await step(`Captura ${variant.name} ${v}${tab ? ' / ' + tab : ''}: sin errores ni desborde`, async () => {
          if (tab) await app.page.evaluate(({ v, tab }) => PM.navigate(v, { tab }), { v, tab }); else await gotoView(app.page, v);
          await app.page.waitForTimeout(450);
          const ov = await horizontalOverflow(app.page);
          assert(ov <= 1, 'desborde horizontal de ' + ov + ' px');
          eq(await errorCards(app.page), [], 'tarjetas de error');
          if (v === 'riesgos-matriz') {
            const medio = await bgOf(app.page, '[data-heat="a23"]'), alto = await bgOf(app.page, '[data-heat="a34"]'), muy = await bgOf(app.page, '[data-heat="a45"]');
            assert(colorDist(medio, alto) > 30 && colorDist(alto, muy) > 30, 'tonos de nivel poco distinguibles: ' + [medio, alto, muy].join(' / '));
          }
          if (v === 'interesados-matriz' && tab === 'poder') eq(await ambiguousLabels(app.page), [], 'etiquetas ambiguas');
          if (tab === 'pareto') eq(await brokenParetoLabels(app.page), [], 'rótulos partidos a mitad de palabra');
          if (shots) await app.page.screenshot({ path: join(shots, `${v}${tab ? '-' + tab : ''}-${variant.name}.png`), fullPage: true });
        });
      }
    }
    await step(`Captura ${variant.name}: sin errores de consola`, async () => eq(app.errors, [], 'errores de consola'));
  } finally { await app.browser.close(); }
}

console.log('\n' + (failures ? failures + ' prueba(s) fallaron.' : 'Todas las pruebas pasaron (' + results.length + ').'));
process.exit(failures ? 1 : 0);

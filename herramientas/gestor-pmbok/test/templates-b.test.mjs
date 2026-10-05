// Regresiones del módulo 13-templates-b (plantillas de Costos a Interesados).
// Uso: node test/templates-b.test.mjs --file <ruta.html> [--shots dir]
//  1. Registro de riesgos: la columna «Coherencia de la estrategia» avisa cuando la estrategia no
//     corresponde al tipo (p. ej., «Mitigar» en una oportunidad), en la definición y en el editor.
//  2. Análisis cuantitativo: columnas de VME acumulado de amenazas y de oportunidades; en la última
//     fila del ejemplo dan los totales (−22,6 M y +6,0 M) y la reserva recomendada coincide.
//  3. Pistas de escala 1–5 que concuerdan con la columna (probabilidad «muy baja … muy alta»).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, createExample, errorCards } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const shots = opt('--shots');
if (shots) mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (cond, msg, extra) => { if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg + (extra !== undefined ? ' → ' + JSON.stringify(extra) : '')); } };
const step = (name) => console.log('\n# ' + name);
const shot = async (page, name) => { if (shots) await page.screenshot({ path: join(shots, name + '.png'), fullPage: true }); };

const { browser, page, errors } = await openApp({ file });

/* ---------------------------------------------------------------- 1–3. definiciones de las plantillas */
step('Definiciones de las plantillas');
const def = await page.evaluate(() => {
  const fieldOf = (tid, key) => PM.templates[tid].sections.flatMap((s) => s.fields).find((f) => f.key === key);
  const colOf = (tid, fk, ck) => (fieldOf(tid, fk).columns || []).find((c) => c.key === ck);
  const reg = fieldOf('registro-riesgos', 'riesgos');
  const fit = colOf('registro-riesgos', 'riesgos', 'coherenciaEstrategia');
  const fitOf = (tipo, estrategia) => (fit ? fit.calc({ tipo, estrategia }, []) : 'SIN COLUMNA');
  const exRows = PM.templates['registro-riesgos'].example.riesgos;
  const aq = fieldOf('analisis-cuantitativo', 'riesgos');
  const ex = PM.templates['analisis-cuantitativo'].example;
  const cA = colOf('analisis-cuantitativo', 'riesgos', 'vmeAmenazas');
  const cO = colOf('analisis-cuantitativo', 'riesgos', 'vmeOportunidades');
  const cV = colOf('analisis-cuantitativo', 'riesgos', 'vme');
  const last = ex.riesgos[ex.riesgos.length - 1];
  const sumVme = ex.riesgos.reduce((s, r) => s + (cV.calc(r, ex.riesgos) || 0), 0);
  const firstThreatRows = ex.riesgos.slice(0, 2);
  const hint = (tid, fk, ck) => (colOf(tid, fk, ck) || {}).hint || '';
  return {
    keys: reg.columns.map((c) => c.key),
    fitType: fit && fit.type,
    fitAlign: fit && fit.align,
    estrategiaOptions: colOf('registro-riesgos', 'riesgos', 'estrategia').options,
    estrategiaHint: hint('registro-riesgos', 'riesgos', 'estrategia'),
    cases: {
      oppMitigar: fitOf('Oportunidad', 'Mitigar'), oppEvitar: fitOf('Oportunidad', 'Evitar'), oppTransferir: fitOf('Oportunidad', 'Transferir'),
      amzExplotar: fitOf('Amenaza', 'Explotar'), amzCompartir: fitOf('Amenaza', 'Compartir'), amzMejorar: fitOf('Amenaza', 'Mejorar'),
      amzMitigar: fitOf('Amenaza', 'Mitigar'), oppMejorar: fitOf('Oportunidad', 'Mejorar'),
      oppEscalar: fitOf('Oportunidad', 'Escalar'), amzAceptar: fitOf('Amenaza', 'Aceptar'), oppAceptar: fitOf('Oportunidad', 'Aceptar'),
      sinTipo: fitOf('', 'Mitigar'), sinEstrategia: fitOf('Oportunidad', ''), minusculas: fitOf('oportunidad', 'mitigar'), ajena: fitOf('Amenaza', 'Ignorar'),
      fmtNull: fit ? fit.format(null) : null,
    },
    exampleFits: exRows.map((r) => r.id + ':' + (fit ? fit.calc(r, exRows) : '')),
    aqKeys: aq.columns.map((c) => c.key + ':' + c.type),
    totals: cA && cO ? { amenazas: cA.calc(last, ex.riesgos), oportunidades: cO.calc(last, ex.riesgos), sumVme } : null,
    firstOpp: cO ? cO.calc(firstThreatRows[1], ex.riesgos) : 'SIN COLUMNA',
    oppRowThreatCum: cA ? cA.calc(ex.riesgos[9], ex.riesgos) : 'SIN COLUMNA',
    emptyCum: cA ? cA.calc({ riesgo: 'x' }, [{ riesgo: 'x' }]) : 'SIN COLUMNA',
    reservaRecomendada: ex.reservaRecomendada,
    reservaHint: fieldOf('analisis-cuantitativo', 'reservaRecomendada').hint || '',
    hints: {
      probabilidad: hint('registro-riesgos', 'riesgos', 'probabilidad'),
      impacto: hint('registro-riesgos', 'riesgos', 'impacto'),
      influencia: hint('registro-interesados', 'interesados', 'influencia'),
      poder: hint('registro-interesados', 'interesados', 'poder'),
      tecnica: hint('evaluacion-desempeno-equipo', 'evaluaciones', 'tecnica'),
      comunicacion: hint('evaluacion-desempeno-equipo', 'evaluaciones', 'comunicacion'),
      calidadProveedor: hint('control-adquisiciones', 'seguimiento', 'calidad'),
    },
  };
});

const FIXED = ['id', 'descripcion', 'causa', 'efecto', 'categoria', 'tipo', 'probabilidad', 'impacto', 'puntuacion', 'propietario', 'estrategia', 'respuesta', 'disparador', 'reserva', 'estado'];
check(FIXED.every((k) => def.keys.includes(k)), 'registro-riesgos conserva las columnas fijas de SPEC §5');
check(def.fitType === 'calc' && def.fitAlign === 'left', 'columna calculada «Coherencia de la estrategia» (texto alineado a la izquierda)', [def.fitType, def.fitAlign]);
check(def.keys.indexOf('coherenciaEstrategia') === def.keys.indexOf('estrategia') + 1, 'la coherencia va junto a la estrategia');
check(JSON.stringify(def.estrategiaOptions) === JSON.stringify(['Escalar', 'Evitar', 'Transferir', 'Mitigar', 'Aceptar', 'Explotar', 'Compartir', 'Mejorar']), 'las opciones de estrategia siguen siendo las 8 de SPEC §5');
check(/Amenazas: escalar, evitar, transferir, mitigar o aceptar/.test(def.estrategiaHint) && /Oportunidades: escalar, explotar, compartir, mejorar o aceptar/.test(def.estrategiaHint), 'la pista de la estrategia lista las estrategias por tipo', def.estrategiaHint);
const c = def.cases;
check(c.oppMitigar === 'No aplica a oportunidades' && c.oppEvitar === 'No aplica a oportunidades' && c.oppTransferir === 'No aplica a oportunidades', 'evitar, transferir y mitigar no aplican a oportunidades', [c.oppMitigar, c.oppEvitar, c.oppTransferir]);
check(c.amzExplotar === 'No aplica a amenazas' && c.amzCompartir === 'No aplica a amenazas' && c.amzMejorar === 'No aplica a amenazas', 'explotar, compartir y mejorar no aplican a amenazas', [c.amzExplotar, c.amzCompartir, c.amzMejorar]);
check([c.amzMitigar, c.oppMejorar, c.oppEscalar, c.amzAceptar, c.oppAceptar].every((x) => x === 'Coherente'), 'combinaciones válidas (incluidas escalar y aceptar en ambos tipos) son coherentes', [c.amzMitigar, c.oppMejorar, c.oppEscalar, c.amzAceptar, c.oppAceptar]);
check(c.sinTipo === null && c.sinEstrategia === null && c.ajena === null && c.fmtNull === '—', 'sin tipo, sin estrategia o estrategia ajena al catálogo: sin dictamen («—»)', [c.sinTipo, c.sinEstrategia, c.ajena, c.fmtNull]);
check(c.minusculas === 'No aplica a oportunidades', 'tolera mayúsculas y minúsculas en datos antiguos', c.minusculas);
check(def.exampleFits.every((x) => x.endsWith(':Coherente')), 'todos los riesgos del ejemplo tienen una estrategia coherente', def.exampleFits.filter((x) => !x.endsWith(':Coherente')));

check(['vme:calc', 'vmeAmenazas:calc', 'vmeOportunidades:calc'].every((k) => def.aqKeys.includes(k)), 'análisis cuantitativo con columnas de VME acumulado de amenazas y de oportunidades', def.aqKeys);
check(def.aqKeys.indexOf('vmeAmenazas:calc') === def.aqKeys.indexOf('vme:calc') + 1, 'los acumulados van después del VME de la fila');
check(def.totals && def.totals.amenazas === -22600000 && def.totals.oportunidades === 6000000, 'la última fila del ejemplo da VME total de amenazas −22,6 M y de oportunidades +6,0 M', def.totals);
check(def.totals && def.totals.amenazas + def.totals.oportunidades === def.totals.sumVme, 'amenazas + oportunidades = suma del VME por fila (VME neto)', def.totals);
check(def.totals && Math.abs(def.totals.amenazas) === def.reservaRecomendada, 'la reserva recomendada del ejemplo coincide con el VME total de las amenazas', [def.totals && def.totals.amenazas, def.reservaRecomendada]);
check(def.firstOpp === null, 'el acumulado de oportunidades queda vacío mientras solo hay amenazas', def.firstOpp);
check(def.oppRowThreatCum === -22600000, 'en las filas de oportunidades el acumulado de amenazas conserva el total', def.oppRowThreatCum);
check(def.emptyCum === null, 'una fila sin probabilidad ni impacto no produce acumulado', def.emptyCum);
check(/VME total de las amenazas/.test(def.reservaHint), 'la reserva recomendada explica que se basa en el VME total de las amenazas', def.reservaHint);

const h = def.hints;
check(h.probabilidad === 'Escala de 1 (muy baja) a 5 (muy alta).', 'probabilidad: «muy baja … muy alta» (concuerda con la matriz)', h.probabilidad);
check(h.influencia === 'Escala de 1 (muy baja) a 5 (muy alta).', 'influencia: «muy baja … muy alta»', h.influencia);
check(h.impacto === 'Escala de 1 (muy bajo) a 5 (muy alto).' && h.poder === 'Escala de 1 (muy bajo) a 5 (muy alto).', 'impacto y poder: «muy bajo … muy alto»', [h.impacto, h.poder]);
check([h.tecnica, h.comunicacion, h.calidadProveedor].every((x) => /muy por debajo de lo esperado/.test(x) && /supera lo esperado/.test(x)), 'calificaciones de desempeño con la escala de lo esperado', [h.tecnica, h.comunicacion, h.calidadProveedor]);

/* ---------------------------------------------------------------- 1. editor del registro de riesgos */
step('Editor: registro de riesgos');
await createProject(page);
await page.waitForTimeout(400);
await page.evaluate(() => PM.openDocument('registro-riesgos'));
await page.waitForSelector('[data-field="riesgos"]', { timeout: 8000 });
const tbl = page.locator('[data-field="riesgos"]');
const headTitles = await tbl.locator('thead th').evaluateAll((ths) => ths.map((th) => [th.textContent.trim(), th.getAttribute('title') || '']));
const probHead = headTitles.find(([t]) => t.startsWith('Probabilidad'));
check(probHead && probHead[1] === 'Escala de 1 (muy baja) a 5 (muy alta).', 'el encabezado «Probabilidad (1–5)» muestra la pista «muy baja … muy alta»', probHead);
const fitIdx = headTitles.findIndex(([t]) => t === 'Coherencia de la estrategia');
check(fitIdx >= 0, 'el editor muestra la columna «Coherencia de la estrategia»');
await tbl.getByRole('button', { name: 'Agregar fila' }).click();
await page.waitForTimeout(200);
await tbl.locator('select[aria-label="Tipo — fila 1"]').selectOption('Oportunidad');
await tbl.locator('select[aria-label="Estrategia — fila 1"]').selectOption('Mitigar');
await page.waitForTimeout(200);
const fitCell = () => tbl.locator('tbody tr').first().locator('td').nth(fitIdx).innerText();
check((await fitCell()).trim() === 'No aplica a oportunidades', 'oportunidad + «Mitigar» → «No aplica a oportunidades»', await fitCell());
await shot(page, 'riesgos-coherencia');
await tbl.locator('select[aria-label="Estrategia — fila 1"]').selectOption('Mejorar');
await page.waitForTimeout(200);
check((await fitCell()).trim() === 'Coherente', 'oportunidad + «Mejorar» → «Coherente»', await fitCell());
await tbl.locator('select[aria-label="Tipo — fila 1"]').selectOption('Amenaza');
await page.waitForTimeout(200);
check((await fitCell()).trim() === 'No aplica a amenazas', 'amenaza + «Mejorar» → «No aplica a amenazas»', await fitCell());

/* ---------------------------------------------------------------- 2. análisis cuantitativo del proyecto de ejemplo */
step('Editor: análisis cuantitativo del ejemplo');
const pid = await createExample(page);
if (!pid) { check(false, 'el proyecto de ejemplo no está disponible en esta página'); }
else {
  await page.waitForTimeout(500);
  await page.evaluate(() => PM.openDocument('analisis-cuantitativo'));
  await page.waitForSelector('[data-field="riesgos"] tbody tr', { timeout: 8000 });
  const t2 = page.locator('[data-field="riesgos"]');
  const heads = await t2.locator('thead th').evaluateAll((ths) => ths.map((th) => th.textContent.trim()));
  const iA = heads.indexOf('VME acumulado de amenazas'), iO = heads.indexOf('VME acumulado de oportunidades');
  check(iA >= 0 && iO >= 0, 'el editor muestra las columnas de VME acumulado', heads);
  const lastRow = t2.locator('tbody tr').last();
  const got = [await lastRow.locator('td').nth(iA).innerText(), await lastRow.locator('td').nth(iO).innerText()].map((s) => s.trim());
  const want = await page.evaluate(() => [PM.fmt.money(-22600000, 'COP'), PM.fmt.money(6000000, 'COP')]);
  check(got[0] === want[0] && got[1] === want[1], 'la última fila muestra los totales de amenazas y oportunidades', { got, want });
  await t2.scrollIntoViewIfNeeded();
  await shot(page, 'vme-totales');
}

const cards = await errorCards(page);
check(!cards.length, 'sin tarjetas de error', cards);
check(!errors.length, 'sin errores de consola', errors);
await browser.close();
console.log(failures ? '\n' + failures + ' fallas' : '\nTodo en orden');
process.exit(failures ? 1 : 0);

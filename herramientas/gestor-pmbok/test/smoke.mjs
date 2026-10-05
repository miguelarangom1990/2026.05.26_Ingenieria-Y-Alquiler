// Prueba de humo: recorre todas las vistas registradas con un proyecto (de ejemplo si existe).
// Uso: node test/smoke.mjs [--file ruta.html] [--only a,b] [--shots dir] [--dark] [--mobile] [--blank]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openApp, createProject, createExample, gotoView, errorCards, horizontalOverflow, root } from './harness.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = opt('--only') ? opt('--only').split(',') : null;
const shots = opt('--shots');
const dark = args.includes('--dark');
const mobile = args.includes('--mobile');
const blank = args.includes('--blank');
const file = opt('--file') || 'gestor-pmbok.html';

const { browser, page, errors } = await openApp({ width: mobile ? 400 : 1360, height: mobile ? 860 : 900, dark, file });
let failed = false;
try {
  /* arranque: la primera pantalla (portafolio) aparece sin interacción */
  const boot = await page.evaluate(() => ({ host: document.querySelector('.view-host').innerText, foot: document.querySelector('.rail-foot').innerText, lang: document.documentElement.lang }));
  const bootOk = /Proyectos/.test(boot.host) && !/Conectando/.test(boot.host + boot.foot) && boot.lang === 'es-CO';
  if (!bootOk) failed = true;
  console.log(`${bootOk ? 'OK  ' : 'FAIL'} ${'arranque'.padEnd(18)} Portafolio visible al abrir${bootOk ? '' : '  ' + JSON.stringify(boot).slice(0, 200)}`);
  let pid = blank ? null : await createExample(page);
  if (!pid) pid = await createProject(page);
  await page.waitForTimeout(500);
  const views = await page.evaluate(() => PM.views.map((v) => ({ id: v.id, label: v.label })));
  if (shots) mkdirSync(shots, { recursive: true });
  for (const v of views) {
    if (only && !only.includes(v.id)) continue;
    const before = errors.length;
    await gotoView(page, v.id);
    await page.waitForTimeout(400);
    const cards = await errorCards(page);
    const ov = await horizontalOverflow(page);
    const newErr = errors.slice(before);
    const ok = !cards.length && !newErr.length && ov <= 1;
    if (!ok) failed = true;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${v.id.padEnd(18)} ${v.label}${ov > 1 ? `  [desborde horizontal ${ov}px]` : ''}`);
    for (const c of cards) console.log('     error-card: ' + c.replace(/\n/g, ' | '));
    for (const e of newErr) console.log('     ' + e.split('\n').slice(0, 4).join(' | '));
    if (shots) await page.screenshot({ path: join(shots, `${v.id}${dark ? '-dark' : ''}${mobile ? '-m' : ''}.png`), fullPage: true });
  }
} catch (e) {
  failed = true; console.error('EXCEPTION', e);
} finally {
  if (errors.length) { console.log('\nErrores totales: ' + errors.length); }
  await browser.close();
}
process.exit(failed ? 1 : 0);

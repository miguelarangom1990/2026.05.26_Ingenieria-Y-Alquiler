// Construye la página publicable: head + contenedor + librería (CDN) + módulos de src/ en orden.
// Uso:
//   node build.mjs                                  → gestor-pmbok.html con todos los módulos
//   node build.mjs --out /ruta/x.html --include 20,40   → núcleo (00–09, 99) + módulos con esos prefijos
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const outPath = opt('--out') ? resolve(opt('--out')) : join(root, 'gestor-pmbok.html');
const include = opt('--include') ? opt('--include').split(',').map((s) => s.trim()).filter(Boolean) : null;

const LIB = 'https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.umd.js';
const head = readFileSync(join(src, 'head.html'), 'utf8').trim();
const isCore = (f) => /^0\d-/.test(f) || /^99-/.test(f);
const modules = readdirSync(src).filter((f) => f.endsWith('.js')).sort().filter((f) => !include || isCore(f) || include.some((p) => f.startsWith(p)));
let out = head + '\n<div id="app"></div>\n';
out += `<script src="${LIB}"></script>\n`;
for (const f of modules) {
  const code = readFileSync(join(src, f), 'utf8');
  if (/<\/script/i.test(code)) throw new Error(`${f} contiene "</script" — escápalo como <\\/script`);
  out += `<script>\n${code}\n</script>\n`;
}
writeFileSync(outPath, out);
console.log(`${outPath}: ${modules.length} módulos, ${(out.length / 1024).toFixed(1)} KB`);
console.log(modules.join(', '));

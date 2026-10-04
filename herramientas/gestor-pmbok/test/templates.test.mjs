// Valida las plantillas registradas contra SPEC.md §5–§6.
// Uso: node test/templates.test.mjs --file <ruta.html> [--set a|b|all]
import { openApp } from './harness.mjs';
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || 'gestor-pmbok.html';
const set = opt('--set') || 'all';

const CATALOG = {
  a: ['caso-negocio','plan-gestion-beneficios','acta-constitucion','registro-supuestos','plan-direccion','plan-gestion-cambios','plan-gestion-configuracion','entregables','registro-incidentes','registro-lecciones','informe-desempeno','solicitud-cambio','registro-cambios','informe-final','acta-cierre','plan-gestion-alcance','plan-gestion-requisitos','documentacion-requisitos','matriz-trazabilidad','enunciado-alcance','acta-aceptacion-entregable','plan-gestion-cronograma','estimaciones-duracion'],
  b: ['plan-gestion-costos','estimacion-costos','requisitos-financiamiento','plan-gestion-calidad','metricas-calidad','documentos-prueba','informe-calidad','mediciones-control-calidad','plan-gestion-recursos','acta-constitucion-equipo','requisitos-recursos','estructura-desglose-recursos','asignaciones-recursos','evaluacion-desempeno-equipo','plan-gestion-comunicaciones','registro-comunicaciones','acta-reunion','plan-gestion-riesgos','registro-riesgos','informe-riesgos','analisis-cuantitativo','plan-gestion-adquisiciones','estrategia-adquisiciones','decisiones-hacer-comprar','enunciado-trabajo-adquisicion','criterios-seleccion-proveedores','registro-adquisiciones','control-adquisiciones','registro-interesados','plan-involucramiento-interesados'],
};
const MULTIPLE = ['informe-desempeno','solicitud-cambio','acta-aceptacion-entregable','informe-calidad','acta-reunion','enunciado-trabajo-adquisicion'];
const FIXED = {
  'registro-riesgos': ['riesgos', ['id','descripcion','causa','efecto','categoria','tipo','probabilidad','impacto','puntuacion','propietario','estrategia','respuesta','disparador','reserva','estado']],
  'registro-interesados': ['interesados', ['nombre','cargo','organizacion','rol','contacto','requisitos','expectativas','poder','interes','influencia','clasificacion','actitud','nivelActual','nivelDeseado']],
  'registro-cambios': ['cambios', ['id','fecha','solicitante','descripcion','tipo','impactoAlcance','impactoCronograma','impactoCosto','estado','fechaDecision','decisor']],
  'registro-incidentes': ['incidentes', ['id','fecha','descripcion','tipo','prioridad','responsable','fechaObjetivo','estado','solucion']],
  'registro-lecciones': ['lecciones', ['id','fecha','area','situacion','impacto','recomendacion','registradoPor']],
  'entregables': ['entregables', ['id','entregable','paqueteEdt','criterios','fechaPrevista','fechaEntrega','estado','aceptadoPor']],
  'mediciones-control-calidad': ['mediciones', ['fecha','entregable','metrica','resultado','conforme','causa','accion']],
  'registro-supuestos': ['supuestos', ['id','tipo','descripcion','categoria','responsable','fechaValidacion','estado']],
};
const ids = set === 'a' ? CATALOG.a : set === 'b' ? CATALOG.b : [...CATALOG.a, ...CATALOG.b];
const { browser, page, errors } = await openApp({ file });
const report = await page.evaluate(({ ids, MULTIPLE, FIXED }) => {
  const problems = []; const p = (id, msg) => problems.push(id + ': ' + msg);
  const AREAS = ['integracion','alcance','cronograma','costos','calidad','recursos','comunicaciones','riesgos','adquisiciones','interesados'];
  const GROUPS = ['inicio','planificacion','ejecucion','monitoreo','cierre'];
  const KINDS = ['acta','plan','registro','informe','documento','formato'];
  const FT = ['text','textarea','number','money','pct','date','select','list','table','check'];
  const CT = ['text','textarea','number','money','pct','date','select','calc','check'];
  let fieldCount = 0;
  for (const id of ids) {
    const t = PM.templates[id];
    if (!t) { p(id, 'NO REGISTRADA'); continue; }
    for (const k of ['name','abbr','area','group','process','kind','purpose']) if (!t[k]) p(id, 'falta ' + k);
    if (!AREAS.includes(t.area)) p(id, 'área inválida ' + t.area);
    if (!GROUPS.includes(t.group)) p(id, 'grupo inválido ' + t.group);
    if (!KINDS.includes(t.kind)) p(id, 'kind inválido ' + t.kind);
    if (!!t.multiple !== MULTIPLE.includes(id)) p(id, 'multiple debe ser ' + MULTIPLE.includes(id));
    if (!Array.isArray(t.tips) || t.tips.length < 2) p(id, 'tips: se esperan 2–4');
    if (!Array.isArray(t.sections) || !t.sections.length) { p(id, 'sin secciones'); continue; }
    const keys = new Map();
    for (const s of t.sections) {
      if (!s.id || !s.title) p(id, 'sección sin id/título');
      for (const f of s.fields || []) {
        fieldCount++;
        if (!f.key || !f.label) p(id, 'campo sin key/label en ' + s.title);
        if (keys.has(f.key)) p(id, 'key duplicada ' + f.key);
        keys.set(f.key, f);
        if (!FT.includes(f.type)) p(id, f.key + ': tipo inválido ' + f.type);
        if (f.type === 'select' && (!Array.isArray(f.options) || !f.options.length)) p(id, f.key + ': select sin options');
        if (f.type === 'table') {
          if (!Array.isArray(f.columns) || !f.columns.length) p(id, f.key + ': tabla sin columnas');
          const ck = new Set();
          for (const c of f.columns || []) {
            if (!c.key || !c.label) p(id, f.key + ': columna sin key/label');
            if (ck.has(c.key)) p(id, f.key + ': columna duplicada ' + c.key); ck.add(c.key);
            if (!CT.includes(c.type)) p(id, f.key + '.' + c.key + ': tipo inválido ' + c.type);
            if (c.type === 'select' && (!Array.isArray(c.options) || !c.options.length)) p(id, f.key + '.' + c.key + ': select sin options');
            if (c.type === 'calc' && typeof c.calc !== 'function') p(id, f.key + '.' + c.key + ': calc sin función');
          }
        }
      }
    }
    if (FIXED[id]) {
      const [fk, cols] = FIXED[id]; const f = keys.get(fk);
      if (!f || f.type !== 'table') p(id, 'falta tabla fija ' + fk);
      else { const have = f.columns.map((c) => c.key); for (const c of cols) if (!have.includes(c)) p(id, fk + ': falta columna ' + c); }
    }
    if (!t.example || typeof t.example !== 'object') { p(id, 'sin example'); continue; }
    for (const [k, v] of Object.entries(t.example)) {
      const f = keys.get(k);
      if (!f) { p(id, 'example: clave desconocida ' + k); continue; }
      if (f.type === 'table') {
        if (!Array.isArray(v)) { p(id, 'example.' + k + ' debe ser arreglo'); continue; }
        v.forEach((row, i) => {
          if (!row.id) p(id, 'example.' + k + '[' + i + '] sin id');
          for (const rk of Object.keys(row)) if (rk !== 'id' && !f.columns.find((c) => c.key === rk)) p(id, 'example.' + k + '[' + i + ']: columna desconocida ' + rk);
          for (const c of f.columns) {
            if (c.type === 'calc') { try { c.calc(row, v); } catch (e) { p(id, 'calc ' + c.key + ' falla: ' + e.message); } }
            if (c.type === 'select' && row[c.key] !== undefined && row[c.key] !== '' && !c.options.map((o) => String(typeof o === 'object' ? o.value : o)).includes(String(row[c.key]))) p(id, 'example.' + k + '[' + i + '].' + c.key + ' valor fuera de options: ' + row[c.key]);
            if ((c.type === 'number' || c.type === 'money' || c.type === 'pct') && row[c.key] !== undefined && row[c.key] !== null && typeof row[c.key] !== 'number') p(id, 'example.' + k + '[' + i + '].' + c.key + ' debe ser número');
            if (c.type === 'date' && row[c.key] && !PM.date.valid(row[c.key])) p(id, 'example.' + k + '[' + i + '].' + c.key + ' fecha inválida');
          }
        });
      } else if (f.type === 'list') { if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) p(id, 'example.' + k + ' debe ser arreglo de cadenas'); }
      else if (f.type === 'number' || f.type === 'money' || f.type === 'pct') { if (typeof v !== 'number') p(id, 'example.' + k + ' debe ser número'); }
      else if (f.type === 'date') { if (!PM.date.valid(v)) p(id, 'example.' + k + ' fecha inválida'); }
      else if (f.type === 'check') { if (typeof v !== 'boolean') p(id, 'example.' + k + ' debe ser booleano'); }
      else if (f.type === 'select') { if (!f.options.map((o) => String(typeof o === 'object' ? o.value : o)).includes(String(v))) p(id, 'example.' + k + ' fuera de options: ' + v); }
      else if (typeof v !== 'string') p(id, 'example.' + k + ' debe ser texto');
    }
    const filled = Object.keys(t.example).length;
    if (filled < Math.min(4, keys.size)) p(id, 'example muy incompleto (' + filled + '/' + keys.size + ' campos)');
  }
  const extra = Object.keys(PM.templates).filter((k) => !ids.includes(k));
  return { problems, count: ids.filter((i) => PM.templates[i]).length, fieldCount, extra };
}, { ids, MULTIPLE, FIXED });
await browser.close();
for (const x of report.problems) console.log('FAIL ' + x);
if (errors.length) { console.log(errors.join('\n')); }
console.log(`\nPlantillas: ${report.count}/${ids.length} registradas · ${report.fieldCount} campos · ${report.problems.length} problemas${report.extra.length ? ' · fuera del conjunto: ' + report.extra.join(', ') : ''}`);
process.exit(report.problems.length || errors.length ? 1 : 0);

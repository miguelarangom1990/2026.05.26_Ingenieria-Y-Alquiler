/* ==========================================================================
   99-boot.js — arranque: restaura proyecto/vista recordados y monta la app.
   ========================================================================== */
(function () {
  'use strict';
  const PM = window.PM;
  /* idioma de la página (lectores de pantalla, traducción automática y separación silábica) */
  try { document.documentElement.lang = 'es-CO'; } catch (e) { /* ignore */ }
  if (!PM || PM.failed || !PM.lib) return;
  const hashView = location.hash.slice(1);
  const savedView = PM.prefs.get('view', 'portafolio');
  const view = (hashView && PM.getView(hashView) && hashView) || (PM.getView(savedView) && savedView) || 'portafolio';
  PM.setState({ projectId: PM.prefs.get('projectId', null), view, params: {} });
  PM.boot();
  PM.lib.render(PM.html`<${PM.App} />`, document.getElementById('app'));
})();

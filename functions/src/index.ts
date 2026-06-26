/**
 * Cloud Functions — Integración de SOLO LECTURA con Siigo Nube.
 *
 * Flujo: Siigo API (GET) → Cloud Functions → caché en Firestore → app (lectura).
 * Ninguna función crea, edita o elimina información en Siigo.
 */
export { manualSiigoSync } from './functions/manualSync.js';
export { scheduledSiigoSync } from './functions/scheduledSync.js';

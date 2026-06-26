import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { SIIGO_SECRETS, FUNCTIONS_REGION } from '../lib/config.js';
import { runSync } from '../siigo/sync.js';

/**
 * Sincronización automática incremental cada 6 horas (zona horaria de Colombia).
 * Extrae toda la contabilización de Siigo hacia la caché de Firestore (solo lectura).
 */
export const scheduledSiigoSync = onSchedule(
  {
    schedule: 'every 6 hours',
    timeZone: 'America/Bogota',
    secrets: SIIGO_SECRETS,
    region: FUNCTIONS_REGION,
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    logger.info('Iniciando sincronización programada con Siigo.');
    const results = await runSync({});
    const failed = results.filter((r) => r.status === 'error');
    if (failed.length) {
      logger.warn('Sincronización programada con errores parciales:', failed);
    } else {
      logger.info('Sincronización programada completada con éxito.');
    }
  }
);

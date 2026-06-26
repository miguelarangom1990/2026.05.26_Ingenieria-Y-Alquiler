import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db } from '../lib/firestore.js';
import { SIIGO_SECRETS, FUNCTIONS_REGION, SUPER_ADMIN_EMAIL } from '../lib/config.js';
import { runSync } from '../siigo/sync.js';

const SYNC_PERMISSION = 'SINCRONIZAR_SIIGO';

/** Replica la lógica de `hasPermission` del cliente del lado servidor. */
async function isAuthorized(uid: string, email?: string): Promise<boolean> {
  if (email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;

  const userSnap = await db.collection('users').doc(uid).get();
  const roleId = userSnap.exists ? (userSnap.data()?.roleId as string | undefined) : undefined;
  if (!roleId) return false;

  const roleSnap = await db.collection('roles').doc(roleId).get();
  const permissions = roleSnap.exists ? (roleSnap.data()?.permissions as string[] | undefined) : undefined;
  return Array.isArray(permissions) && permissions.includes(SYNC_PERMISSION);
}

/**
 * Dispara una sincronización manual con Siigo. Es de SOLO LECTURA: extrae datos
 * de Siigo hacia la caché de Firestore; nunca modifica información en Siigo.
 */
export const manualSiigoSync = onCall(
  { secrets: SIIGO_SECRETS, region: FUNCTIONS_REGION, timeoutSeconds: 540, memory: '512MiB' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }

    const { uid, token } = request.auth;
    const authorized = await isAuthorized(uid, token?.email);
    if (!authorized) {
      throw new HttpsError('permission-denied', 'No tienes permiso para sincronizar con Siigo.');
    }

    const resources = Array.isArray(request.data?.resources) ? request.data.resources : undefined;
    const fullBackfill = request.data?.fullBackfill === true;

    logger.info(`Sync manual de Siigo solicitada por ${token?.email || uid}`, { resources, fullBackfill });

    const results = await runSync({ resources, fullBackfill });
    const failed = results.filter((r) => r.status === 'error');

    return {
      status: failed.length ? 'partial' : 'ok',
      perResource: results,
      syncedAt: new Date().toISOString(),
    };
  }
);

import { defineSecret } from 'firebase-functions/params';

/**
 * Credenciales de la API de Siigo. Se almacenan en Google Secret Manager
 * (`firebase functions:secrets:set ...`) y NUNCA en el bundle del cliente ni
 * en el repositorio.
 */
export const SIIGO_USERNAME = defineSecret('SIIGO_USERNAME');
export const SIIGO_ACCESS_KEY = defineSecret('SIIGO_ACCESS_KEY');
export const SIIGO_PARTNER_ID = defineSecret('SIIGO_PARTNER_ID');

/** Lista de secretos a adjuntar en cada función que llama a Siigo. */
export const SIIGO_SECRETS = [SIIGO_USERNAME, SIIGO_ACCESS_KEY, SIIGO_PARTNER_ID];

/**
 * Base de datos de Firestore CON NOMBRE que usa la aplicación.
 * El Admin SDK apunta por defecto a "(default)"; si no la fijamos explícitamente
 * las escrituras irían a la base equivocada y nunca aparecerían en la app.
 */
export const FIRESTORE_DATABASE_ID = 'ai-studio-fe7d4ea6-addc-4881-af9f-3f42ed025019';

/** Región donde se despliegan las funciones (debe coincidir con el cliente). */
export const FUNCTIONS_REGION = 'us-central1';

/** Correo del super-administrador (mismo criterio que `hasPermission` en el cliente). */
export const SUPER_ADMIN_EMAIL = 'recepcionfacturas@ingenieriayalquiler.com';

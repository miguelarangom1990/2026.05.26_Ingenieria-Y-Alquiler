import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from './config.js';

if (getApps().length === 0) {
  initializeApp();
}

/**
 * Instancia de Firestore apuntando a la base de datos CON NOMBRE de la app.
 * Toda escritura del backend pasa por aquí; es el único lugar que puede mutar
 * las colecciones `siigo_*` (el Admin SDK ignora las reglas de seguridad).
 */
export const db = getFirestore(FIRESTORE_DATABASE_ID);

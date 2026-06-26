import { logger } from 'firebase-functions/v2';
import { db } from '../lib/firestore.js';
import { SIIGO_USERNAME, SIIGO_ACCESS_KEY, SIIGO_PARTNER_ID } from '../lib/config.js';
import type { SiigoAuthResponse, SiigoListResponse, SiigoRecord } from './siigoTypes.js';

const AUTH_URL = 'https://api.siigo.com/auth';
const API_BASE = 'https://api.siigo.com/v1';
const TOKEN_SKEW_MS = 5 * 60 * 1000; // refrescar 5 min antes de expirar
const PAGE_SIZE = 100; // máximo permitido por Siigo
const INTER_PAGE_DELAY_MS = 350; // pausa entre páginas para respetar rate limits
const MAX_RETRIES = 5;

const AUTH_STATE_DOC = db.collection('siigo_sync_state').doc('auth');

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

// Caché en memoria por instancia "caliente" de la función.
let memoryToken: CachedToken | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Cliente de SOLO LECTURA para la API de Siigo Nube.
 *
 * Garantías de no-modificación:
 *  - `request()` solo acepta el verbo GET (whitelist). Cualquier otro método lanza error.
 *  - El único POST que se realiza es contra `/auth`, que NO altera datos contables;
 *    sirve exclusivamente para obtener el token JWT.
 *  - No existe ningún método create/update/delete hacia recursos de Siigo.
 */
export class SiigoClient {
  private partnerId: string;
  private username: string;
  private accessKey: string;

  constructor() {
    this.username = SIIGO_USERNAME.value();
    this.accessKey = SIIGO_ACCESS_KEY.value();
    this.partnerId = SIIGO_PARTNER_ID.value();
  }

  /** Devuelve un token válido, reusando el caché en memoria o el persistido. */
  private async getToken(): Promise<string> {
    const now = Date.now();

    if (memoryToken && memoryToken.expiresAt - TOKEN_SKEW_MS > now) {
      return memoryToken.token;
    }

    // Intentar reusar el token persistido (cold start dentro de las 24h).
    try {
      const snap = await AUTH_STATE_DOC.get();
      if (snap.exists) {
        const data = snap.data() as CachedToken | undefined;
        if (data?.token && data.expiresAt - TOKEN_SKEW_MS > now) {
          memoryToken = { token: data.token, expiresAt: data.expiresAt };
          return data.token;
        }
      }
    } catch (err) {
      logger.warn('No se pudo leer el token persistido de Siigo:', err);
    }

    return this.authenticate();
  }

  /** Autentica contra Siigo y cachea el token (memoria + Firestore). */
  private async authenticate(): Promise<string> {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, access_key: this.accessKey }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Fallo de autenticación con Siigo (${res.status}): ${text}`);
    }

    const data = (await res.json()) as SiigoAuthResponse;
    if (!data.access_token) {
      throw new Error('La respuesta de autenticación de Siigo no contiene access_token.');
    }

    // El token de Siigo dura 24h; usamos expires_in si viene, si no asumimos 24h.
    const ttlMs = (data.expires_in ? data.expires_in : 24 * 60 * 60) * 1000;
    const cached: CachedToken = { token: data.access_token, expiresAt: Date.now() + ttlMs };
    memoryToken = cached;

    await AUTH_STATE_DOC.set(
      { ...cached, refreshedAt: new Date().toISOString() },
      { merge: true }
    );

    logger.info('Token de Siigo renovado.');
    return cached.token;
  }

  /**
   * Realiza una petición GET a la API de Siigo. SOLO se permite GET.
   * Maneja 401 (re-autentica una vez) y 429/5xx (backoff exponencial).
   */
  private async request<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
    method: 'GET' = 'GET'
  ): Promise<T> {
    if (method !== 'GET') {
      // Salvaguarda explícita: la integración es de solo lectura.
      throw new Error(`Método ${method} no permitido: la integración con Siigo es de solo lectura.`);
    }

    const url = new URL(`${API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }

    let attempt = 0;
    let reauthed = false;

    while (true) {
      const token = await this.getToken();
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Partner-Id': this.partnerId,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        return (await res.json()) as T;
      }

      // Token expirado/ inválido: re-autenticar una sola vez y reintentar.
      if (res.status === 401 && !reauthed) {
        reauthed = true;
        memoryToken = null;
        await this.authenticate();
        continue;
      }

      // Rate limit o error transitorio del servidor: backoff exponencial.
      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * 2 ** attempt, 30000);
        attempt++;
        logger.warn(`Siigo ${res.status} en ${path}; reintento ${attempt}/${MAX_RETRIES} en ${backoff}ms`);
        await sleep(backoff);
        continue;
      }

      const text = await res.text().catch(() => '');
      throw new Error(`Error en GET ${path} (${res.status}): ${text}`);
    }
  }

  /**
   * Recorre todas las páginas de un recurso de Siigo (generador asíncrono).
   * Itera page=1..N con page_size=100 hasta agotar resultados.
   */
  async *paginate<T extends SiigoRecord>(
    path: string,
    filters: Record<string, string | number | undefined> = {}
  ): AsyncGenerator<T[], void, unknown> {
    let page = 1;
    while (true) {
      const data = await this.request<SiigoListResponse<T>>(path, {
        ...filters,
        page,
        page_size: PAGE_SIZE,
      });

      const results = data.results ?? [];
      if (results.length === 0) return;

      yield results;

      const total = data.pagination?.total_results;
      if (results.length < PAGE_SIZE) return;
      if (typeof total === 'number' && page * PAGE_SIZE >= total) return;

      page++;
      await sleep(INTER_PAGE_DELAY_MS);
    }
  }

  /** GET de un recurso sin paginación (catálogos pequeños). */
  async getAll<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    return this.request<T>(path, params);
  }
}

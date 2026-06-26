import { logger } from 'firebase-functions/v2';
import { db } from '../lib/firestore.js';
import { SiigoClient } from './siigoClient.js';
import {
  mapInvoice,
  mapPurchase,
  mapVoucher,
  mapJournal,
  mapCustomer,
  mapProduct,
} from './mappers.js';
import type { SiigoRecord } from './siigoTypes.js';

const BATCH_LIMIT = 400; // Firestore permite 500 ops/batch; dejamos margen.

interface ResourceDef {
  key: string;
  path: string;
  collection: string;
  map: (rec: any) => { id: string; _updated?: string };
  /** Si true, soporta filtro incremental `updated_start`. */
  incremental: boolean;
}

export const RESOURCES: ResourceDef[] = [
  { key: 'invoices', path: '/invoices', collection: 'siigo_invoices', map: mapInvoice, incremental: true },
  { key: 'purchases', path: '/purchases', collection: 'siigo_purchases', map: mapPurchase, incremental: true },
  { key: 'vouchers', path: '/vouchers', collection: 'siigo_vouchers', map: mapVoucher, incremental: true },
  { key: 'journals', path: '/journals', collection: 'siigo_journals', map: mapJournal, incremental: true },
  { key: 'customers', path: '/customers', collection: 'siigo_customers', map: mapCustomer, incremental: true },
  { key: 'products', path: '/products', collection: 'siigo_products', map: mapProduct, incremental: true },
];

/** Catálogos pequeños sin filtro de fecha: se reescriben completos en un doc por tipo. */
export const CATALOGS: { key: string; path: string }[] = [
  { key: 'account-groups', path: '/account-groups' },
  { key: 'taxes', path: '/taxes' },
  { key: 'payment-types', path: '/payment-types' },
  { key: 'cost-centers', path: '/cost-centers' },
  { key: 'document-types', path: '/document-types?type=FV' },
  { key: 'users', path: '/users' },
];

export interface ResourceSyncResult {
  key: string;
  status: 'ok' | 'error';
  recordsProcessed: number;
  error?: string;
}

const syncStateDoc = (key: string) => db.collection('siigo_sync_state').doc(key);

/** Sincroniza un recurso paginado con upserts idempotentes (doc id = id de Siigo). */
async function syncResource(
  client: SiigoClient,
  resource: ResourceDef,
  fullBackfill: boolean
): Promise<ResourceSyncResult> {
  const stateRef = syncStateDoc(resource.key);
  let processed = 0;
  let maxCursor: string | undefined;

  try {
    await stateRef.set({ lastRunStatus: 'running', lastRunAt: new Date().toISOString() }, { merge: true });

    const filters: Record<string, string | undefined> = {};
    if (resource.incremental && !fullBackfill) {
      const snap = await stateRef.get();
      const cursor = snap.exists ? (snap.data()?.lastUpdatedCursor as string | undefined) : undefined;
      if (cursor) filters.updated_start = cursor;
    }

    let batch = db.batch();
    let batchCount = 0;

    const collectionRef = db.collection(resource.collection);
    const syncedAt = new Date().toISOString();

    for await (const page of client.paginate<SiigoRecord>(resource.path, filters)) {
      for (const rec of page) {
        const mapped = resource.map(rec);
        if (!mapped.id || mapped.id === 'undefined') continue;

        batch.set(collectionRef.doc(mapped.id), { ...mapped, syncedAt }, { merge: true });
        batchCount++;
        processed++;

        if (mapped._updated && (!maxCursor || mapped._updated > maxCursor)) {
          maxCursor = mapped._updated;
        }

        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) await batch.commit();

    await stateRef.set(
      {
        lastRunStatus: 'ok',
        lastRunAt: new Date().toISOString(),
        recordsProcessed: processed,
        // Solo avanzamos el cursor si vimos registros más recientes.
        ...(maxCursor ? { lastUpdatedCursor: maxCursor } : {}),
        error: null,
      },
      { merge: true }
    );

    logger.info(`Sync ${resource.key}: ${processed} registros procesados.`);
    return { key: resource.key, status: 'ok', recordsProcessed: processed };
  } catch (err: any) {
    const message = err?.message || String(err);
    logger.error(`Error sincronizando ${resource.key}:`, message);
    await stateRef.set(
      { lastRunStatus: 'error', lastRunAt: new Date().toISOString(), error: message },
      { merge: true }
    );
    return { key: resource.key, status: 'error', recordsProcessed: processed, error: message };
  }
}

/** Reescribe los catálogos (un documento por tipo en siigo_catalogs). */
async function syncCatalog(
  client: SiigoClient,
  catalog: { key: string; path: string }
): Promise<ResourceSyncResult> {
  try {
    const data = await client.getAll<any>(catalog.path);
    const items = Array.isArray(data) ? data : data?.results ?? [];
    await db.collection('siigo_catalogs').doc(catalog.key).set({
      id: catalog.key,
      items,
      syncedAt: new Date().toISOString(),
    });
    return { key: `catalog:${catalog.key}`, status: 'ok', recordsProcessed: items.length };
  } catch (err: any) {
    const message = err?.message || String(err);
    logger.error(`Error sincronizando catálogo ${catalog.key}:`, message);
    return { key: `catalog:${catalog.key}`, status: 'error', recordsProcessed: 0, error: message };
  }
}

export interface RunSyncOptions {
  resources?: string[];
  fullBackfill?: boolean;
  includeCatalogs?: boolean;
}

/** Ejecuta la sincronización de todos (o un subconjunto) de los recursos. */
export async function runSync(options: RunSyncOptions = {}): Promise<ResourceSyncResult[]> {
  const client = new SiigoClient();
  const { resources, fullBackfill = false, includeCatalogs = true } = options;

  const selected = resources && resources.length
    ? RESOURCES.filter((r) => resources.includes(r.key))
    : RESOURCES;

  const results: ResourceSyncResult[] = [];

  // Un recurso a la vez para no saturar el rate limit de Siigo.
  for (const resource of selected) {
    results.push(await syncResource(client, resource, fullBackfill));
  }

  if (includeCatalogs && (!resources || resources.includes('catalogs'))) {
    for (const catalog of CATALOGS) {
      results.push(await syncCatalog(client, catalog));
    }
  }

  return results;
}

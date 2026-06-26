import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';
import { subscribeToCollection } from './firebaseService';
import type {
  SiigoInvoice,
  SiigoPurchase,
  SiigoVoucher,
  SiigoJournal,
  SiigoCustomer,
  SiigoProduct,
  SiigoCatalog,
  SiigoSyncState,
} from '../types';

// ---------------------------------------------------------------------------
// Suscripciones en tiempo real a la caché de Siigo (SOLO LECTURA).
// Reutilizan el mismo patrón `subscribeToCollection` del resto de la app.
// ---------------------------------------------------------------------------
export const subscribeSiigoInvoices = (cb: (data: SiigoInvoice[]) => void) =>
  subscribeToCollection('siigo_invoices', (d) => cb(d as SiigoInvoice[]));

export const subscribeSiigoPurchases = (cb: (data: SiigoPurchase[]) => void) =>
  subscribeToCollection('siigo_purchases', (d) => cb(d as SiigoPurchase[]));

export const subscribeSiigoVouchers = (cb: (data: SiigoVoucher[]) => void) =>
  subscribeToCollection('siigo_vouchers', (d) => cb(d as SiigoVoucher[]));

export const subscribeSiigoJournals = (cb: (data: SiigoJournal[]) => void) =>
  subscribeToCollection('siigo_journals', (d) => cb(d as SiigoJournal[]));

export const subscribeSiigoCustomers = (cb: (data: SiigoCustomer[]) => void) =>
  subscribeToCollection('siigo_customers', (d) => cb(d as SiigoCustomer[]));

export const subscribeSiigoProducts = (cb: (data: SiigoProduct[]) => void) =>
  subscribeToCollection('siigo_products', (d) => cb(d as SiigoProduct[]));

export const subscribeSiigoCatalogs = (cb: (data: SiigoCatalog[]) => void) =>
  subscribeToCollection('siigo_catalogs', (d) => cb(d as SiigoCatalog[]));

export const subscribeSiigoSyncState = (cb: (data: SiigoSyncState[]) => void) =>
  subscribeToCollection('siigo_sync_state', (d) => cb(d as SiigoSyncState[]));

// ---------------------------------------------------------------------------
// Disparo de sincronización manual (Cloud Function callable).
// ---------------------------------------------------------------------------
export interface ManualSyncResult {
  status: 'ok' | 'partial';
  perResource: { key: string; status: 'ok' | 'error'; recordsProcessed: number; error?: string }[];
  syncedAt: string;
}

export const triggerManualSync = async (
  resources?: string[],
  fullBackfill = false
): Promise<ManualSyncResult> => {
  const callable = httpsCallable<{ resources?: string[]; fullBackfill?: boolean }, ManualSyncResult>(
    functions,
    'manualSiigoSync'
  );
  const res = await callable({ resources, fullBackfill });
  return res.data;
};

// ---------------------------------------------------------------------------
// Helpers de agregación para el constructor de informes (lado cliente).
// ---------------------------------------------------------------------------
export type Metric = 'total' | 'count' | 'taxes' | 'balance';
export type Dimension = 'month' | 'customer' | 'costCenter' | 'documentType';

export interface DateRange {
  start?: string; // 'YYYY-MM-DD'
  end?: string;
}

/** Convierte una fecha ISO/RFC3339 a 'YYYY-MM' en zona horaria de Colombia (UTC-5). */
export const toMonthKey = (iso?: string): string => {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  // Colombia es UTC-5 fijo (sin horario de verano).
  const bogota = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return `${bogota.getUTCFullYear()}-${String(bogota.getUTCMonth() + 1).padStart(2, '0')}`;
};

const inRange = (date: string | undefined, range?: DateRange): boolean => {
  if (!range || (!range.start && !range.end)) return true;
  if (!date) return false;
  const day = date.slice(0, 10);
  if (range.start && day < range.start) return false;
  if (range.end && day > range.end) return false;
  return true;
};

export interface InvoiceFilters extends DateRange {
  customerId?: string;
  documentType?: string;
  costCenter?: string;
}

export const filterInvoices = (invoices: SiigoInvoice[], filters: InvoiceFilters): SiigoInvoice[] =>
  invoices.filter((inv) => {
    if (!inRange(inv.date, filters)) return false;
    if (filters.customerId && inv.customerId !== filters.customerId) return false;
    if (filters.documentType && inv.documentType !== filters.documentType) return false;
    if (filters.costCenter && inv.costCenter !== filters.costCenter) return false;
    return true;
  });

const metricValue = (inv: SiigoInvoice, metric: Metric): number => {
  switch (metric) {
    case 'count': return 1;
    case 'taxes': return inv.taxes ?? 0;
    case 'balance': return inv.balance ?? 0;
    case 'total':
    default: return inv.total ?? 0;
  }
};

const dimensionKey = (inv: SiigoInvoice, dimension: Dimension): string => {
  switch (dimension) {
    case 'customer': return inv.customerName || inv.customerId || 'Sin cliente';
    case 'costCenter': return inv.costCenter || 'Sin centro';
    case 'documentType': return inv.documentType || 'Sin tipo';
    case 'month':
    default: return toMonthKey(inv.date);
  }
};

export interface ReportRow {
  key: string;
  value: number;
}

/** Agrega facturas por la dimensión y métrica elegidas → series listas para Recharts. */
export const buildReport = (
  invoices: SiigoInvoice[],
  dimension: Dimension,
  metric: Metric
): ReportRow[] => {
  const map = new Map<string, number>();
  for (const inv of invoices) {
    const key = dimensionKey(inv, dimension);
    map.set(key, (map.get(key) ?? 0) + metricValue(inv, metric));
  }
  const rows = Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  // Por mes ordenamos cronológicamente; en el resto, de mayor a menor valor.
  if (dimension === 'month') rows.sort((a, b) => a.key.localeCompare(b.key));
  else rows.sort((a, b) => b.value - a.value);
  return rows;
};

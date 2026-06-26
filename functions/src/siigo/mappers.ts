import type { SiigoRecord } from './siigoTypes.js';

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown): string | undefined => (v == null ? undefined : String(v));

/** Timestamp de última actualización usado como cursor incremental. */
export const lastUpdated = (rec: SiigoRecord): string | undefined =>
  rec.metadata?.last_updated || rec.metadata?.created || (rec.date as string | undefined);

const customerName = (c: any): string | undefined => {
  if (!c) return undefined;
  if (Array.isArray(c.name)) return c.name.filter(Boolean).join(' ');
  return c.name || c.commercial_name || c.identification;
};

const sumItemTaxes = (items: any[]): number =>
  (items || []).reduce((acc, it) => {
    const taxes = (it?.taxes || []).reduce((t: number, tax: any) => t + num(tax?.value), 0);
    return acc + taxes;
  }, 0);

export const mapInvoice = (rec: any) => ({
  id: String(rec.id),
  date: str(rec.date),
  number: str(rec.number ?? rec.name),
  customerId: str(rec.customer?.identification),
  customerName: customerName(rec.customer),
  documentType: str(rec.document?.id),
  costCenter: str(rec.cost_center),
  total: num(rec.total),
  taxes: sumItemTaxes(rec.items),
  balance: num(rec.balance),
  items: (rec.items || []).map((it: any) => ({
    code: str(it.code),
    description: str(it.description),
    quantity: num(it.quantity),
    price: num(it.price),
    total: num(it.total),
  })),
  _updated: lastUpdated(rec),
  raw: rec,
});

export const mapPurchase = (rec: any) => ({
  id: String(rec.id),
  date: str(rec.date),
  number: str(rec.number ?? rec.name),
  supplierId: str(rec.supplier?.identification ?? rec.provider?.identification),
  supplierName: customerName(rec.supplier ?? rec.provider),
  documentType: str(rec.document?.id),
  costCenter: str(rec.cost_center),
  total: num(rec.total),
  taxes: sumItemTaxes(rec.items),
  _updated: lastUpdated(rec),
  raw: rec,
});

export const mapVoucher = (rec: any) => ({
  id: String(rec.id),
  date: str(rec.date),
  customerId: str(rec.customer?.identification),
  customerName: customerName(rec.customer),
  type: str(rec.type),
  value: num(rec.value ?? rec.total),
  _updated: lastUpdated(rec),
  raw: rec,
});

export const mapJournal = (rec: any) => ({
  id: String(rec.id),
  date: str(rec.date),
  documentType: str(rec.document?.id),
  costCenter: str(rec.cost_center),
  debit: num(rec.debit ?? rec.total_debit),
  credit: num(rec.credit ?? rec.total_credit),
  items: (rec.items || []).map((it: any) => ({
    account: str(it.account?.code ?? it.account),
    debit: num(it.debit),
    credit: num(it.credit),
    costCenter: str(it.cost_center),
  })),
  _updated: lastUpdated(rec),
  raw: rec,
});

export const mapCustomer = (rec: any) => ({
  id: String(rec.id),
  identification: str(rec.identification),
  name: customerName(rec) || String(rec.identification ?? rec.id),
  branchOffice: str(rec.branch_office),
  active: rec.active !== false,
  _updated: lastUpdated(rec),
  raw: rec,
});

export const mapProduct = (rec: any) => ({
  id: String(rec.id),
  code: str(rec.code),
  name: str(rec.name) || String(rec.code ?? rec.id),
  price: num(rec.prices?.[0]?.price_list?.[0]?.value ?? rec.price),
  _updated: lastUpdated(rec),
  raw: rec,
});

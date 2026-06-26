import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Calculator, RefreshCw, Loader2, Download, FileSpreadsheet, Receipt,
  Wallet, Percent, Sparkles, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Can } from '../components/Can';
import {
  subscribeSiigoInvoices, subscribeSiigoCustomers, subscribeSiigoCatalogs,
  subscribeSiigoSyncState, triggerManualSync, filterInvoices, buildReport,
  type Dimension, type Metric, type InvoiceFilters,
} from '../services/siigoService';
import { getAccountingInsights } from '../services/geminiService';
import type { SiigoInvoice, SiigoCustomer, SiigoCatalog, SiigoSyncState } from '../types';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'customer', label: 'Cliente' },
  { value: 'costCenter', label: 'Centro de costo' },
  { value: 'documentType', label: 'Tipo de documento' },
];

const METRICS: { value: Metric; label: string }[] = [
  { value: 'total', label: 'Total ventas' },
  { value: 'count', label: 'Nº de facturas' },
  { value: 'taxes', label: 'Impuestos' },
  { value: 'balance', label: 'Saldo (cartera)' },
];

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string; tint: string }> = ({ icon, label, value, tint }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tint}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900 truncate" title={value}>{value}</p>
    </div>
  </div>
);

const SiigoReportsView: React.FC = () => {
  const { currentUser } = useAuth();

  const [invoices, setInvoices] = useState<SiigoInvoice[]>([]);
  const [customers, setCustomers] = useState<SiigoCustomer[]>([]);
  const [catalogs, setCatalogs] = useState<SiigoCatalog[]>([]);
  const [syncState, setSyncState] = useState<SiigoSyncState[]>([]);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [dimension, setDimension] = useState<Dimension>('month');
  const [metric, setMetric] = useState<Metric>('total');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsubs = [
      subscribeSiigoInvoices(setInvoices),
      subscribeSiigoCustomers(setCustomers),
      subscribeSiigoCatalogs(setCatalogs),
      subscribeSiigoSyncState(setSyncState),
    ];
    return () => unsubs.forEach((u) => u());
  }, [currentUser]);

  const filtered = useMemo(() => filterInvoices(invoices, filters), [invoices, filters]);
  const report = useMemo(() => buildReport(filtered, dimension, metric), [filtered, dimension, metric]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((a, i) => a + (i.total || 0), 0);
    const taxes = filtered.reduce((a, i) => a + (i.taxes || 0), 0);
    const balance = filtered.reduce((a, i) => a + (i.balance || 0), 0);
    return { total, taxes, balance, count: filtered.length };
  }, [filtered]);

  // Fuentes de filtros derivadas de la caché.
  const costCenters = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.costCenter).filter(Boolean))) as string[],
    [invoices]
  );
  const documentTypes = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.documentType).filter(Boolean))) as string[],
    [invoices]
  );

  const invoicesState = syncState.find((s) => s.id === 'invoices');
  const lastSync = invoicesState?.lastRunAt
    ? new Date(invoicesState.lastRunAt).toLocaleString('es-CO')
    : 'Nunca';
  const anyError = syncState.find((s) => s.lastRunStatus === 'error');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await triggerManualSync();
      const totalRecords = res.perResource.reduce((a, r) => a + r.recordsProcessed, 0);
      const failed = res.perResource.filter((r) => r.status === 'error');
      setSyncMsg(
        failed.length
          ? `Sincronización parcial: ${totalRecords} registros. Errores en: ${failed.map((f) => f.key).join(', ')}`
          : `Sincronización completada: ${totalRecords} registros procesados.`
      );
    } catch (e: any) {
      setSyncMsg(`Error: ${e?.message || 'No se pudo sincronizar.'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const rows = filtered.map((i) => ({
      Factura: i.number || i.id,
      Fecha: i.date?.slice(0, 10) || '',
      Cliente: i.customerName || i.customerId || '',
      'Tipo Doc': i.documentType || '',
      'Centro Costo': i.costCenter || '',
      Total: i.total || 0,
      Impuestos: i.taxes || 0,
      Saldo: i.balance || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
    XLSX.writeFile(wb, `informe_siigo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleAiSummary = async () => {
    setAiLoading(true);
    setAiSummary(null);
    try {
      const top = report.slice(0, 8).map((r) => `${r.key}: ${Math.round(r.value)}`).join('; ');
      const summary = `Ventas totales: ${formatCOP(kpis.total)}. Nº facturas: ${kpis.count}. Cartera (saldo): ${formatCOP(kpis.balance)}. Impuestos: ${formatCOP(kpis.taxes)}. Desglose por ${dimension}: ${top}.`;
      setAiSummary(await getAccountingInsights(summary));
    } finally {
      setAiLoading(false);
    }
  };

  const metricLabel = METRICS.find((m) => m.value === metric)?.label || '';
  const isCurrency = metric !== 'count';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2 md:p-4">
      {/* Cabecera + sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="text-amber-500" size={28} />
            Contabilidad — Siigo
          </h1>
          <p className="text-slate-500 text-sm">
            Informes a partir de la contabilización extraída de Siigo Nube (solo lectura). Última sincronización: <strong>{lastSync}</strong>
          </p>
        </div>
        <Can permission="SINCRONIZAR_SIIGO">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        </Can>
      </div>

      {syncMsg && <div className="text-sm px-4 py-3 rounded-xl bg-slate-100 text-slate-700">{syncMsg}</div>}
      {anyError && (
        <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} /> Última sincronización con errores en <strong>{anyError.id}</strong>: {anyError.error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Receipt size={22} className="text-amber-600" />} tint="bg-amber-50" label="Ventas (filtrado)" value={formatCOP(kpis.total)} />
        <KpiCard icon={<FileSpreadsheet size={22} className="text-blue-600" />} tint="bg-blue-50" label="Nº de facturas" value={String(kpis.count)} />
        <KpiCard icon={<Wallet size={22} className="text-emerald-600" />} tint="bg-emerald-50" label="Cartera (saldo)" value={formatCOP(kpis.balance)} />
        <KpiCard icon={<Percent size={22} className="text-violet-600" />} tint="bg-violet-50" label="Impuestos" value={formatCOP(kpis.taxes)} />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Desde
          <input type="date" value={filters.start || ''} onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value || undefined }))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Hasta
          <input type="date" value={filters.end || ''} onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value || undefined }))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Cliente
          <select value={filters.customerId || ''} onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value || undefined }))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
            <option value="">Todos</option>
            {customers.map((c) => <option key={c.id} value={c.identification}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Tipo de documento
          <select value={filters.documentType || ''} onChange={(e) => setFilters((f) => ({ ...f, documentType: e.target.value || undefined }))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
            <option value="">Todos</option>
            {documentTypes.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Centro de costo
          <select value={filters.costCenter || ''} onChange={(e) => setFilters((f) => ({ ...f, costCenter: e.target.value || undefined }))}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
            <option value="">Todos</option>
            {costCenters.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {/* Constructor de informe */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Agrupar por
              <select value={dimension} onChange={(e) => setDimension(e.target.value as Dimension)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
                {DIMENSIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Métrica
              <select value={metric} onChange={(e) => setMetric(e.target.value as Metric)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
                {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Gráfico
              <select value={chartType} onChange={(e) => setChartType(e.target.value as any)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700">
                <option value="bar">Barras</option>
                <option value="line">Líneas</option>
                <option value="pie">Torta</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAiSummary} disabled={aiLoading || !filtered.length}
              className="flex items-center gap-2 px-3 py-2 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 text-violet-700 rounded-lg text-sm font-semibold transition-colors">
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Resumen IA
            </button>
            <button onClick={handleExport} disabled={!filtered.length}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 rounded-lg text-sm font-semibold transition-colors">
              <Download size={16} /> Exportar Excel
            </button>
          </div>
        </div>

        {report.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No hay datos para mostrar. Ajusta los filtros o ejecuta una sincronización.
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => (isCurrency ? formatCOP(v) : v)} />
                  <Bar dataKey="value" name={metricLabel} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={report}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => (isCurrency ? formatCOP(v) : v)} />
                  <Line type="monotone" dataKey="value" name={metricLabel} stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie data={report.slice(0, 8)} dataKey="value" nameKey="key" cx="50%" cy="50%" outerRadius={110} label>
                    {report.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => (isCurrency ? formatCOP(v) : v)} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {aiSummary && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-violet-800 font-bold text-sm mb-2"><Sparkles size={16} /> Resumen ejecutivo (IA)</h3>
          <p className="text-sm text-violet-900 whitespace-pre-line leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Tabla de detalle */}
      {report.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">{DIMENSIONS.find((d) => d.value === dimension)?.label}</th>
                <th className="text-right px-5 py-3 font-semibold">{metricLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {report.map((r) => (
                <tr key={r.key} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-slate-700">{r.key}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-slate-900">
                    {isCurrency ? formatCOP(r.value) : r.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SiigoReportsView;

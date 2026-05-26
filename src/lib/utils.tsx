import React from 'react';
import { Truck, ClipboardCheck, Wrench } from 'lucide-react';
import { Order, LineItem, MaintenanceItem } from '../types';

export const cleanInput = (val: string) => {
  if (typeof val !== 'string') return val;
  return val.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
};

export const trimInput = (val: string) => {
  if (typeof val !== 'string') return val;
  return val.normalize('NFD').replace(/[\u0300-\u036f]/g, "").trim().replace(/\s{2,}/g, ' ');
};

export const getCustomAcronyms = (): string[] => {
  try {
    const stored = localStorage.getItem('custom_acronyms');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomAcronyms = (list: string[]) => {
  localStorage.setItem('custom_acronyms', JSON.stringify(list));
};

export const formatTitleCase = (val: string) => {
  if (typeof val !== 'string' || !val) return val;
  const standardAcronyms = ['ERP', 'IVA', 'NIT', 'RFQ', 'PO', 'ID', 'SSO', 'UT', 'UVT', 'EPS', 'ARL', 'AFP', 'CRM', 'API', 'UI', 'UX', 'HR', 'IT', 'R&D', 'CEO', 'CTO', 'COO', 'CFO', 'CMO', 'NIT', 'DNI'];
  const customAcronyms = getCustomAcronyms();
  const allAcronyms = [...standardAcronyms, ...customAcronyms];
  
  return val
    .split(' ')
    .map(word => {
      if (!word) return '';
      const upper = word.toUpperCase();
      // Use case-insensitive check for acronyms
      if (allAcronyms.some(a => a.toUpperCase() === upper) || (word.length <= 2 && word === upper)) {
        return upper;
      }
      // If it's 3 letters and all uppercase, it's likely an acronym
      if (word.length <= 3 && word === upper) {
        return upper;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export const getStatusBadge = (order: Order) => {
  const verifiedCount = (order.items || []).filter(i => i.proveedor).length;
  const totalCount = (order.items || []).length;

  switch (order.status) {
    case 'SIN_CONFIRMAR':
      if (verifiedCount === totalCount) {
        return <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Listo para confirmar</span>;
      }
      if (verifiedCount > 0) {
        return <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">Faltan proveedores ({verifiedCount}/{totalCount})</span>;
      }
      return <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">Falta proveedor</span>;
    case 'CONFIRMADO':
      return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Confirmado</span>;
    case 'EN_LOGISTICA': {
      const hasLogisticsInfo = order.logisticsInfo && 
        order.logisticsInfo.transportista && 
        order.logisticsInfo.tipoVehiculo && 
        order.logisticsInfo.cobroTransporte &&
        order.logisticsInfo.razonTransporte;
        
      if (!hasLogisticsInfo) {
        return <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">Faltan datos logísticos</span>;
      }
      return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">En Logística</span>;
    }
    case 'EN_TRANSPORTE': {
      const hasProviders = order.items && order.items.length > 0;
      const hasMissingTransportInfo = hasProviders && (!order.transportInfo || 
        order.items.some(item => {
          const provider = item.proveedor || "Sin Proveedor";
          const data = order.transportInfo?.providerData?.[provider];
          const hasRmDv = order.transportInfo?.providerRmDvAttachments?.[provider]?.length;
          return !data?.fechaCobroSub || !data?.numAlterno || !data?.fechaTransporteSub || !hasRmDv;
        }));

      if (hasMissingTransportInfo) {
        return <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">Faltan datos transporte</span>;
      }
      return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><Truck className="w-3 h-3" /> Datos completos</span>;
    }
    case 'REVISION_DOCUMENTOS':
      return <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> Revisión Doc.</span>;
    case 'MANTENIMIENTO':
      return <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1"><Wrench className="w-3 h-3" /> Mantenimiento</span>;
  }
};

export const generateOrderTitle = (items: LineItem[]) => {
  if (items.length === 0) return 'Nueva Solicitud';
  if (items.length === 1) {
    return (items[0].equipo || 'Equipo').slice(0, 40);
  }
  if (items.length <= 3) {
    return items.map(i => (i.equipo || 'Equipo').slice(0, 10)).join(', ');
  }
  return `${items.slice(0, 3).map(i => (i.equipo || 'Equipo').slice(0, 10)).join(', ')}, + ${items.length - 3} Art`;
};

export const generateMaintenanceTitle = (items: MaintenanceItem[], cliente?: string) => {
  if (items.length === 0) return cliente || 'Mantenimiento Interno';
  if (items.length === 1) {
    return (items[0].equipo || 'Equipo').slice(0, 40);
  }
  if (items.length <= 3) {
    return items.map(i => (i.equipo || 'Equipo').slice(0, 10)).join(', ');
  }
  return `${items.slice(0, 3).map(i => (i.equipo || 'Equipo').slice(0, 10)).join(', ')}, + ${items.length - 3} Art`;
};

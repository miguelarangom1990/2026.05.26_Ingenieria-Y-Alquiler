import React from 'react';
import { Truck, CheckCircle2, History, ClipboardCheck, Wrench, MapPin, Building2, Package, Trash2, FileText } from 'lucide-react';
import { Order } from '../types';
import { getStatusBadge } from '../lib/utils';
import { MiniStepIndicator } from './StepIndicators';

interface DashboardCardProps {
  key?: React.Key;
  order: Order;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onStartMaintenance: (order: Order) => void;
}

export const DashboardCard = ({ order, onViewOrder, onDeleteOrder, onStartMaintenance }: DashboardCardProps) => {
  return (
    <div 
      onClick={() => onViewOrder(order)}
      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95"
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-col">
          <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
            {order.nombre || order.destino || <span className="text-red-500 font-bold">Sin definir</span>}
          </h4>
          {order.nombre && <span className="text-[9px] text-slate-400">{order.destino || <span className="text-red-500 font-bold">Sin definir</span>}</span>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 font-mono">#{order.id?.slice(0, 4)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteOrder(order.id);
            }}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar Solicitud"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1 min-w-0">
          <div className="mb-0.5">
            {getStatusBadge(order)}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Building2 className="w-2.5 h-2.5" />
            <span className="truncate">{order.cliente}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Package className="w-2.5 h-2.5" />
            <span>
              {order.status === 'MANTENIMIENTO' && order.items.length === 0 
                ? order.maintenanceInfo?.items.length || 0 
                : order.items.length} equipos
            </span>
          </div>
        </div>
        <div className="shrink-0 pt-0.5 w-[70px] border-l border-slate-100 pl-2">
          <MiniStepIndicator order={order} />
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] text-slate-400">{order.fecha}</span>
        <div className="flex gap-1 items-center">
          {order.status === 'MANTENIMIENTO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartMaintenance(order);
              }}
              className="p-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
              title="Gestionar Mantenimiento"
            >
              <Wrench className="w-3 h-3" />
            </button>
          )}
          <div className="flex gap-0.5">
            {order.status === 'SIN_CONFIRMAR' && <CheckCircle2 className="w-3 h-3 text-slate-300" />}
            {order.status === 'CONFIRMADO' && <MapPin className="w-3 h-3 text-amber-500" />}
            {order.status === 'EN_LOGISTICA' && <ClipboardCheck className="w-3 h-3 text-emerald-500" />}
            {order.status === 'EN_TRANSPORTE' && <Truck className="w-3 h-3 text-blue-500" />}
            {order.status === 'REVISION_DOCUMENTOS' && <FileText className="w-3 h-3 text-purple-500" />}
            {order.status === 'MANTENIMIENTO' && <Wrench className="w-3 h-3 text-orange-500" />}
          </div>
        </div>
      </div>
    </div>
  );
};

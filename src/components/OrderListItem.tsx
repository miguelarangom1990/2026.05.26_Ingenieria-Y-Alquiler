import React from 'react';
import { Truck, CheckCircle2, History, ClipboardCheck, Wrench, ChevronDown, ChevronUp, MapPin, Building2, Calendar, Trash2, FileText } from 'lucide-react';
import { Order } from '../types';
import { getStatusBadge } from '../lib/utils';
import { HeaderStepIndicator } from './StepIndicators';

interface OrderListItemProps {
  key?: React.Key;
  order: Order;
  isExpanded: boolean;
  onToggleExpansion: (id: string, e: React.MouseEvent) => void;
  onViewOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onStartMaintenance: (order: Order) => void;
}

export const OrderListItem = ({ order, isExpanded, onToggleExpansion, onViewOrder, onDeleteOrder, onStartMaintenance }: OrderListItemProps) => {
  return (
    <div 
      id={`order-${order.id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
    >
      <div 
        onClick={() => onViewOrder(order)}
        className="p-5 grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_120px] items-center cursor-pointer hover:bg-slate-50 transition-colors gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            order.status === 'SIN_CONFIRMAR' ? 'bg-slate-50 text-slate-400' :
            order.status === 'CONFIRMADO' ? 'bg-amber-50 text-amber-600' :
            order.status === 'EN_LOGISTICA' ? 'bg-emerald-50 text-emerald-600' :
            order.status === 'EN_TRANSPORTE' ? 'bg-blue-50 text-blue-600' :
            order.status === 'REVISION_DOCUMENTOS' ? 'bg-purple-50 text-purple-600' :
            'bg-orange-50 text-orange-600'
          }`}>
            {order.status === 'EN_TRANSPORTE' ? <Truck className="w-5 h-5" /> : 
             order.status === 'EN_LOGISTICA' ? <MapPin className="w-5 h-5" /> : 
             order.status === 'MANTENIMIENTO' ? <Wrench className="w-5 h-5" /> :
             <Truck className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{order.nombre || order.destino || <span className="text-red-500 font-bold">Sin definir</span>}</h3>
              {getStatusBadge(order)}
            </div>
            {order.nombre && <p className="text-[10px] text-slate-400">{order.destino || <span className="text-red-500 font-bold">Sin definir</span>}</p>}
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 overflow-hidden">
              <span className="flex items-center gap-1 truncate">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{order.cliente}</span>
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                {order.fecha}
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex justify-center">
          <HeaderStepIndicator order={order} />
        </div>
        
        <div className="flex items-center justify-end gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Equipos</p>
            <p className="font-semibold text-slate-700">
              {order.status === 'MANTENIMIENTO' && order.items.length === 0 
                ? order.maintenanceInfo?.items.length || 0 
                : order.items.length}
            </p>
          </div>
          {order.status === 'MANTENIMIENTO' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartMaintenance(order);
              }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
              title="Gestionar Mantenimiento"
            >
              <Wrench className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteOrder(order.id);
            }}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Eliminar Solicitud"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => onToggleExpansion(order.id, e)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title={isExpanded ? "Ocultar equipos" : "Ver equipos"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 shrink-0" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {order.status === 'MANTENIMIENTO' && order.items.length === 0 ? (
              order.maintenanceInfo?.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {item.cantidad}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate" title={item.equipo}>{item.equipo}</p>
                    <p className="text-xs text-slate-500 truncate" title={item.proveedorMantenimiento || 'Sin Proveedor'}>
                      {item.proveedorMantenimiento || 'Sin Proveedor'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              order.items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {item.cantidad}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate" title={item.equipo}>{item.equipo}</p>
                    <p className="text-xs text-slate-500 truncate" title={item.proveedor || 'Sin Proveedor'}>
                      {item.proveedor || 'Sin Proveedor'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

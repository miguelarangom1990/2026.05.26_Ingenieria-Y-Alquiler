import React from 'react';
import { Truck, CheckCircle2, History, ClipboardCheck, Wrench, ChevronDown, ChevronUp, MapPin, Building2, Calendar } from 'lucide-react';
import { Order } from '../types';
import { getStatusBadge } from '../lib/utils';
import { MiniStepIndicator } from './StepIndicators';

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpansion: (id: string, e: React.MouseEvent) => void;
  onViewOrder: (order: Order) => void;
}

export const OrderCard = ({ order, isExpanded, onToggleExpansion, onViewOrder }: OrderCardProps) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
      onClick={() => onViewOrder(order)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                #{order.id?.slice(0, 8)}
              </span>
              {order.nombre && (
                <span className="text-sm font-bold text-slate-800">{order.nombre}</span>
              )}
              {getStatusBadge(order)}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              {order.cliente}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {order.destino || <span className="text-red-500 font-bold">Sin definir</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {order.fecha}
              </span>
            </div>
          </div>
          <button 
            onClick={(e) => onToggleExpansion(order.id, e)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        <MiniStepIndicator order={order} />

        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="pt-4 border-t border-slate-100">
              {order.status === 'MANTENIMIENTO' && order.items.length === 0 ? (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Equipos en Mantenimiento ({order.maintenanceInfo?.items.length || 0})</p>
                  <div className="space-y-2">
                    {order.maintenanceInfo?.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg">
                        <span className="font-medium text-slate-700">{item.equipo}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">Cant: {item.cantidad}</span>
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> {item.proveedorMantenimiento}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Equipos ({order.items.length})</p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg">
                        <span className="font-medium text-slate-700">{item.equipo}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">Cant: {item.cantidad}</span>
                          {item.proveedor ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {item.proveedor}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <History className="w-3 h-3" /> Sin Proveedor
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

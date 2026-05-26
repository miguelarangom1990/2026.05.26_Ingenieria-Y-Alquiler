import React from 'react';
import { History, LogOut, Truck, PackagePlus, CheckCircle2, XCircle, Building2, User, Package, Calendar, ChevronLeft, ChevronRight, Trash2, ChevronUp, ChevronDown, Wrench } from 'lucide-react';
import { Order, MaintenanceCard } from '../../types';
import { HeaderStepIndicator } from '../StepIndicators';

interface OrdersListViewProps {
  processedData: { groups: { key: string; label: string; items: Order[] }[] };
  maintenanceCards: MaintenanceCard[];
  setViewingOrder: (order: Order | null) => void;
  handleDeleteOrder: (id: string) => void;
  handleMoveStageBackward: (order: Order, e?: React.MouseEvent) => void;
  handleMoveStageForward: (order: Order, e?: React.MouseEvent) => void;
  getStatusBadge: (order: Order) => React.ReactNode;
  toggleOrderExpansion: (id: string, e?: React.MouseEvent) => void;
  expandedOrders: Set<string>;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  processedData,
  maintenanceCards,
  setViewingOrder,
  handleDeleteOrder,
  handleMoveStageBackward,
  handleMoveStageForward,
  getStatusBadge,
  toggleOrderExpansion,
  expandedOrders
}) => {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-8 no-scrollbar pr-1">
      {processedData.groups.map((group) => (
        <div key={group.key} className="space-y-4">
          {group.label && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-1 bg-slate-100 rounded-full">
                {group.label}
              </h3>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
          )}
          <div className="space-y-4">
            {group.items.map((order) => (
              <div 
                key={order.id} 
                id={`order-${order.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div 
                  onClick={() => setViewingOrder(order)}
                  className="p-5 grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_120px] items-center cursor-pointer hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      order.status === 'PEDIDO' ? 'bg-slate-50 text-slate-400' :
                      order.status === 'EN_LOGISTICA' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'EN_TRANSPORTE' ? 'bg-blue-50 text-blue-600' :
                      order.status === 'FINALIZADO' ? 'bg-purple-50 text-purple-600' :
                      order.status === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-600' :
                      order.status === 'CANCELADO' ? 'bg-red-50 text-red-600' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {order.status === 'EN_TRANSPORTE' ? <Truck className="w-5 h-5" /> : 
                       order.status === 'EN_LOGISTICA' ? <LogOut className="w-5 h-5" /> : 
                       order.status === 'FINALIZADO' ? <PackagePlus className="w-5 h-5" /> :
                       order.status === 'COMPLETADO' ? <CheckCircle2 className="w-5 h-5" /> :
                       order.status === 'CANCELADO' ? <XCircle className="w-5 h-5" /> :
                       <History className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {order.nombre || order.destino || <span className="text-red-500 font-bold">Sin definir</span>}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">#{order.id?.slice(0, 8)}</span>
                        {getStatusBadge(order)}
                        {(() => {
                          const linkedCardsCount = maintenanceCards.filter(card => card.orderId === order.id).length;
                          if (linkedCardsCount > 0) {
                            return (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm" title="Tiene mantenimiento asociado">
                                <Wrench className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Inspección {linkedCardsCount > 1 ? `(${linkedCardsCount})` : ''}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 overflow-hidden">
                        <span className="flex items-center gap-1 truncate" title={order.destino}>
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{order.destino || <span className="text-red-500 font-bold">Sin definir</span>}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate" title={order.cliente}>
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{order.cliente || <span className="text-slate-400 italic">Sin cliente</span>}</span>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Package className="w-3.5 h-3.5" />
                          {order.items.length} equipos
                        </span>
                        {order.tipoTransporte && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Truck className="w-3.5 h-3.5" />
                            <span className="uppercase">{order.tipoTransporte}</span>
                          </span>
                        )}
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
                    <div className="flex items-center gap-1 mr-2">
                      {order.status !== 'PEDIDO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveStageBackward(order, e); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Etapa Anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {order.status !== 'FINALIZADO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveStageForward(order, e); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Siguiente Etapa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Equipos</p>
                      <p className="font-semibold text-slate-700">{order.items.length}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOrder(order.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar Solicitud"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => toggleOrderExpansion(order.id, e)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title={expandedOrders.has(order.id) ? "Ocultar equipos" : "Ver equipos"}
                    >
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="w-5 h-5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
                
                {expandedOrders.has(order.id) && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.map((item) => (
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

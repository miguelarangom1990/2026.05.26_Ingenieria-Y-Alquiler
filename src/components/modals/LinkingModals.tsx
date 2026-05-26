import React from 'react';
import { X, ClipboardCheck, CheckCircle2, FileText, Search } from 'lucide-react';
import { MaintenanceCard, Order } from '../../types';

interface LinkingModalsProps {
  linkingOrderToMaintenance: string | null;
  setLinkingOrderToMaintenance: (id: string | null) => void;
  maintenanceCards: MaintenanceCard[];
  updateMaintenanceField: (cardId: string, field: keyof MaintenanceCard, value: any) => void;
  setConfirmDialog: (config: any) => void;
  
  linkingMaintenanceToOrder: string | null;
  setLinkingMaintenanceToOrder: (id: string | null) => void;
  history: Order[];
  editingMaintenanceCard: MaintenanceCard | null;
  setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
  updateMaintenanceCard: (card: MaintenanceCard) => void;
  generateMaintenanceTitle: (items: any[], cliente: string) => string;
  linkOrderSearchQuery: string;
  setLinkOrderSearchQuery: (query: string) => void;
}

export const LinkingModals: React.FC<LinkingModalsProps> = ({
  linkingOrderToMaintenance,
  setLinkingOrderToMaintenance,
  maintenanceCards,
  updateMaintenanceField,
  setConfirmDialog,
  
  linkingMaintenanceToOrder,
  setLinkingMaintenanceToOrder,
  history,
  editingMaintenanceCard,
  setEditingMaintenanceCard,
  updateMaintenanceCard,
  generateMaintenanceTitle,
  linkOrderSearchQuery,
  setLinkOrderSearchQuery,
}) => {
  return (
    <>
      {/* Modal for Linking Maintenance */}
      {linkingOrderToMaintenance && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                Vincular Mantenimiento Existente
              </h2>
              <button
                onClick={() => setLinkingOrderToMaintenance(null)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div className="space-y-3">
                {maintenanceCards.map(card => {
                  const isAlreadyLinkedToThis = card.orderId === linkingOrderToMaintenance;
                  return (
                    <div key={card.id} className={`flex items-center justify-between p-4 rounded-xl border ${isAlreadyLinkedToThis ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-indigo-200 bg-white'} transition-all`}>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-700 text-sm">Inspección #{card.id?.slice(0, 8)}</span>
                        <span className="text-xs text-slate-600 font-medium">Cliente: {card.cliente || 'Interno'}</span>
                        <span className="text-xs text-slate-600">Equipos: {card.items.map(i => i.equipo).join(', ').slice(0, 40)}{card.items.map(i => i.equipo).join(', ').length > 40 ? '...' : ''}</span>
                        <span className="text-xs text-slate-500 mt-1">Fecha Ingreso Taller: {card.fechaIngreso} • {card.items.length} Tipos de Equipo • {card.status.replace(/_/g, ' ')}</span>
                        {card.orderId && !isAlreadyLinkedToThis && (
                          <span className="text-xs text-amber-600 font-medium">Vinculado a: #{card.orderId?.slice(0, 8)} (Se reemplazará)</span>
                        )}
                        {isAlreadyLinkedToThis && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ya vinculado a este pedido</span>
                        )}
                      </div>
                      {!isAlreadyLinkedToThis && (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              message: card.orderId ? `Esta inspección ya está vinculada al pedido #${card.orderId?.slice(0, 8)}. ¿Desea reasignarla a este pedido?` : `¿Desea vincular esta inspección al pedido actual?`,
                              onConfirm: () => {
                                updateMaintenanceField(card.id, 'orderId', linkingOrderToMaintenance);
                                setLinkingOrderToMaintenance(null);
                              }
                            });
                          }}
                          className="shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-sm font-bold transition-colors"
                        >
                          Vincular
                        </button>
                      )}
                    </div>
                  );
                })}
                {maintenanceCards.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm italic">
                    No hay mantenimientos disponibles.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Linking Order */}
      {linkingMaintenanceToOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Vincular a Pedido Existente
              </h2>
              <button
                onClick={() => {
                  setLinkingMaintenanceToOrder(null);
                  setLinkOrderSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre o RM / DV Cliente..."
                  value={linkOrderSearchQuery}
                  onChange={(e) => setLinkOrderSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div className="space-y-3">
                {history.filter(order => {
                  if (!linkOrderSearchQuery.trim()) return true;
                  const query = linkOrderSearchQuery.toLowerCase().trim();
                  const idMatch = order.id.toLowerCase().includes(query);
                  const rmDvMatch = (order.logisticsInfo?.rmDvCliente || '').toLowerCase().includes(query);
                  const nameMatch = (order.nombre || '').toLowerCase().includes(query);
                  return idMatch || rmDvMatch || nameMatch;
                }).map(order => {
                  const isAlreadyLinkedThis = order.id === editingMaintenanceCard?.orderId;
                  return (
                    <div key={order.id} className={`flex items-center justify-between p-4 rounded-xl border flex-col sm:flex-row gap-4 ${isAlreadyLinkedThis ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-indigo-200 bg-white'} transition-all`}>
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-bold text-slate-700 text-sm">{order.nombre || `Pedido #${order.id?.slice(0, 8)}`} <span className="text-[10px] text-slate-400 font-mono font-normal ml-1">#{order.id?.slice(0, 8)}</span></span>
                        <span className="text-xs text-slate-600 font-medium">Cliente: {order.cliente || 'Desconocido'}</span>
                        <span className="text-xs text-slate-600">Obra/Destino: {order.destino || 'Sin destino'}</span>
                        {order.logisticsInfo?.rmDvCliente && (
                          <span className="text-xs text-slate-600 font-medium text-emerald-600">
                            RM/DV: {order.logisticsInfo.rmDvCliente}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 italic mt-1">{order.fecha} • {order.items.length} Equipos • Status: {order.status}</span>
                        {isAlreadyLinkedThis && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3"/> Este es el pedido actual</span>
                        )}
                      </div>
                      {!isAlreadyLinkedThis && (
                        <div className="shrink-0 w-full sm:w-auto flex justify-end">
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                message: `¿Desea vincular esta inspección al pedido #${order.id?.slice(0, 8)}?`,
                                onConfirm: () => {
                                  const cardToUpdate = maintenanceCards.find(c => c.id === linkingMaintenanceToOrder);
                                  if (cardToUpdate) {
                                    const updatedCard = { ...cardToUpdate, orderId: order.id, cliente: order.cliente, obra: order.destino, nombre: cardToUpdate.isManualTitle ? cardToUpdate.nombre : generateMaintenanceTitle(cardToUpdate.items, order.cliente) };
                                    updateMaintenanceCard(updatedCard);
                                  }
                                  
                                  if (editingMaintenanceCard && editingMaintenanceCard.id === linkingMaintenanceToOrder) {
                                     setEditingMaintenanceCard({ ...editingMaintenanceCard, orderId: order.id, cliente: order.cliente, obra: order.destino, nombre: editingMaintenanceCard.isManualTitle ? editingMaintenanceCard.nombre : generateMaintenanceTitle(editingMaintenanceCard.items, order.cliente) });
                                  }
                                  
                                  setLinkingMaintenanceToOrder(null);
                                }
                              });
                            }}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-sm font-bold transition-colors w-full sm:w-auto"
                          >
                            Seleccionar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {history.filter(order => {
                  if (!linkOrderSearchQuery.trim()) return true;
                  const query = linkOrderSearchQuery.toLowerCase().trim();
                  const idMatch = order.id.toLowerCase().includes(query);
                  const rmDvMatch = (order.logisticsInfo?.rmDvCliente || '').toLowerCase().includes(query);
                  const nameMatch = (order.nombre || '').toLowerCase().includes(query);
                  return idMatch || rmDvMatch || nameMatch;
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm italic">
                    {history.length === 0 ? "No hay pedidos disponibles." : "No se encontraron pedidos que coincidan con la búsqueda."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

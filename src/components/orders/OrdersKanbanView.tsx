import React from 'react';
import { History, LogOut, Truck, PackagePlus, CheckCircle2, XCircle } from 'lucide-react';
import { Order, OrderStatus, MaintenanceCard } from '../../types';
import { OrderKanbanCard } from '../KanbanCards';

import { KANBAN_HISTORY_COLUMNS, KANBAN_ACTIVE_COLUMNS } from '../../constants/orders';

interface OrdersKanbanViewProps {
  historyMode: 'active' | 'history';
  history: Order[];
  sortedHistory: Order[];
  selectedStatuses: OrderStatus[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<OrderStatus[]>>;
  setViewingOrder: (order: Order | null) => void;
  handleDeleteOrder: (id: string) => void;
  maintenanceCards: MaintenanceCard[];
  handleMoveStageBackward: (order: Order, e?: React.MouseEvent) => void;
  handleMoveStageForward: (order: Order, e?: React.MouseEvent) => void;
}

export const OrdersKanbanView: React.FC<OrdersKanbanViewProps> = ({
  historyMode,
  history,
  sortedHistory,
  selectedStatuses,
  setSelectedStatuses,
  setViewingOrder,
  handleDeleteOrder,
  maintenanceCards,
  handleMoveStageBackward,
  handleMoveStageForward
}) => {
  const KANBAN_COLUMNS = historyMode === 'history' 
    ? KANBAN_HISTORY_COLUMNS.map(col => ({ ...col, count: history.filter(o => o.status === col.status).length, icon: col.status === 'COMPLETADO' ? CheckCircle2 : XCircle }))
    : KANBAN_ACTIVE_COLUMNS.map(col => ({ ...col, count: history.filter(o => o.status === col.status).length, icon: col.status === 'PEDIDO' ? History : col.status === 'EN_LOGISTICA' ? LogOut : col.status === 'EN_TRANSPORTE' ? Truck : PackagePlus }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-0">
      {KANBAN_COLUMNS.map((col) => (
        <div key={col.status} className="flex-1 min-w-[320px] flex flex-col gap-4 min-h-0">
          <button
            onClick={(e) => {
              if (e.shiftKey) {
                setSelectedStatuses(prev => 
                  prev.includes(col.status as OrderStatus) 
                    ? prev.filter(s => s !== col.status) 
                    : [...prev, col.status as OrderStatus]
                );
              } else {
                setSelectedStatuses(prev => 
                  prev.length === 1 && prev[0] === col.status ? [] : [col.status as OrderStatus]
                );
              }
            }}
            className={`w-full shrink-0 p-3 rounded-2xl border text-left transition-all hover:shadow-md active:scale-95 relative overflow-hidden flex items-center justify-between gap-3 ${
              selectedStatuses.includes(col.status as OrderStatus) 
                ? `bg-${col.color}-50 border-${col.color}-200 ring-2 ring-${col.color}-100` 
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-${col.color}-50 text-${col.color}-600`}>
                <col.icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate mb-0.5">ESTADO</p>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{col.title}</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg border shrink-0 transition-colors ${
              selectedStatuses.includes(col.status as OrderStatus) 
                ? `bg-${col.color}-100/50 border-${col.color}-200/50` 
                : 'bg-slate-50 border-slate-100'
            }`}>
              <p className="text-sm font-bold text-slate-900 leading-none">{col.count}</p>
            </div>
          </button>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar min-h-0">
            {sortedHistory.filter(o => o.status === col.status).map((order) => (
              <OrderKanbanCard
                key={order.id}
                order={order}
                setViewingOrder={setViewingOrder}
                handleDeleteOrder={handleDeleteOrder}
                maintenanceCards={maintenanceCards}
                handleMoveStageBackward={handleMoveStageBackward}
                handleMoveStageForward={handleMoveStageForward}
              />
            ))}
            {history.filter(o => o.status === col.status).length === 0 && (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Sin pedidos</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

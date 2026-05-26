import React from 'react';
import { KanbanSquare, History, ListFilter, Package, Trash2 } from 'lucide-react';
import { Order, OrderStatus, MaintenanceCard, FilterRule } from '../../types';
import { OrdersKanbanView } from './OrdersKanbanView';
import { OrdersListView } from './OrdersListView';
import { OrdersTableView } from './OrdersTableView';

interface OrdersContentProps {
  currentSection: string;
  viewMode: 'dashboard' | 'list' | 'table';
  historyMode: 'active' | 'history';
  history: Order[];
  sortedHistory: Order[];
  processedData: { groups: { key: string; label: string; items: Order[] }[] };
  selectedStatuses: OrderStatus[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<OrderStatus[]>>;
  selectedOrderIds: Set<string>;
  setSelectedOrderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  deleteOrder: (id: string) => void;
  handleDeleteOrder: (id: string) => void;
  setConfirmDialog: (config: { isOpen: boolean; message: string; onConfirm: () => void }) => void;
  setViewingOrder: (order: Order | null) => void;
  maintenanceCards: MaintenanceCard[];
  handleMoveStageBackward: (order: Order, e?: React.MouseEvent) => void;
  handleMoveStageForward: (order: Order, e?: React.MouseEvent) => void;
  getStatusBadge: (order: Order) => React.ReactNode;
  toggleOrderExpansion: (id: string, e?: React.MouseEvent) => void;
  expandedOrders: Set<string>;
  tableColOrder: string[];
  setTableColOrder: React.Dispatch<React.SetStateAction<string[]>>;
  draggedColId: string | null;
  setDraggedColId: React.Dispatch<React.SetStateAction<string | null>>;
  tableColWidths: Record<string, number>;
  setTableColWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  tableExpandMode: 'equipment' | 'provider';
  activeFilters: { 
    filterRules: FilterRule[];
    setFilterRules: React.Dispatch<React.SetStateAction<FilterRule[]>>;
    clearFilters: () => void;
  };
  isModalOpen: boolean;
}

export const OrdersContent: React.FC<OrdersContentProps> = React.memo(({
  currentSection, viewMode, historyMode, history, sortedHistory, processedData,
  selectedStatuses, setSelectedStatuses, selectedOrderIds, setSelectedOrderIds,
  deleteOrder, handleDeleteOrder, setConfirmDialog, setViewingOrder,
  maintenanceCards, handleMoveStageBackward, handleMoveStageForward, getStatusBadge,
  toggleOrderExpansion, expandedOrders, tableColOrder, setTableColOrder,
  draggedColId, setDraggedColId, tableColWidths, setTableColWidths,
  tableExpandMode, activeFilters, isModalOpen
}) => {
  if (currentSection !== 'orders') return null;

  const ordersCount = history.filter(o => 
    historyMode === 'history' 
      ? ['COMPLETADO', 'CANCELADO'].includes(o.status) 
      : ['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO'].includes(o.status)
  ).length;

  const renderEmptyState = (icon: React.ReactNode, message: string, showClearFilters = false) => (
    <div className={`mt-4 mb-4 ${isModalOpen ? 'hidden' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {viewMode === 'dashboard' ? <KanbanSquare className="w-6 h-6 text-slate-400" /> : <History className="w-6 h-6 text-slate-400" />}
          <h2 className="text-2xl font-bold text-slate-900">
            {historyMode === 'history' 
              ? (viewMode === 'dashboard' ? 'Kanban de Historial Pedidos' : viewMode === 'table' ? 'Tabla de Historial Pedidos' : 'Lista de Historial Pedidos') 
              : (viewMode === 'dashboard' ? 'Tablero Kanban Pedidos' : viewMode === 'table' ? 'Tabla de Pedidos' : 'Lista de Pedidos')
            }
          </h2>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
        {icon}
        <p className="text-slate-500 mb-4">{message}</p>
        {showClearFilters && (
          <button 
            onClick={() => {
              activeFilters.clearFilters();
              setSelectedStatuses([]);
            }}
            className="text-indigo-600 font-bold hover:underline"
          >
            Quitar filtros
          </button>
        )}
      </div>
    </div>
  );

  if (ordersCount === 0) {
    return renderEmptyState(<Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />, "No hay pedidos registrados aún.");
  }

  if (sortedHistory.length === 0) {
    return renderEmptyState(<ListFilter className="w-12 h-12 text-slate-200 mx-auto mb-4" />, "No se encontraron resultados con los filtros aplicados.", true);
  }

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${isModalOpen ? 'hidden' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {viewMode === 'dashboard' ? <KanbanSquare className="w-6 h-6 text-slate-400" /> : <History className="w-6 h-6 text-slate-400" />}
          <h2 className="text-2xl font-bold text-slate-900">
            {historyMode === 'history' 
              ? (viewMode === 'dashboard' ? 'Kanban de Historial Pedidos' : viewMode === 'table' ? 'Tabla de Historial Pedidos' : 'Lista de Historial Pedidos') 
              : (viewMode === 'dashboard' ? 'Tablero Kanban Pedidos' : viewMode === 'table' ? 'Tabla de Pedidos' : 'Lista de Pedidos')
            }
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'table' && selectedOrderIds.size > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  message: `¿Estás seguro de que deseas eliminar ${selectedOrderIds.size} pedido(s) seleccionado(s)? Esta acción no se puede deshacer.`,
                  onConfirm: () => {
                    selectedOrderIds.forEach(id => deleteOrder(id));
                    setSelectedOrderIds(new Set());
                  }
                });
              }}
              className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all border border-red-100 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar seleccionados ({selectedOrderIds.size})
            </button>
          )}
          {selectedStatuses.length > 0 && (
            <button 
              onClick={() => setSelectedStatuses([])}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
            >
              Limpiar Filtro
            </button>
          )}
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <OrdersKanbanView
          historyMode={historyMode}
          history={history}
          sortedHistory={sortedHistory}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          setViewingOrder={setViewingOrder}
          handleDeleteOrder={handleDeleteOrder}
          maintenanceCards={maintenanceCards}
          handleMoveStageBackward={handleMoveStageBackward}
          handleMoveStageForward={handleMoveStageForward}
        />
      ) : viewMode === 'list' ? (
        <OrdersListView
          processedData={processedData}
          maintenanceCards={maintenanceCards}
          setViewingOrder={setViewingOrder}
          handleDeleteOrder={handleDeleteOrder}
          handleMoveStageBackward={handleMoveStageBackward}
          handleMoveStageForward={handleMoveStageForward}
          getStatusBadge={getStatusBadge}
          toggleOrderExpansion={toggleOrderExpansion}
          expandedOrders={expandedOrders}
        />
      ) : (
        <OrdersTableView
          sortedHistory={sortedHistory}
          selectedOrderIds={selectedOrderIds}
          setSelectedOrderIds={setSelectedOrderIds}
          deleteOrder={deleteOrder}
          setConfirmDialog={setConfirmDialog}
          setViewingOrder={setViewingOrder}
          toggleOrderExpansion={toggleOrderExpansion}
          expandedOrders={expandedOrders}
          tableColOrder={tableColOrder}
          setTableColOrder={setTableColOrder}
          draggedColId={draggedColId}
          setDraggedColId={setDraggedColId}
          tableColWidths={tableColWidths}
          setTableColWidths={setTableColWidths}
          tableExpandMode={tableExpandMode}
        />
      )}
    </div>
  );
});

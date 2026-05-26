import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Truck, X, Plus } from 'lucide-react';
import { Order, MaintenanceCard } from '../../types';

interface ActionMenuProps {
  order: Order;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onMoveBackward: (order: Order, e: React.MouseEvent) => void;
  onMoveForward: (order: Order, e: React.MouseEvent) => void;
  onRevertToTransport: (order: Order) => void;
  onOpenMaintenance: (card: MaintenanceCard) => void;
  onCreateMaintenance: (order: Order) => void;
  maintenanceCards: MaintenanceCard[];
  setViewingOrder: (order: Order | null) => void;
  setIsModifyMenuOpen: (isOpen: boolean) => void;
  setConfirmDialog: (config: any) => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  order,
  isOpen,
  setIsOpen,
  onMoveBackward,
  onMoveForward,
  onRevertToTransport,
  onOpenMaintenance,
  onCreateMaintenance,
  maintenanceCards,
  setViewingOrder,
  setIsModifyMenuOpen,
  setConfirmDialog,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const existingMaintenanceCards = maintenanceCards.filter(card => card.orderId === order.id);

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center bg-blue-600 text-white rounded-xl shadow-md">
        {order.status !== 'PEDIDO' && (
          <button
            onClick={(e) => {
              onMoveBackward(order, e);
              setViewingOrder(null);
            }}
            className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-l-xl border-r border-blue-500"
            title="Etapa Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setIsModifyMenuOpen(false);
          }}
          className={`px-6 py-2.5 font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 ${
            order.status === 'PEDIDO' ? 'rounded-l-xl' : ''
          } ${
            order.status === 'FINALIZADO' ? 'rounded-r-xl' : ''
          }`}
        >
          Mover a
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {order.status !== 'FINALIZADO' && (
          <button
            onClick={(e) => {
              onMoveForward(order, e);
              setViewingOrder(null);
            }}
            className="px-3 py-2.5 hover:bg-blue-700 transition-colors rounded-r-xl border-l border-blue-500"
            title="Siguiente Etapa"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {isOpen && (
      <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
        <div className="p-1 flex flex-col gap-1">
          {order.status === 'PEDIDO' && (
            <button
              onClick={(e) => {
                onMoveForward(order, e);
                setViewingOrder(null);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
            >
              <Truck className="w-4 h-4 text-slate-400" />
              Mover a Logística
            </button>
          )}

          {order.status === 'FINALIZADO' && (
            <>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    message: '¿Desea devolver el pedido a la etapa de transporte?',
                    onConfirm: () => {
                      onRevertToTransport(order);
                    }
                  });
                  setIsOpen(false);
                  setViewingOrder(null);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
                Devolver a Transporte
              </button>
              {(order.tipoTransporte === 'devolucion' || order.tipoTransporte === 'trayecto') && (
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inspecciones / Mantenimiento</div>
                  {existingMaintenanceCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => {
                        onOpenMaintenance(card);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors text-wrap break-words"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      Continuar: {card.ticketNumber || '#'} - {card.title || 'Mantenimiento'}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      onCreateMaintenance(order);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg text-sm font-medium text-blue-600 flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Mantenimiento o Revisión
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

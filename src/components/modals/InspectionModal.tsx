import React from 'react';
import { X } from 'lucide-react';
import { Order } from '../../types';

interface InspectionModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Set<string>;
  onToggleItem: (itemId: string) => void;
  onConfirm: (toMaintenance: boolean) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  order,
  isOpen,
  onClose,
  selectedItems,
  onToggleItem,
  onConfirm,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-slate-800">Seleccionar equipos para inspección</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4">
            Seleccione los equipos del pedido <strong>{order.id?.slice(0, 8)}</strong> que desea enviar a inspección.
          </p>
          
          <div className="space-y-2">
            {order.items.map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => onToggleItem(item.id)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{item.equipo || 'Equipo sin nombre'}</p>
                  <p className="text-xs text-slate-500">Cantidad: {item.cantidad}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end shrink-0">
          <button
            onClick={() => onConfirm(false)}
            disabled={selectedItems.size === 0}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar y continuar en pedidos
          </button>
          <button
            onClick={() => onConfirm(true)}
            disabled={selectedItems.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar e ir a mantenimiento
          </button>
        </div>
      </div>
    </div>
  );
};

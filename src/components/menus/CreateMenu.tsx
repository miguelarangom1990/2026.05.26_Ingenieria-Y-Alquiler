import React, { useRef, useEffect } from 'react';
import { Plus, Package, Truck, Wrench } from 'lucide-react';
import { Can } from '../Can';

interface CreateMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCreateOrder: (type: string) => void;
  onCreateTransport: () => void;
  onCreateStandaloneMaintenance: () => void;
}

export const CreateMenu: React.FC<CreateMenuProps> = ({
  isOpen,
  setIsOpen,
  onCreateOrder,
  onCreateTransport,
  onCreateStandaloneMaintenance,
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

  return (
    <Can permission={['CREAR_PEDIDOS', 'CREAR_MANTENIMIENTO']}>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Crear
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
            <Can permission="CREAR_PEDIDOS">
              <button
                onClick={() => {
                  onCreateOrder('ALQUILER');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-slate-400" />
                Crear Solicitud
              </button>
            </Can>
            <Can permission="CREAR_PEDIDOS">
              <button
                onClick={() => {
                  onCreateTransport();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-slate-400" />
                Crear Transp.
              </button>
            </Can>
            <Can permission="CREAR_MANTENIMIENTO">
              <button
                onClick={() => {
                  onCreateStandaloneMaintenance();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Wrench className="w-4 h-4 text-slate-400" />
                Crear Mantenimiento
              </button>
            </Can>
          </div>
        )}
      </div>
    </Can>
  );
};

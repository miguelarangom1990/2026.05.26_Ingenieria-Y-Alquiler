import React from 'react';
import { KanbanSquare, ListFilter, Layers, Package, Store } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'list' | 'dashboard' | 'table';
  setViewMode: (mode: 'list' | 'dashboard' | 'table') => void;
  tableExpandMode: 'equipment' | 'provider';
  setTableExpandMode: (mode: 'equipment' | 'provider') => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  setViewMode,
  tableExpandMode,
  setTableExpandMode
}) => {
  return (
    <div className="flex items-center gap-4">
      {viewMode === 'table' && (
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setTableExpandMode('equipment')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableExpandMode === 'equipment' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            title="Expandir por equipo"
          >
            <Package className="w-3.5 h-3.5" />
            Por Equipo
          </button>
          <button
            onClick={() => setTableExpandMode('provider')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableExpandMode === 'provider' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            title="Expandir por proveedor"
          >
            <Store className="w-3.5 h-3.5" />
            Por Proveedor
          </button>
        </div>
      )}
      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setViewMode('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <KanbanSquare className="w-4 h-4" />
          Kanban
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ListFilter className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Layers className="w-4 h-4" />
          Tabla
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Edit2, Plus, X } from 'lucide-react';
import { WizardConfigState } from '../../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClientId: string | null;
  newClientNit: string;
  newClientName: string;
  setWizardConfig: React.Dispatch<React.SetStateAction<WizardConfigState>>;
  handleSaveClient: () => void;
}

export function ClientModal({
  isOpen,
  onClose,
  editingClientId,
  newClientNit,
  newClientName,
  setWizardConfig,
  handleSaveClient
}: ClientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            {editingClientId ? <Edit2 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
            {editingClientId ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">NIT</label>
            <input
              type="text"
              readOnly
              onClick={() => setWizardConfig({ isOpen: true, field: 'nit', value: newClientNit || '' })}
              value={newClientNit}
              placeholder="Clic para editar..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 cursor-pointer outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Cliente</label>
            <input
              type="text"
              readOnly
              onClick={() => setWizardConfig({ isOpen: true, field: 'name', value: newClientName || '' })}
              value={newClientName}
              placeholder="Clic para editar..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm hover:bg-slate-100 cursor-pointer outline-none transition-all"
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClient}
            className={`${editingClientId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95`}
          >
            {editingClientId ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

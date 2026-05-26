import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { Company } from '../../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Company>) => void;
}

export function NewClientModal({ isOpen, onClose, onSave }: NewClientModalProps) {
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Nuevo Cliente
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del Cliente / Empresa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Ej: Constructora ABC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">NIT</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Ej: 900.123.456-7"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave({ name, taxId });
              setName('');
              setTaxId('');
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            Crear Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

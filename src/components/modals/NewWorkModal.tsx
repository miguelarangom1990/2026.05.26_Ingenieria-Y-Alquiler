import React, { useState } from 'react';
import { X, Building2, MapPin } from 'lucide-react';
import { ConstructionSite, Company } from '../../types';

interface NewWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Company[];
  onSave: (work: Partial<ConstructionSite>) => void;
}

export function NewWorkModal({ isOpen, onClose, clients, onSave }: NewWorkModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [clientId, setClientId] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Nueva Obra
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700"
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la Obra</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Ej: Edificio Horizonte"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Ubicación / Dirección
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Ej: Calle 100 #15-30"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave({ name, location, clientId });
              setName('');
              setLocation('');
              setClientId('');
            }}
            disabled={!name || !clientId}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            Crear Obra
          </button>
        </div>
      </div>
    </div>
  );
}

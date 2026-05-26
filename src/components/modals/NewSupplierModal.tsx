import React, { useState } from 'react';
import { X, Store } from 'lucide-react';
import { Company } from '../../types';

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Partial<Company>) => void;
}

export function NewSupplierModal({ isOpen, onClose, onSave }: NewSupplierModalProps) {
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');

  if (!isOpen) return null;

  const handleAddService = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && serviceInput.trim()) {
      setServices([...services, serviceInput.trim()]);
      setServiceInput('');
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" />
            Nuevo Proveedor
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre del Proveedor</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
              placeholder="Ej: Trasportes LogiS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 font-medium">NIT</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              placeholder="Ej: 800.456.789-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 font-medium">Servicios</label>
            <input
              type="text"
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={handleAddService}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              placeholder="Ej: Transporte, Grúa (Enter para agregar)"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {services.map((service, idx) => (
                <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100 flex items-center gap-2">
                  {service}
                  <button onClick={() => removeService(idx)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave({ name, taxId, services });
              setName('');
              setTaxId('');
              setServices([]);
            }}
            disabled={!name}
            className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
          >
            Crear Proveedor
          </button>
        </div>
      </div>
    </div>
  );
}

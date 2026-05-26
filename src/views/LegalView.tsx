
import React from 'react';
import { Scale } from 'lucide-react';

const LegalView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="text-slate-400" size={28} />
          Gestión Jurídica
        </h1>
        <p className="text-slate-500 text-sm">Administración de contratos y procesos legales.</p>
      </div>
      
      <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Scale size={40} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Módulo Jurídico</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            Próximamente: Repositorio de contratos, seguimiento de garantías y gestión de procesos legales.
        </p>
      </div>
    </div>
  );
};

export default LegalView;
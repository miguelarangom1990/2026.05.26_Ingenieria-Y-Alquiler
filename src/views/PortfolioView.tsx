
import React from 'react';
import { Wallet } from 'lucide-react';

const PortfolioView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="text-slate-400" size={28} />
          Cartera
        </h1>
        <p className="text-slate-500 text-sm">Control de facturación y cuentas por cobrar.</p>
      </div>
      
      <div className="bg-white p-10 rounded-[2rem] border border-dashed border-slate-200 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Wallet size={40} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Módulo de Cartera</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            Próximamente: Seguimiento de facturas, gestión de cobros y estados de cuenta de clientes.
        </p>
      </div>
    </div>
  );
};

export default PortfolioView;
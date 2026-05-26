import React from 'react';
import { ShoppingBag, Wrench, Layers } from 'lucide-react';
import { SectionType, Order, MaintenanceCard } from '../../../types';

interface HistoryToggleProps {
  currentSection: SectionType;
  historyMode: 'active' | 'history';
  setHistoryMode: (mode: 'active' | 'history') => void;
  orderHistory: Order[];
  maintenanceCards: MaintenanceCard[];
}

export const HistoryToggle: React.FC<HistoryToggleProps> = ({
  currentSection,
  historyMode,
  setHistoryMode,
  orderHistory,
  maintenanceCards
}) => {
  if (currentSection !== 'orders' && currentSection !== 'maintenance') return null;

  const getActiveCount = () => {
    if (currentSection === 'orders') {
      return orderHistory.filter(o => ['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO'].includes(o.status)).length;
    }
    return maintenanceCards.filter(c => !['COMPLETADO', 'CANCELADO'].includes(c.status)).length;
  };

  const getHistoryCount = () => {
    if (currentSection === 'orders') {
      return orderHistory.filter(o => ['COMPLETADO', 'CANCELADO'].includes(o.status)).length;
    }
    return maintenanceCards.filter(c => ['COMPLETADO', 'CANCELADO'].includes(c.status)).length;
  };

  return (
    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm mr-2">
      <button
        onClick={() => setHistoryMode('active')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyMode === 'active' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        {currentSection === 'orders' ? <ShoppingBag className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
        <span>Activos</span>
        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${historyMode === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
          {getActiveCount()}
        </span>
      </button>
      <button
        onClick={() => setHistoryMode('history')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${historyMode === 'history' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <Layers className="w-4 h-4" />
        <span>Historial</span>
        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${historyMode === 'history' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
          {getHistoryCount()}
        </span>
      </button>
    </div>
  );
};

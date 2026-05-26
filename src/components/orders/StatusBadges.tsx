import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Order } from '../../types';

export const getTransportTypeBadge = (type?: string) => {
  if (!type) return null;
  
  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
  const upperType = type.toUpperCase();
  
  if (upperType.includes('REMISION')) colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
  if (upperType.includes('DEVOLUCION')) colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
  if (upperType.includes('TRAYECTO')) colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100';

  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${colorClass}`}>
      {type}
    </span>
  );
};

export const StatusBadge: React.FC<{ order: Order }> = ({ order }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
        order.confirmado ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
      }`}>
        {order.confirmado ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {order.confirmado ? 'Confirmado' : 'No Confirmado'}
      </span>
    </div>
  );
};

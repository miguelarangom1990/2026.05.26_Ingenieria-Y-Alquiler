import React from 'react';
import { History } from 'lucide-react';
import { OrderHistoryEvent } from '../types';

export const OrderHistory = ({ history }: { history?: OrderHistoryEvent[] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
        <History className="w-6 h-6 text-slate-200 mx-auto mb-2" />
        <p className="text-[10px] text-slate-400">No hay historial de modificaciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5"></div>
            <div className="w-px h-full bg-slate-200 my-1"></div>
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-700">{event.user}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-800">{event.action}</p>
            {event.details && (
              <p className="text-[10px] text-slate-500 mt-1">{event.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { MaintenanceCard, MaintenanceStatus, MaintenanceColumn } from '../../types';
import { MaintenanceKanbanCard } from '../KanbanCards';

interface MaintenanceKanbanViewProps {
  historyMode: 'active' | 'history';
  sortedMaintenanceHistory: MaintenanceCard[];
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setMaintenanceViewMode: (mode: 'detailed' | 'simplified') => void;
  setConfirmDialog: (config: { isOpen: boolean; message: string; onConfirm: () => void }) => void;
  deleteMaintenanceCard: (id: string) => void;
  MAINTENANCE_COLUMNS: MaintenanceColumn[];
  generateMaintenanceTitle: (items: any[], client?: string) => string;
  setMaintenanceCards: React.Dispatch<React.SetStateAction<MaintenanceCard[]>>;
}

export const MaintenanceKanbanView: React.FC<MaintenanceKanbanViewProps> = ({
  historyMode,
  sortedMaintenanceHistory,
  setViewingMaintenanceCard,
  setMaintenanceViewMode,
  setConfirmDialog,
  deleteMaintenanceCard,
  MAINTENANCE_COLUMNS,
  generateMaintenanceTitle,
  setMaintenanceCards
}) => {
  const columns = historyMode === 'history' ? [
    { title: 'Completado', status: 'COMPLETADO', color: 'emerald', icon: CheckCircle2 },
    { title: 'Cancelado', status: 'CANCELADO', color: 'red', icon: XCircle }
  ] : MAINTENANCE_COLUMNS;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 min-h-0">
      {columns.map((col) => (
        <div key={col.status} className="flex-1 min-w-[320px] flex flex-col gap-4 min-h-0">
          <div className="w-full shrink-0 p-3 rounded-2xl border bg-white border-slate-200 text-left relative overflow-hidden flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-${col.color}-50 text-${col.color}-600`}>
                <col.icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate mb-0.5">ESTADO</p>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{col.title}</p>
              </div>
            </div>
            <div className="px-2 py-1 rounded-lg border bg-slate-50 border-slate-100 shrink-0">
              <p className="text-sm font-bold text-slate-900 leading-none">
                {sortedMaintenanceHistory.filter(c => c.status === col.status).length}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar min-h-0">
            {sortedMaintenanceHistory.filter(c => c.status === col.status).map((card) => (
              <MaintenanceKanbanCard
                key={card.id}
                card={card}
                setViewingMaintenanceCard={setViewingMaintenanceCard}
                setMaintenanceViewMode={setMaintenanceViewMode}
                setConfirmDialog={setConfirmDialog}
                deleteMaintenanceCard={deleteMaintenanceCard}
                MAINTENANCE_COLUMNS={MAINTENANCE_COLUMNS}
                generateMaintenanceTitle={generateMaintenanceTitle}
                setMaintenanceCards={setMaintenanceCards}
              />
            ))}
            {sortedMaintenanceHistory.filter(c => c.status === col.status).length === 0 && (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Sin mantenimientos</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

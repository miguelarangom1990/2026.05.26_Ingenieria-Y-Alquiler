import React from 'react';
import { Building2, User, Package, Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Wrench, Trash2, FileText, ClipboardCheck } from 'lucide-react';
import { MaintenanceCard, MaintenanceStatus, MaintenanceColumn } from '../../types';
import { MAINTENANCE_STATUS_LABELS } from '../../constants/orders';

interface MaintenanceListViewProps {
  processedMaintenanceData: { groups: { key: string; label: string; items: MaintenanceCard[] }[] };
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setMaintenanceViewMode: (mode: 'detailed' | 'simplified') => void;
  MAINTENANCE_COLUMNS: MaintenanceColumn[];
  generateMaintenanceTitle: (items: any[], client?: string) => string;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => void;
  setConfirmDialog: (config: { isOpen: boolean; message: string; onConfirm: () => void }) => void;
  deleteMaintenanceCard: (id: string) => void;
}

export const MaintenanceListView: React.FC<MaintenanceListViewProps> = ({
  processedMaintenanceData,
  setViewingMaintenanceCard,
  setMaintenanceViewMode,
  MAINTENANCE_COLUMNS,
  generateMaintenanceTitle,
  updateMaintenanceStatus,
  setConfirmDialog,
  deleteMaintenanceCard
}) => {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-8 no-scrollbar pr-1">
      {processedMaintenanceData.groups.map((group) => (
        <div key={group.key} className="space-y-4">
          {group.label && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 py-1 bg-slate-100 rounded-full">
                {group.label}
              </h3>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
          )}
          <div className="space-y-4">
            {group.items.map(card => {
              const resolvedCliente = card.cliente && card.cliente !== 'Sin cliente' 
                ? card.cliente 
                : Array.from(new Set(card.items?.map((i: any) => i.clienteCobro).filter(Boolean))).join(', ') || 'Sin cliente';

              const resolvedObra = card.obra && card.obra !== 'Mantenimiento Interno' 
                ? card.obra 
                : Array.from(new Set(card.items?.map((i: any) => i.obraCobro).filter(Boolean))).join(', ') || card.obra || 'Mantenimiento Interno';

              const resolvedPropiedad = Array.from(new Set(card.items?.map((i: any) => i.propiedadEquipo || 'Propio'))).join(', ') || 'Propio';
              const resolvedTipoCobro = Array.from(new Set(card.items?.flatMap((i: any) => i.tipoCobro || []).filter(Boolean))).join(', ') || null;

              return (
                <div 
                  key={card.id} 
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setViewingMaintenanceCard(card);
                    setMaintenanceViewMode('simplified');
                  }}
                >
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-[1.5fr_2fr_120px] items-center hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        card.status === 'SOLICITUD_REVISION' ? 'bg-slate-50 text-slate-400' :
                        card.status === 'COT_PROV_MANT' ? 'bg-blue-50 text-blue-600' :
                        card.status === 'APROB_MANT_IYA' ? 'bg-purple-50 text-purple-600' :
                        card.status === 'COT_CLIENT' ? 'bg-orange-50 text-orange-600' :
                        card.status === 'CERVINO' ? 'bg-emerald-50 text-emerald-600' :
                        card.status === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-600' :
                        card.status === 'CANCELADO' ? 'bg-red-50 text-red-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {(() => {
                          const colIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === card.status);
                          if (colIndex !== -1) {
                            const Icon = MAINTENANCE_COLUMNS[colIndex].icon;
                            return <Icon className="w-5 h-5" />;
                          }
                          if (card.status === 'COMPLETADO') return <CheckCircle2 className="w-5 h-5" />;
                          if (card.status === 'CANCELADO') return <XCircle className="w-5 h-5" />;
                          return <Wrench className="w-5 h-5" />;
                        })()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {card.nombre || generateMaintenanceTitle(card.items, card.cliente)}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">#{card.id?.slice(0, 8)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            card.status === 'SOLICITUD_REVISION' ? 'bg-slate-100 text-slate-700' :
                            card.status === 'COT_PROV_MANT' ? 'bg-blue-100 text-blue-700' :
                            card.status === 'APROB_MANT_IYA' ? 'bg-purple-100 text-purple-700' :
                            card.status === 'COT_CLIENT' ? 'bg-orange-100 text-orange-700' :
                            card.status === 'CERVINO' ? 'bg-emerald-100 text-emerald-700' :
                            card.status === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-700' :
                            card.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {MAINTENANCE_STATUS_LABELS[card.status as MaintenanceStatus] || card.status}
                          </span>
                          {card.orderId && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-100" title="Asociado a un pedido">
                              <FileText className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">PEDIDO</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 overflow-hidden">
                          <span className="flex items-center gap-1 truncate" title={resolvedObra}>
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{resolvedObra}</span>
                          </span>
                          <span className="flex items-center gap-1 truncate" title={resolvedCliente}>
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{resolvedCliente}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0" title="Propiedad">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>{resolvedPropiedad}</span>
                          </span>
                          {resolvedTipoCobro && (
                            <span className="flex items-center gap-1 shrink-0" title="Tipo de Cobro">
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>{resolvedTipoCobro}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 shrink-0">
                            <Package className="w-3.5 h-3.5" />
                            {card.items.length} equipos
                          </span>
                          <span className="flex items-center gap-1 shrink-0" title="Fecha Ingreso Taller">
                            <Calendar className="w-3.5 h-3.5" />
                            {card.fechaIngreso}
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="hidden lg:flex flex-col text-sm text-slate-500 px-4">
                    {card.notasGenerales ? (
                      <>
                        <p className="font-medium text-slate-700 text-xs mb-0.5">Notas:</p>
                        <p className="line-clamp-2 text-xs">{card.notasGenerales}</p>
                      </>
                    ) : (
                      <p className="italic text-slate-400 text-xs">Sin notas adicionales</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-1 mr-2">
                      {(!['COMPLETADO', 'CANCELADO'].includes(card.status) && card.status !== 'SOLICITUD_REVISION') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === card.status);
                            if (currentIndex > 0) {
                              const newStatus = MAINTENANCE_COLUMNS[currentIndex - 1].status;
                              updateMaintenanceStatus(card.id, newStatus as MaintenanceStatus);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Etapa Anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}
                      {(!['COMPLETADO', 'CANCELADO'].includes(card.status) && card.status !== 'CERVINO') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === card.status);
                            if (currentIndex < MAINTENANCE_COLUMNS.length - 1) {
                              const newStatus = MAINTENANCE_COLUMNS[currentIndex + 1].status;
                              updateMaintenanceStatus(card.id, newStatus as MaintenanceStatus);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Siguiente Etapa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Equipos</p>
                      <p className="font-semibold text-slate-700">{card.items.length}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setConfirmDialog({
                          isOpen: true,
                          message: '¿Estás seguro de que quieres eliminar este mantenimiento?',
                          onConfirm: () => {
                            deleteMaintenanceCard(card.id);
                          }
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar mantenimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      ))}
    </div>
  );
};

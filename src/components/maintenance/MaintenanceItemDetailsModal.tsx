import React from 'react';
import { 
  Wrench, X, Paperclip, 
} from 'lucide-react';
import { 
  MaintenanceItem, 
  MaintenanceStatus
} from '../../types';
import { 
  MaintenanceStepIndicator 
} from '../StepIndicators';

interface MaintenanceItemDetailsModalProps {
  viewingItemDetails: any; // Using any for now to match the original loose typing or specific item structure
  setViewingItemDetails: (item: any | null) => void;
  maintenanceViewMode: 'simplified' | 'detailed';
}

export const MaintenanceItemDetailsModal: React.FC<MaintenanceItemDetailsModalProps> = ({
  viewingItemDetails,
  setViewingItemDetails,
  maintenanceViewMode,
}) => {
  if (!viewingItemDetails) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full max-w-none bg-white animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-none rounded-none shadow-none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-8 flex-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 shrink-0">
              <Wrench className="w-5 h-5 text-orange-600" />
              Detalles de Tarjeta de Mantenimiento
            </h2>
            <div className="hidden md:block flex-1 max-w-xl">
              <MaintenanceStepIndicator status={viewingItemDetails.estado} compact={true} />
            </div>
          </div>
          <button 
            onClick={() => setViewingItemDetails(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Header Info */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{viewingItemDetails.equipo}</h3>
              <p className="text-xs font-mono text-slate-400 mt-1">ID: {viewingItemDetails.id}</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cant.</p>
                <p className="text-sm font-bold text-slate-700">{viewingItemDetails.cantidad}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aprob. Gerencia</p>
                <p className="text-sm font-bold text-slate-700">{viewingItemDetails.aprobacionGerencia || '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"># Orden Mant / Salida T</p>
                <p className="text-sm font-bold text-slate-700">{viewingItemDetails.numOrdenMantSalidaT || '-'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* 1. SOLICITUD DE REVISIÓN */}
            {(maintenanceViewMode === 'detailed' || viewingItemDetails.estado === 'SOLICITUD_REVISION') && (
              <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100/50">
                <h4 className="text-[11px] font-bold text-orange-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Solicitud de Revisión
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Fecha Ingreso Taller</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.fechaEntregaTaller || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tipo de Ubicación</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.ubicacionReparacion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.clienteCobro || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Obra</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.obraCobro || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Proveedor Mantenimiento</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.proveedorMantenimiento || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Propiedad Equipo</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.propiedadEquipo || '-'}</p>
                  </div>
                  <div className="col-span-full">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tipo de Cobro</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.tipoCobro?.join(', ') || '-'}</p>
                  </div>
                  {viewingItemDetails.recibosTaller && viewingItemDetails.recibosTaller.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Recibos Taller</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingItemDetails.recibosTaller.map((file: any) => (
                          <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Paperclip className="w-2.5 h-2.5" /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. COTIZACIÓN PROVEEDOR */}
            {(maintenanceViewMode === 'detailed' || viewingItemDetails.estado === 'COT_PROV_MANT') && (
              <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
                <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Cotización Proveedor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Solicitud Cot Prov</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.cotProvMantEnviada || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Nº Cotización</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.numCotProvMant || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cobro a Cliente</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.cobroMantClient || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. APROBACIÓN IYA */}
            {(maintenanceViewMode === 'detailed' || viewingItemDetails.estado === 'APROB_MANT_IYA') && (
              <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50">
                <h4 className="text-[11px] font-bold text-purple-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Aprobación IYA
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Aprobación Gerencia</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.aprobacionGerencia || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. COTIZACIÓN CLIENTE */}
            {(maintenanceViewMode === 'detailed' || viewingItemDetails.estado === 'COT_CLIENT') && (
              <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50">
                <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                  Cotización Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Cot. Cliente</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.valorCotizadoCliente ? `$${viewingItemDetails.valorCotizadoCliente}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cot cliente enviada?</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.cotClientEnviada || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Aprob Client Fact Mantenimiento</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.aprobClientFactMantenimiento || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1"># Cot mant cliente</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.numCotMantCliente || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Factura (estado)</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.facturaEstado || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1"># factura mant</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.numFacturaMant || '-'}</p>
                  </div>
                  {viewingItemDetails.facturaArchivos && viewingItemDetails.facturaArchivos.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">factura mant (Arch)</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingItemDetails.facturaArchivos.map((file: any) => (
                          <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-orange-600 hover:underline flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                             <Paperclip className="w-2.5 h-2.5" /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. CERVINO */}
            {(maintenanceViewMode === 'detailed' || viewingItemDetails.estado === 'CERVINO') && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px]">5</span>
                  Cervino
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Orden Mant / Salida Taller realizada?</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.salidaTallerRealizada || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1"># Orden Mant / Salida T</p>
                    <p className="text-xs font-medium text-slate-700">{viewingItemDetails.numOrdenMantSalidaT || '-'}</p>
                  </div>
                  {viewingItemDetails.ordenMantSalidaTallerArchivos && viewingItemDetails.ordenMantSalidaTallerArchivos.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Orden Mant / Salida taller (arch)</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingItemDetails.ordenMantSalidaTallerArchivos.map((file: any) => (
                          <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                             <Paperclip className="w-2.5 h-2.5" /> {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {viewingItemDetails.archivosAdjuntos && viewingItemDetails.archivosAdjuntos.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Archivos Adjuntos Generales</p>
                <div className="flex flex-wrap gap-2">
                  {viewingItemDetails.archivosAdjuntos.map((file: any) => (
                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded border border-indigo-100">
                       <Paperclip className="w-3 h-3" /> {file.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Wrench, ChevronRight, Save, ClipboardCheck, History, Trash2, Calendar as CalendarIcon, FileText, Paperclip, MapPin, RefreshCw, ChevronDown, Plus, Building2, Calendar, Loader2 } from 'lucide-react';
import { SearchableDropdown } from '../SearchableDropdown';
import { MaintenanceCard, MaintenanceColumn, Company, MaintenanceStatus, ConstructionSite, Attachment } from '../../types';
import { cleanInput, trimInput } from '../../lib/utils';
import { parseNumber, formatNumber } from '../../lib/orderUtils';
import { getInputClass } from '../../lib/orderUtils';
import { DatePicker } from '../DatePicker';
import { isSimilarEquipment } from '../../views/EquipmentList';
import { uploadFile } from '../../services/firebaseService';

interface MaintenanceStepUIProps {
  editingMaintenanceCard: MaintenanceCard | null;
  setEditingMaintenanceCard: React.Dispatch<React.SetStateAction<MaintenanceCard | null>>;
  editingMaintenanceStage: MaintenanceStatus | null;
  setEditingMaintenanceStage: React.Dispatch<React.SetStateAction<MaintenanceStatus | null>>;
  maintenanceViewMode: 'simplified' | 'detailed';
  setMaintenanceViewMode: React.Dispatch<React.SetStateAction<'simplified' | 'detailed'>>;
  MAINTENANCE_COLUMNS: MaintenanceColumn[];
  generateMaintenanceTitle: (items: any[], clienteId: string) => string;
  setLinkingMaintenanceToOrder: (id: string) => void;
  columnWidths: Record<string, number>;
  handleResizeMouseDown: (e: React.MouseEvent, columnId: string) => void;
  equipmentOptions: {value: string; label: string}[];
  history: any[];
  constructionSites: ConstructionSite[];
  companies: Company[];
  openTipoCobroId: string | null;
  setOpenTipoCobroId: React.Dispatch<React.SetStateAction<string | null>>;
  setViewingItemDetails: (item: any) => void;
  handleUpdateMaintenanceItemEquipo: (id: string, val: string) => void;
  handleUpdateMaintenanceItemIdEquipo: (id: string, val: string) => void;
  handleUpdateMaintenanceItemCantidad: (id: string, val: number | string) => void;
  handleUpdateMaintenanceItemProvider: (id: string, val: string) => void;
  handleRemoveMaintenanceItem: (id: string) => void;
  handleAddEmptyMaintenanceItem: () => void;
  handleSaveCard: (e: React.FormEvent) => void;
  setViewingOrder: (order: any) => void;
}

export function MaintenanceStepUI({
  editingMaintenanceCard,
  setEditingMaintenanceCard,
  editingMaintenanceStage,
  setEditingMaintenanceStage,
  maintenanceViewMode,
  setMaintenanceViewMode,
  MAINTENANCE_COLUMNS,
  generateMaintenanceTitle,
  setLinkingMaintenanceToOrder,
  columnWidths,
  handleResizeMouseDown,
  equipmentOptions,
  constructionSites,
  companies,
  openTipoCobroId,
  setOpenTipoCobroId,
  setViewingItemDetails,
  handleUpdateMaintenanceItemEquipo,
  handleUpdateMaintenanceItemIdEquipo,
  handleUpdateMaintenanceItemCantidad,
  handleUpdateMaintenanceItemProvider,
  handleRemoveMaintenanceItem,
  handleAddEmptyMaintenanceItem,
  handleSaveCard,
  setViewingOrder,
  history
}: MaintenanceStepUIProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleMaintenanceFileUpload = async (itemId: string, fieldName: string, files: File[]) => {
    if (!files.length) return;
    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      for (const file of files) {
        const url = await uploadFile(file, `maintenance/${editingMaintenanceCard?.id}/${fieldName}`);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: url,
          timestamp: Date.now()
        });
      }
      setEditingMaintenanceCard(prev => prev ? {
        ...prev,
        items: prev.items.map(i => i.id === itemId ? {
          ...i,
          [fieldName]: [...(i[fieldName] || []), ...newAttachments]
        } : i)
      } : null);
    } catch (error: any) {
      alert("Error subiendo archivos: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  };

  if (!editingMaintenanceCard) return null;

  
  return (
    <>
<div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-orange-50/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-6 h-6 text-orange-600" />
                  {editingMaintenanceCard.nombre || generateMaintenanceTitle(editingMaintenanceCard.items, editingMaintenanceCard.cliente)}
                  <span className="text-sm font-normal text-slate-500 hidden md:inline">
                    ({MAINTENANCE_COLUMNS.find(c => c.status === editingMaintenanceCard.status)?.title})
                  </span>
                </h2>
                <div className="flex items-center gap-4">
                  {!editingMaintenanceCard.orderId ? (
                    <button
                      type="button"
                      onClick={() => setLinkingMaintenanceToOrder(editingMaintenanceCard.id)}
                      className="text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 uppercase tracking-widest text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                    >
                      <ClipboardCheck className="w-3 h-3" /> Vincular a Pedido
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-700">Pedido Origen:</span> 
                      <button 
                        type="button"
                        onClick={() => {
                          const order = history.find(o => o.id === editingMaintenanceCard.orderId);
                          if (order) {
                            setEditingMaintenanceCard(null);
                            setViewingOrder(order);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold text-xs"
                      >
                        #{editingMaintenanceCard.orderId?.slice(0, 8)}
                      </button>
                      <button
                          type="button"
                          onClick={() => setLinkingMaintenanceToOrder(editingMaintenanceCard.id)}
                          className="text-slate-400 hover:text-indigo-600 ml-1"
                          title="Cambiar Pedido Vinculado"
                      >
                          <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMaintenanceViewMode('simplified')}
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${maintenanceViewMode === 'simplified' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Simplificada
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaintenanceViewMode('detailed')}
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${maintenanceViewMode === 'detailed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Detallada
                    </button>
                  </div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full">
                    Ficha #{editingMaintenanceCard.id?.slice(0, 8)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Cliente:</span> {editingMaintenanceCard.cliente || 'Sin cliente'}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Obra:</span> {editingMaintenanceCard.obra || 'Mantenimiento Interno'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Fecha Ingreso Taller:</span> {editingMaintenanceCard.fechaIngreso}
                </div>
                <div className="flex items-center gap-2 max-w-[300px]">
                  <span className="text-[10px] whitespace-nowrap font-bold text-slate-500 uppercase tracking-widest shrink-0">Etapa a Modificar</span>
                  <div className="flex-1">
                    <SearchableDropdown
                      value={editingMaintenanceStage || editingMaintenanceCard.status || ''}
                      onChange={(val) => {
                        const newStage = val as MaintenanceStatus;
                        setEditingMaintenanceStage(newStage);
                      }}
                      options={MAINTENANCE_COLUMNS.slice(0, MAINTENANCE_COLUMNS.findIndex(c => c.status === editingMaintenanceCard.status) + 1).map(col => ({ value: col.status, label: col.title }))}
                      className={getInputClass(editingMaintenanceStage || editingMaintenanceCard.status, false, "orange")}
                      placeholder="Seleccionar etapa..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCard}>
              <div className="p-6 md:p-8 pb-0 md:pb-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(editingMaintenanceStage || editingMaintenanceCard.status) === 'CERVINO' && (
                    <>
                    </>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Equipos en Mantenimiento</h3>
                  </div>
                  
                  <div className="overflow-x-auto pb-4 -mx-6 md:-mx-8 px-6 md:px-8 custom-scrollbar">
                    <div className="min-w-max space-y-4">
                    {/* Desktop Header Row */}
                    {editingMaintenanceCard.items && editingMaintenanceCard.items.length > 0 && (
                      <div className="hidden md:flex flex-row gap-4 mb-3 px-2 text-sm font-medium text-slate-500 uppercase tracking-wider select-none border border-transparent">
                        {/* ID */}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="relative flex-shrink-0 group px-2" style={{ width: columnWidths.id }}>
                            ID
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('id', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        <div className="relative flex-shrink-0 group" style={{ width: columnWidths.equipo }}>
                          Equipo
                          <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('equipo', e)}>
                            <div className="w-[2px] h-4 bg-slate-300"></div>
                          </div>
                        </div>
                        <div className="relative flex-shrink-0 group" style={{ width: columnWidths.idEquipo }}>
                          Id Equipo
                          <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('idEquipo', e)}>
                            <div className="w-[2px] h-4 bg-slate-300"></div>
                          </div>
                        </div>
                        <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cantidad }}>
                          Cant.
                          <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cantidad', e)}>
                            <div className="w-[2px] h-4 bg-slate-300"></div>
                          </div>
                        </div>
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.fechaEntrega }}>
                            Fecha Ingreso T.
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('fechaEntrega', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.ubicacion }}>
                              Tipo de Ubicación
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('ubicacion', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.clienteCobro }}>
                              Cliente
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('clienteCobro', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.obraCobro }}>
                              Obra
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('obraCobro', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.proveedor }}>
                              Proveedor
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('proveedor', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.propiedad }}>
                              Propiedad
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('propiedad', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.tipoCobro }}>
                              Tipo Cobro
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('tipoCobro', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotProvMantEnviada }}>
                            Solicitud Cot Prov
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotProvMantEnviada', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                              <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cobroMantClient }}>
                                Cobro mant client?
                                <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cobroMantClient', e)}>
                                  <div className="w-[2px] h-4 bg-slate-300"></div>
                                </div>
                              </div>
                            )}
                            {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                              <div className="relative flex-shrink-0 group" style={{ width: columnWidths.aprobacionGerencia }}>
                                Aprob. Gerencia
                                <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('aprobacionGerencia', e)}>
                                  <div className="w-[2px] h-4 bg-slate-300"></div>
                                </div>
                              </div>
                            )}
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numCotProvMant }}>
                              # Cot prov mant
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numCotProvMant', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.costoMantenimiento }}>
                              costo de mantenimiento
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('costoMantenimiento', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'APROB_MANT_IYA')) && (
                          <>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numOrdenCompraIyA }}>
                              # OC IyA
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numOrdenCompraIyA', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            {maintenanceViewMode === 'detailed' && (
                              <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numCotProvMantAprob }}>
                                # Cot prov mant
                                <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numCotProvMantAprob', e)}>
                                  <div className="w-[2px] h-4 bg-slate-300"></div>
                                </div>
                              </div>
                            )}
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.ordenCompraAttachments }}>
                              Orden Compra a Prov (arch)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('ordenCompraAttachments', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {(maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'COT_CLIENT') && (
                          <>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotClientEnviada }}>
                              Cot cliente enviada?
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotClientEnviada', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numCotMantCliente }}>
                              # Cot mant cliente
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numCotMantCliente', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotCliente }}>
                              Cot Cliente (arch)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotCliente', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.valorCotCliente }}>
                              Valor Cot. Cliente
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('valorCotCliente', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.aprobClientFactMantenimiento }}>
                              Aprob Client Fact Mantenimiento
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('aprobClientFactMantenimiento', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.facturaEstado }}>
                              Factura (estado)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('facturaEstado', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numFacturaMant }}>
                              # factura mant
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numFacturaMant', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.facturaMantArch }}>
                              Factura compra (arch)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('facturaMantArch', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {maintenanceViewMode === 'detailed' && (
                          <>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.aprobClientFactMantenimiento }}>
                              Aprob Client Fact Mantenimiento
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('aprobClientFactMantenimiento', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.facturaEstado }}>
                              Factura (estado)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('facturaEstado', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotClientEnviada }}>
                              Cot cliente enviada?
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotClientEnviada', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.valorCotCliente }}>
                              Valor Cot. Cliente
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('valorCotCliente', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numCotMantCliente }}>
                              # Cot mant cliente
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numCotMantCliente', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numFacturaMant }}>
                              # factura mant
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numFacturaMant', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {((maintenanceViewMode === 'detailed') || (maintenanceViewMode === 'simplified' && !['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA', 'COT_CLIENT'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.salidaTallerRealizada }}>
                              Orden Mant / Salida Taller realizada?
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('salidaTallerRealizada', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.numOrdenMantSalidaT }}>
                              # Orden Mant / Salida T
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('numOrdenMantSalidaT', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                            <div className="relative flex-shrink-0 group" style={{ width: columnWidths.ordenMantSalidaTallerArch }}>
                              Orden Mant / Salida taller (arch)
                              <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('ordenMantSalidaTallerArch', e)}>
                                <div className="w-[2px] h-4 bg-slate-300"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'SOLICITUD_REVISION')) && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.reciboTaller }}>
                            Recibo Taller (arch)
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('reciboTaller', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotCliente }}>
                            Cot Cliente (arch)
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotCliente', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.cotProvMantArch }}>
                            Cot Prov (Arch)
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('cotProvMantArch', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="relative flex-shrink-0 group" style={{ width: columnWidths.facturaMantArch }}>
                            Factura compra (arch)
                            <div className="absolute right-[-8px] top-0 bottom-0 w-4 cursor-col-resize z-10 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeMouseDown('facturaMantArch', e)}>
                              <div className="w-[2px] h-4 bg-slate-300"></div>
                            </div>
                          </div>
                        )}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA', 'COT_CLIENT'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="w-12 flex-shrink-0 text-center">Acción</div>
                        )}
                      </div>
                    )}

                    {editingMaintenanceCard.items.map((item, index) => (
                      <div key={item.id} className="relative flex flex-col gap-3 bg-slate-50 md:bg-transparent p-4 md:p-2 rounded-xl border border-slate-200 md:border-transparent transition-all hover:bg-slate-50 mb-2" style={{ zIndex: 100 - index }}>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
                        {/* ID */}
                        {maintenanceViewMode === 'detailed' && (
                          <div 
                            className="hidden md:block flex-shrink-0 px-2 text-xs font-mono text-blue-500 hover:underline cursor-pointer" 
                            style={{ width: columnWidths.id }}
                            onClick={() => setViewingItemDetails(item)}
                          >
                            {item.id.substring(0, 8)}
                          </div>
                        )}

                        {/* Equipo */}
                        <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.equipo }}>
                          <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Equipo</label>
                          <SearchableDropdown
                            required
                            allowCustom={true}
                            value={item.equipo}
                            placeholder="Buscar o escribir equipo..."
                            onChange={(val) => handleUpdateMaintenanceItemEquipo(item.id, val)}
                            options={equipmentOptions}
                            matcher={(optLabel, searchTerm) => isSimilarEquipment(searchTerm, optLabel)}
                            className={getInputClass(item.equipo, true, "orange")}
                          />
                        </div>

                        {/* Id Equipo */}
                        <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.idEquipo }}>
                          <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Id Equipo</label>
                          <input
                            type="text"
                            value={item.idEquipo || ''}
                            onChange={(e) => handleUpdateMaintenanceItemIdEquipo(item.id, e.target.value)}
                            placeholder="Código/Nº..."
                            className={getInputClass(item.idEquipo || '', false, "indigo")}
                          />
                        </div>

                        {/* Cantidad */}
                        <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cantidad }}>
                          <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cant.</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.cantidad || ''}
                            onChange={(e) => handleUpdateMaintenanceItemCantidad(item.id, Number(e.target.value) || '')}
                            placeholder="Ej. 1"
                            className={getInputClass(item.cantidad, true, "orange")}
                          />
                        </div>

                        {/* Fecha Ingreso T. */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.fechaEntrega }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Fecha Ingreso T.</label>
                            <DatePicker
                              value={item.fechaEntregaTaller || ""}
                              onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                fechaIngreso: val,
                                items: prev.items.map(i => i.id === item.id ? { ...i, fechaEntregaTaller: val } : i)
                              } : null)}
                              className={getInputClass(item.fechaEntregaTaller, false, "orange")}
                            />
                          </div>
                        )}

                        {/* Tipo de Ubicación */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.ubicacion }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Tipo de Ubicación</label>
                              <SearchableDropdown
                                value={item.ubicacionReparacion || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { 
                                    ...i, 
                                    ubicacionReparacion: val as any,
                                    obraCobro: val === 'Taller' ? 'Taller' : (i.obraCobro === 'Taller' ? '' : i.obraCobro)
                                  } : i)
                                } : null)}
                                options={[{ value: 'Obra', label: 'Obra' }, { value: 'Taller', label: 'Taller' }]}
                                className={getInputClass(item.ubicacionReparacion, false, "orange")}
                              />
                            </div>

                            {/* Cliente */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.clienteCobro }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cliente</label>
                              <SearchableDropdown
                                value={item.clienteCobro || ''}
                                placeholder="Buscar cliente..."
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, clienteCobro: val, obraCobro: '' } : i)
                                } : null)}
                                options={companies.filter(c => c.roles?.includes('Cliente') || (c as any).type === 'cliente').map(p => ({ value: p.name, label: p.commercialName || p.name })).sort((a, b) => a.label.localeCompare(b.label))}
                                className={getInputClass(item.clienteCobro ? item.clienteCobro : '', false, "orange")}
                              />
                            </div>

                            {/* Obra */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.obraCobro }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Obra</label>
                              <SearchableDropdown
                                value={item.obraCobro || ''}
                                placeholder="Buscar obra..."
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, obraCobro: val } : i)
                                } : null)}
                                options={(() => {
                                  if (item.ubicacionReparacion === 'Taller') {
                                    return [{ value: 'Taller', label: 'Taller' }];
                                  }

                                  const selectedCompany = companies.find(c => c.name === item.clienteCobro);
                                  if (selectedCompany) {
                                    const clientSites = constructionSites.filter(s => s.clientId === selectedCompany.id);
                                    const otherSites = constructionSites.filter(s => s.clientId !== selectedCompany.id);
                                    const opts: any[] = [];
                                    if (clientSites.length > 0) {
                                      opts.push(...clientSites.map(s => ({ value: s.name, label: `🟢 ${s.name}` })).sort((a, b) => a.label.localeCompare(b.label)));
                                    }
                                    if (otherSites.length > 0) {
                                      opts.push({ value: '', label: '--- Otras Obras ---', disabled: true });
                                      opts.push(...otherSites.map(s => ({ value: s.name, label: s.name })).sort((a, b) => a.label.localeCompare(b.label)));
                                    }
                                    return opts;
                                  }

                                  return [...constructionSites.map(s => ({ value: s.name, label: s.name })).sort((a, b) => a.label.localeCompare(b.label))];
                                })()}
                                className={getInputClass(item.obraCobro ? item.obraCobro : '', false, "orange")}
                              />
                            </div>

                            {/* Proveedor */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.proveedor }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Proveedor</label>
                              <SearchableDropdown
                                value={item.proveedorMantenimiento || ''}
                                placeholder="Buscar proveedor..."
                                onChange={(val) => handleUpdateMaintenanceItemProvider(item.id, val)}
                                options={companies.filter(c => 
                                  (c.roles?.includes('Proveedor') || (c as any).type === 'proveedor') && 
                                  (c.services?.some(s => s.toLowerCase().trim().includes('alquiler')))
                                ).map(p => ({ value: p.name, label: p.commercialName || p.name })).sort((a, b) => a.label.localeCompare(b.label))}
                                className={getInputClass(item.proveedorMantenimiento ? item.proveedorMantenimiento : '', true, "orange")}
                              />
                            </div>

                            {/* Propiedad equipo */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.propiedad }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Propiedad equipo</label>
                              <SearchableDropdown
                                value={item.propiedadEquipo || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, propiedadEquipo: val as any } : i)
                                } : null)}
                                options={[{ value: 'Propio', label: 'Propio' }, { value: 'Sub', label: 'Sub' }, { value: 'Obra', label: 'Obra' }]}
                                className={getInputClass(item.propiedadEquipo, false, "orange")}
                              />
                            </div>

                            {/* Tipo de cobro */}
                            <div className="w-full md:flex-shrink-0 relative isolate overflow-visible" style={{ width: columnWidths.tipoCobro }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Tipo de cobro</label>
                              <div 
                                className={getInputClass(item.tipoCobro, false, "orange") + " cursor-pointer flex justify-between items-center min-h-[38px]"}
                                onClick={() => setOpenTipoCobroId(openTipoCobroId === item.id ? null : item.id)}
                              >
                                <span className="truncate text-sm">
                                  {item.tipoCobro?.length 
                                    ? item.tipoCobro.join(', ')
                                    : 'Seleccione'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              </div>
                              {openTipoCobroId === item.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenTipoCobroId(null)}
                                  />
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                    {['Limpieza', 'Reparación', 'Reposición'].map(tipo => (
                                      <label key={tipo} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 relative z-50">
                                        <input
                                          type="checkbox"
                                          checked={item.tipoCobro?.includes(tipo) || false}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            setEditingMaintenanceCard(prev => {
                                              if (!prev) return null;
                                              return {
                                                ...prev,
                                                items: prev.items.map(i => {
                                                  if (i.id === item.id) {
                                                    const current = i.tipoCobro || [];
                                                    const next = checked ? [...current, tipo] : current.filter(t => t !== tipo);
                                                    return { ...i, tipoCobro: next };
                                                  }
                                                  return i;
                                                })
                                              };
                                            });
                                          }}
                                          className="mr-3 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-700">{tipo}</span>
                                      </label>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}

                        {/* Solicitud Cot Prov */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotProvMantEnviada }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Solicitud Cot Prov</label>
                            <SearchableDropdown
                              value={item.cotProvMantEnviada || ""}
                              onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, cotProvMantEnviada: val as any } : i)
                              } : null)}
                              options={[{ value: 'Sin Solicitar', label: 'Sin Solicitar' }, { value: 'Cot Solicitada', label: 'Cot Solicitada' }, { value: 'Cot Recibida', label: 'Cot Recibida' }]}
                              className={getInputClass(item.cotProvMantEnviada, false, "blue")}
                            />
                          </div>
                        )}

                        {/* Campos específicos COT_PROV_MANT */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            {/* Cobro mant client? */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cobroMantClient }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cobro mant client?</label>
                              <SearchableDropdown
                                value={item.cobroMantClient || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, cobroMantClient: val as any } : i)
                                } : null)}
                                options={[{ value: 'Cobrar', label: 'Cobrar' }, { value: 'no cobrar', label: 'no cobrar' }]}
                                className={getInputClass(item.cobroMantClient, false, "blue")}
                              />
                            </div>

                            {/* Aprob. Gerencia */}
                            {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                              <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.aprobacionGerencia }}>
                                <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Aprob. Gerencia</label>
                                <SearchableDropdown
                                  value={item.aprobacionGerencia || ""}
                                  onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                    ...prev,
                                    items: prev.items.map(i => i.id === item.id ? { ...i, aprobacionGerencia: val as any } : i)
                                  } : null)}
                                  options={[
                                    { value: 'no se sabe si requiere aprobacion aun', label: 'no se sabe si requiere aprobacion aun' },
                                    { value: 'no requiere aprobacion', label: 'no requiere aprobacion' },
                                    { value: 'solicitar aprobacion', label: 'solicitar aprobacion' },
                                    { value: 'aprobada', label: 'aprobada' },
                                    { value: 'no aprobada', label: 'no aprobada' },
                                    { value: 'cancelada', label: 'cancelada' }
                                  ]}
                                  className={getInputClass(item.aprobacionGerencia, false, "orange")}
                                />
                              </div>
                            )}

                            {/* # Cot prov mant */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numCotProvMant }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># Cot prov mant</label>
                              <input
                                type="text"
                                value={item.numCotProvMant || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotProvMant: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotProvMant: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numCotProvMant, false, "blue")}
                              />
                            </div>

                            {/* costo de mantenimiento */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.costoMantenimiento }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">costo de mantenimiento</label>
                              <input
                                type="text"
                                placeholder="Valor"
                                value={formatNumber(item.costoMantenimiento)}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, costoMantenimiento: parseNumber(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.costoMantenimiento, false, "blue")}
                              />
                            </div>
                          </>
                        )}

                        {/* Valor Cot. Cliente & New Fields */}
                        {(maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'COT_CLIENT') && (
                          <>
                            {/* cot cliente enviada? */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotClientEnviada }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">cot cliente enviada?</label>
                              <SearchableDropdown
                                value={item.cotClientEnviada || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, cotClientEnviada: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'Enviada', label: 'Enviada' },
                                  { value: 'sin enviar', label: 'sin enviar' },
                                  { value: 'no se debe enviar', label: 'no se debe enviar' }
                                ]}
                                className={getInputClass(item.cotClientEnviada, false, "orange")}
                              />
                            </div>

                            {/* # Cot mant cliente */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numCotMantCliente }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># Cot mant cliente</label>
                              <input
                                type="text"
                                value={item.numCotMantCliente || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotMantCliente: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotMantCliente: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numCotMantCliente, false, "orange")}
                              />
                            </div>

                            {/* Cot Cliente (arch) */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotCliente }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cot Cliente (arch)</label>
                              <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.cotClienteAttachments || item.cotClienteAttachments.length === 0) ? 'border-green-400 bg-green-50/30' : 'border-slate-300 bg-white'}`}>
                                <div className="flex flex-wrap gap-1 items-center w-full">
                                  {(item.cotClienteAttachments || []).map(file => (
                                    <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                      <span 
                                        className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={() => window.open(file.url, '_blank')}
                                        title={file.name}
                                      >
                                        {file.name}
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setEditingMaintenanceCard(prev => prev ? {
                                            ...prev,
                                            items: prev.items.map(i => i.id === item.id ? {
                                              ...i,
                                              cotClienteAttachments: (i.cotClienteAttachments || []).filter(a => a.id !== file.id)
                                            } : i)
                                          } : null);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >×</button>
                                    </div>
                                  ))}
                                  <label className="cursor-pointer text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    {(!item.cotClienteAttachments || item.cotClienteAttachments.length === 0) ? 'Adjuntar' : 'Añadir'}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []) as File[];
                                        if (files.length > 0) {
                                          handleMaintenanceFileUpload(item.id, 'cotClienteAttachments', files);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* valor cot cliente */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.valorCotCliente }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Valor Cot. Cliente</label>
                              <input
                                type="text"
                                placeholder="Valor"
                                value={formatNumber(item.valorCotizadoCliente)}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, valorCotizadoCliente: parseNumber(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.valorCotizadoCliente, false, "green")}
                              />
                            </div>

                            {/* Aprob Client Fact Mantenimiento */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.aprobClientFactMantenimiento }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Aprob Client Fact Mantenimiento</label>
                              <SearchableDropdown
                                value={item.aprobClientFactMantenimiento || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, aprobClientFactMantenimiento: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'aprobado para facturar', label: 'aprobado para facturar' },
                                  { value: 'no se ha solicitado', label: 'no se ha solicitado' }
                                ]}
                                className={getInputClass(item.aprobClientFactMantenimiento, false, "orange")}
                              />
                            </div>

                            {/* Factura (estado) */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.facturaEstado }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Factura (estado)</label>
                              <SearchableDropdown
                                value={item.facturaEstado || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, facturaEstado: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'Sin facturar', label: 'Sin facturar' },
                                  { value: 'facturado', label: 'facturado' },
                                  { value: 'no se debe facturar', label: 'no se debe facturar' }
                                ]}
                                className={getInputClass(item.facturaEstado, false, "orange")}
                              />
                            </div>

                            {/* # factura mant */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numFacturaMant }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># factura mant</label>
                              <input
                                type="text"
                                value={item.numFacturaMant || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numFacturaMant: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numFacturaMant: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numFacturaMant, false, "orange")}
                              />
                            </div>

                            {/* Factura (archivo) */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.facturaMantArch }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Factura compra (arch)</label>
                              <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.facturaArchivos || item.facturaArchivos.length === 0) ? 'border-orange-400 bg-orange-50/30' : 'border-slate-300 bg-white'}`}>
                                <div className="flex flex-wrap gap-1 items-center w-full">
                                  {(item.facturaArchivos || []).map(file => (
                                    <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                      <span 
                                        className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={() => window.open(file.url, '_blank')}
                                        title={file.name}
                                      >
                                        {file.name}
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setEditingMaintenanceCard(prev => prev ? {
                                            ...prev,
                                            items: prev.items.map(i => i.id === item.id ? {
                                              ...i,
                                              facturaArchivos: (i.facturaArchivos || []).filter(a => a.id !== file.id)
                                            } : i)
                                          } : null);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >×</button>
                                    </div>
                                  ))}
                                  <label className="cursor-pointer text-orange-600 hover:text-orange-700 text-xs font-medium flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    {(!item.facturaArchivos || item.facturaArchivos.length === 0) ? 'Adjuntar' : 'Añadir'}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []) as File[];
                                        if (files.length > 0) {
                                          handleMaintenanceFileUpload(item.id, 'facturaArchivos', files);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {/* # O. Compra IyA */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'APROB_MANT_IYA')) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numOrdenCompraIyA }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># O. Compra IyA</label>
                            <input
                              type="text"
                              value={item.numOrdenCompraIyA || ""}
                              onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, numOrdenCompraIyA: cleanInput(e.target.value) } : i)
                              } : null)}
                              onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, numOrdenCompraIyA: trimInput(e.target.value) } : i)
                              } : null)}
                              className={getInputClass(item.numOrdenCompraIyA, false, "blue")}
                            />
                          </div>
                        )}

                        {/* # Cot prov mant */}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numCotProvMantAprob }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># Cot prov mant</label>
                            <input
                              type="text"
                              value={item.numCotProvMant || ""}
                              onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, numCotProvMant: cleanInput(e.target.value) } : i)
                              } : null)}
                              onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, numCotProvMant: trimInput(e.target.value) } : i)
                              } : null)}
                              className={getInputClass(item.numCotProvMant, false, "blue")}
                            />
                          </div>
                        )}

                        {/* O. Compra IyA */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'APROB_MANT_IYA')) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.ordenCompraAttachments }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Orden Compra a Prov (arch)</label>
                            <div className={`flex items-center min-h-[46px] w-full px-4 py-2 rounded-xl border outline-none transition-all ${(!item.ordenCompraAttachments || item.ordenCompraAttachments.length === 0) ? 'border-orange-400 bg-orange-50/30' : 'border-slate-300 bg-white'}`}>
                              <div className="flex flex-wrap gap-2 items-center w-full">
                                {(item.ordenCompraAttachments || []).map(file => (
                                  <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">
                                    <span 
                                      className="truncate max-w-[80px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setEditingMaintenanceCard(prev => prev ? {
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            ordenCompraAttachments: (i.ordenCompraAttachments || []).filter(a => a.id !== file.id)
                                          } : i)
                                        } : null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >×</button>
                                  </div>
                                ))}
                                <label className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                  <Paperclip className="w-4 h-4" />
                                  {(!item.ordenCompraAttachments || item.ordenCompraAttachments.length === 0) ? 'Adjuntar' : 'Añadir'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []) as File[];
                                      if (files.length > 0) {
                                        handleMaintenanceFileUpload(item.id, 'ordenCompraAttachments', files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {maintenanceViewMode === 'detailed' && (
                          <>
                            {/* Aprob Client Fact Mantenimiento */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.aprobClientFactMantenimiento }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Aprob Client Fact Mantenimiento</label>
                              <SearchableDropdown
                                value={item.aprobClientFactMantenimiento || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, aprobClientFactMantenimiento: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'aprobado para facturar', label: 'aprobado para facturar' },
                                  { value: 'no se ha solicitado', label: 'no se ha solicitado' }
                                ]}
                                className={getInputClass(item.aprobClientFactMantenimiento, false, "orange")}
                              />
                            </div>

                            {/* Factura (estado) */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.facturaEstado }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Factura (estado)</label>
                              <SearchableDropdown
                                value={item.facturaEstado || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, facturaEstado: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'Sin facturar', label: 'Sin facturar' },
                                  { value: 'facturado', label: 'facturado' },
                                  { value: 'no se debe facturar', label: 'no se debe facturar' }
                                ]}
                                className={getInputClass(item.facturaEstado, false, "orange")}
                              />
                            </div>

                            {/* cot cliente enviada? */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotClientEnviada }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">cot cliente enviada?</label>
                              <SearchableDropdown
                                value={item.cotClientEnviada || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, cotClientEnviada: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'Enviada', label: 'Enviada' },
                                  { value: 'sin enviar', label: 'sin enviar' },
                                  { value: 'no se debe enviar', label: 'no se debe enviar' }
                                ]}
                                className={getInputClass(item.cotClientEnviada, false, "orange")}
                              />
                            </div>

                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.valorCotCliente }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Valor Cot. Cliente</label>
                              <input
                                type="text"
                                placeholder="Valor"
                                value={formatNumber(item.valorCotizadoCliente)}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, valorCotizadoCliente: parseNumber(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.valorCotizadoCliente, false, "green")}
                              />
                            </div>

                            {/* # Cot mant cliente */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numCotMantCliente }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># Cot mant cliente</label>
                              <input
                                type="text"
                                value={item.numCotMantCliente || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotMantCliente: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numCotMantCliente: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numCotMantCliente, false, "orange")}
                              />
                            </div>

                            {/* # factura mant */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numFacturaMant }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># factura mant</label>
                              <input
                                type="text"
                                value={item.numFacturaMant || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numFacturaMant: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numFacturaMant: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numFacturaMant, false, "orange")}
                              />
                            </div>
                          </>
                        )}

                        {/* Cervino Fields Row */}
                        {((maintenanceViewMode === 'detailed') || (maintenanceViewMode === 'simplified' && !['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA', 'COT_CLIENT'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <>
                            {/* Orden Mant / Salida Taller realizada? */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.salidaTallerRealizada }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Orden Mant / Salida Taller realizada?</label>
                              <SearchableDropdown
                                value={item.salidaTallerRealizada || ""}
                                onChange={(val) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, salidaTallerRealizada: val as any } : i)
                                } : null)}
                                options={[
                                  { value: 'Realizada', label: 'Realizada' },
                                  { value: 'no realizada', label: 'no realizada' }
                                ]}
                                className={getInputClass(item.salidaTallerRealizada, false, "blue")}
                              />
                            </div>

                            {/* # Orden Mant / Salida T */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.numOrdenMantSalidaT }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider"># Orden Mant / Salida T</label>
                              <input
                                type="text"
                                placeholder="NA"
                                value={item.numOrdenMantSalidaT || ""}
                                onChange={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numOrdenMantSalidaT: cleanInput(e.target.value) } : i)
                                } : null)}
                                onBlur={(e) => setEditingMaintenanceCard(prev => prev ? {
                                  ...prev,
                                  items: prev.items.map(i => i.id === item.id ? { ...i, numOrdenMantSalidaT: trimInput(e.target.value) } : i)
                                } : null)}
                                className={getInputClass(item.numOrdenMantSalidaT, false, "blue")}
                              />
                            </div>

                            {/* Orden Mant / Salida taller (arch) */}
                            <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.ordenMantSalidaTallerArch }}>
                              <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Orden Mant / Salida taller (arch)</label>
                              <div className={`flex items-center min-h-[46px] w-full px-4 py-2 rounded-xl border outline-none transition-all ${(!item.ordenMantSalidaTallerArchivos || item.ordenMantSalidaTallerArchivos.length === 0) ? 'border-orange-400 bg-orange-50/30' : 'border-slate-300 bg-white'}`}>
                                <div className="flex flex-wrap gap-2 items-center w-full">
                                  {(item.ordenMantSalidaTallerArchivos || []).map(file => (
                                    <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">
                                      <span 
                                        className="truncate max-w-[80px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={() => window.open(file.url, '_blank')}
                                        title={file.name}
                                      >
                                        {file.name}
                                      </span>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setEditingMaintenanceCard(prev => prev ? {
                                            ...prev,
                                            items: prev.items.map(i => i.id === item.id ? {
                                              ...i,
                                              ordenMantSalidaTallerArchivos: (i.ordenMantSalidaTallerArchivos || []).filter(a => a.id !== file.id)
                                            } : i)
                                          } : null);
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                      >×</button>
                                    </div>
                                  ))}
                                  <label className="cursor-pointer text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                                    <Paperclip className="w-4 h-4" />
                                    {(!item.ordenMantSalidaTallerArchivos || item.ordenMantSalidaTallerArchivos.length === 0) ? 'Adjuntar' : 'Añadir'}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      multiple
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []) as File[];
                                        if (files.length > 0) {
                                          handleMaintenanceFileUpload(item.id, 'ordenMantSalidaTallerArchivos', files);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Recibo Taller */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && (editingMaintenanceStage || editingMaintenanceCard.status) === 'SOLICITUD_REVISION')) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.reciboTaller }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Recibo Taller (arch)</label>
                            <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.recibosTaller || item.recibosTaller.length === 0) ? 'border-orange-400 bg-orange-50/30' : 'border-slate-300 bg-white'}`}>
                              <div className="flex flex-wrap gap-1 items-center w-full">
                                {(item.recibosTaller || []).map(file => (
                                  <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                    <span 
                                      className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setEditingMaintenanceCard(prev => prev ? {
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            recibosTaller: (i.recibosTaller || []).filter(a => a.id !== file.id)
                                          } : i)
                                        } : null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >×</button>
                                  </div>
                                ))}
                                <label className="cursor-pointer text-orange-600 hover:text-orange-700 text-xs font-medium flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {(!item.recibosTaller || item.recibosTaller.length === 0) ? 'Adjuntar' : 'Añadir'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []) as File[];
                                      if (files.length > 0) {
                                        handleMaintenanceFileUpload(item.id, 'recibosTaller', files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cot Cliente */}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotCliente }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cot Cliente (arch)</label>
                            <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.cotClienteAttachments || item.cotClienteAttachments.length === 0) ? 'border-green-400 bg-green-50/30' : 'border-slate-300 bg-white'}`}>
                              <div className="flex flex-wrap gap-1 items-center w-full">
                                {(item.cotClienteAttachments || []).map(file => (
                                  <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                    <span 
                                      className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setEditingMaintenanceCard(prev => prev ? {
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            cotClienteAttachments: (i.cotClienteAttachments || []).filter(a => a.id !== file.id)
                                          } : i)
                                        } : null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >×</button>
                                  </div>
                                ))}
                                <label className="cursor-pointer text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {(!item.cotClienteAttachments || item.cotClienteAttachments.length === 0) ? 'Adjuntar' : 'Añadir'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []) as File[];
                                      if (files.length > 0) {
                                        handleMaintenanceFileUpload(item.id, 'cotClienteAttachments', files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Adjuntos (General) */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.cotProvMantArch }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cot Prov (Arch)</label>
                            <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.archivosAdjuntos || item.archivosAdjuntos.length === 0) ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-white'}`}>
                              <div className="flex flex-wrap gap-1 items-center w-full">
                                {(item.archivosAdjuntos || []).map(file => (
                                  <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                    <span 
                                      className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setEditingMaintenanceCard(prev => prev ? {
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            archivosAdjuntos: (i.archivosAdjuntos || []).filter(a => a.id !== file.id)
                                          } : i)
                                        } : null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >×</button>
                                  </div>
                                ))}
                                <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {(!item.archivosAdjuntos || item.archivosAdjuntos.length === 0) ? 'Adjuntar' : 'Añadir'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []) as File[];
                                      if (files.length > 0) {
                                        handleMaintenanceFileUpload(item.id, 'archivosAdjuntos', files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* factura mant (Arch) */}
                        {maintenanceViewMode === 'detailed' && (
                          <div className="w-full md:flex-shrink-0" style={{ width: columnWidths.facturaMantArch }}>
                            <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Factura compra (arch)</label>
                            <div className={`flex items-center min-h-[38px] w-full px-2 py-1 rounded-xl border outline-none transition-all ${(!item.facturaArchivos || item.facturaArchivos.length === 0) ? 'border-orange-400 bg-orange-50/30' : 'border-slate-300 bg-white'}`}>
                              <div className="flex flex-wrap gap-1 items-center w-full">
                                {(item.facturaArchivos || []).map(file => (
                                  <div key={file.id} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                    <span 
                                      className="truncate max-w-[60px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setEditingMaintenanceCard(prev => prev ? {
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            facturaArchivos: (i.facturaArchivos || []).filter(a => a.id !== file.id)
                                          } : i)
                                        } : null);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >×</button>
                                  </div>
                                ))}
                                <label className="cursor-pointer text-orange-600 hover:text-orange-700 text-xs font-medium flex items-center gap-1">
                                  <Paperclip className="w-3 h-3" />
                                  {(!item.facturaArchivos || item.facturaArchivos.length === 0) ? 'Adjuntar' : 'Añadir'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []) as File[];
                                      if (files.length > 0) {
                                        handleMaintenanceFileUpload(item.id, 'facturaArchivos', files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Botón eliminar */}
                        {(maintenanceViewMode === 'detailed' || (maintenanceViewMode === 'simplified' && ['SOLICITUD_REVISION', 'COT_PROV_MANT', 'APROB_MANT_IYA'].includes(editingMaintenanceStage || editingMaintenanceCard.status || ''))) && (
                          <div className="w-full md:flex-shrink-0 flex justify-end md:justify-center mt-2 md:mt-0" style={{ width: 48 }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaintenanceItem(item.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Quitar de mantenimiento"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        </div>
                      </div>
                    ))}
                    {(!editingMaintenanceCard.items || editingMaintenanceCard.items.length === 0) && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-sm text-slate-400 font-medium">No hay equipos asignados a mantenimiento</p>
                      </div>
                    )}
                    </div> {/* End min-w-max */}

                    <div className="mt-8 sticky left-6 right-6 md:left-8 md:right-8 pb-2">
                      {/* Add Item Button */}
                      <div>
                        <button
                          type="button"
                          onClick={handleAddEmptyMaintenanceItem}
                          className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar otro equipo
                        </button>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notas / Observaciones de Mantenimiento</label>
                        <textarea
                          name="notasGenerales"
                          rows={4}
                          value={editingMaintenanceCard.notasGenerales || ""}
                          onChange={(e) => setEditingMaintenanceCard(prev => prev ? { ...prev, notasGenerales: cleanInput(e.target.value) } : null)}
                          onBlur={(e) => setEditingMaintenanceCard(prev => prev ? { ...prev, notasGenerales: trimInput(e.target.value) } : null)}
                          placeholder="Describa los trabajos a realizar o el estado de los equipos..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMaintenanceCard(null);
                    setEditingMaintenanceStage(null);
                  }}
                  className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 transition-colors"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95 border border-slate-200"
                  >
                    <Save className="w-5 h-5" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveCard(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Continuar
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
    </>
  );
}

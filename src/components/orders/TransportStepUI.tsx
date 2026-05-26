import React from 'react';
import { Truck, Building2, Calendar, Layers, Info, CalendarIcon, FileText, CheckCircle2, Paperclip, Trash2, Save, File, UploadCloud, Camera } from 'lucide-react';
import { SearchableDropdown } from '../SearchableDropdown';
import { DatePicker } from '../DatePicker';
import { Order, Company } from '../../types';
import { cleanInput } from '../../lib/utils';
import { getInputClass } from '../../lib/orderUtils';
import { StepIndicator } from '../StepIndicators';

interface TransportStepUIProps {
  transportingOrder: Order | null;
  setTransportingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  companies: Company[];
  handleCompleteTransport: (e: React.FormEvent) => void;
  handleProviderFileUpload?: (providerName: string, e: React.ChangeEvent<HTMLInputElement> | any) => void;
  handleProviderRmDvFileUpload?: (e: React.ChangeEvent<HTMLInputElement> | any, providerName: string) => void;
}

export function TransportStepUI({
  transportingOrder,
  setTransportingOrder,
  companies,
  handleCompleteTransport,
  handleProviderFileUpload = async () => {},
  handleProviderRmDvFileUpload = async () => {}
}: TransportStepUIProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState('');
  const [showUploadBox, setShowUploadBox] = React.useState<Record<string, 'rmdv' | 'otros' | null>>({});
  const [dragOverBox, setDragOverBox] = React.useState<Record<string, 'rmdv' | 'otros' | null>>({});

  const toggleUploadBox = (providerName: string, type: 'rmdv' | 'otros') => {
    setShowUploadBox(prev => ({
      ...prev,
      [providerName]: prev[providerName] === type ? null : type
    }));
  };

  const handleDragOver = (e: React.DragEvent, providerName: string, type: 'rmdv' | 'otros') => {
    e.preventDefault();
    setDragOverBox(prev => ({ ...prev, [providerName]: type }));
  };

  const handleDragLeave = (e: React.DragEvent, providerName: string) => {
    e.preventDefault();
    setDragOverBox(prev => ({ ...prev, [providerName]: null }));
  };

  const handleDropRmDv = (e: React.DragEvent, providerName: string) => {
    e.preventDefault();
    setDragOverBox(prev => ({ ...prev, [providerName]: null }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mockEvent = { target: { files: e.dataTransfer.files } };
      handleProviderRmDvFileUpload(mockEvent, providerName);
      toggleUploadBox(providerName, 'rmdv');
    }
  };

  const handleDropOtros = (e: React.DragEvent, providerName: string) => {
    e.preventDefault();
    setDragOverBox(prev => ({ ...prev, [providerName]: null }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const mockEvent = { target: { files: e.dataTransfer.files } };
      handleProviderFileUpload(providerName, mockEvent);
      toggleUploadBox(providerName, 'otros');
    }
  };

  if (!transportingOrder) return null;
  return (
    <>
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-blue-50/30">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:w-1/3">
                  <h2 className="flex flex-wrap items-center gap-2 min-w-0">
                    {isEditingTitle ? (
                      <input
                        autoFocus
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={() => {
                          setIsEditingTitle(false);
                          const trimmed = titleInput.trim();
                          if (trimmed && trimmed !== transportingOrder.nombre) {
                            setTransportingOrder(prev => prev ? { ...prev, nombre: trimmed, isManualTitle: true } : null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingTitle(false);
                            const trimmed = titleInput.trim();
                            if (trimmed && trimmed !== transportingOrder.nombre) {
                              setTransportingOrder(prev => prev ? { ...prev, nombre: trimmed, isManualTitle: true } : null);
                            }
                          } else if (e.key === 'Escape') {
                            setIsEditingTitle(false);
                          }
                        }}
                        className="text-xl font-bold bg-white border border-blue-300 rounded px-2 outline-none w-full max-w-md focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span 
                        className="text-xl font-bold text-slate-900 truncate px-1 -mx-1 rounded transition-colors cursor-text hover:bg-blue-100"
                        onClick={() => {
                          setTitleInput(transportingOrder.nombre || '');
                          setIsEditingTitle(true);
                        }}
                        title="Click para editar"
                      >
                        {transportingOrder.nombre || 'Detalles de la Solicitud'}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button 
                      type="button"
                      onClick={() => {
                        const newIsManual = !transportingOrder.isManualTitle;
                        setTransportingOrder(prev => {
                          if (!prev) return null;
                          return { ...prev, isManualTitle: newIsManual };
                        });
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase transition-colors ${transportingOrder.isManualTitle ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                    >
                      {transportingOrder.isManualTitle ? 'Manual' : 'Automático'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 justify-start lg:justify-center items-center lg:w-1/3 mt-2 lg:mt-0">
                  <h2 className="text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    En Transporte
                  </h2>
                </div>
                <div className="flex lg:justify-end lg:w-1/3 w-full mt-2 lg:mt-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full shrink-0 h-fit">
                    Pedido #{transportingOrder.id?.slice(0, 8)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Obra:</span> {transportingOrder.destino}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Transportista:</span> {transportingOrder.logisticsInfo?.transportista}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Fecha Transporte Solicitada:</span> {transportingOrder.fecha}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Tipo de Vehículo:</span> {transportingOrder.logisticsInfo?.tipoVehiculo || '-'}
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Tipo de Transporte:</span> <span className="capitalize">{transportingOrder.tipoTransporte || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Razón Transporte:</span> {transportingOrder.logisticsInfo?.razonTransporte?.length 
                    ? (Array.isArray(transportingOrder.logisticsInfo.razonTransporte) ? transportingOrder.logisticsInfo.razonTransporte.join(', ') : transportingOrder.logisticsInfo.razonTransporte)
                    : '-'}
                </div>
              </div>
            </div>

            <form onSubmit={handleCompleteTransport} onChange={(e) => {
              const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
              const name = target.name;
              const value = (target.type === 'text' || target.tagName === 'TEXTAREA') ? cleanInput(target.value) : target.value;
              
              setTransportingOrder(prev => {
                if (!prev) return null;
                
                if (name.startsWith('fechaCobroSub_') || name.startsWith('fechaTransporteSub_') || name.startsWith('numAlterno_')) {
                  const [field, provider] = name.split('_');
                  return {
                    ...prev,
                    transportInfo: {
                      ...prev.transportInfo,
                      providerData: {
                        ...prev.transportInfo?.providerData,
                        [provider]: {
                          ...prev.transportInfo?.providerData?.[provider],
                          [field]: value
                        }
                      }
                    }
                  };
                }
                
                return prev;
              });
            }}>
              <div className="p-6 md:p-8 space-y-8">
                {/* Line Items Specific Fields */}
                <div className="space-y-8">
                  {/* Provider Specific Fields */}
                  {(() => {
                    const allProviders = Array.from(new Set(transportingOrder.items.map(item => item.proveedor || "Sin Proveedor")));
                    const ownProviders = allProviders.filter(providerName => {
                      const company = companies.find(c => c.name === providerName);
                      return company?.propiedadDeLaEmpresa === 'Propia';
                    });
                    const thirdPartyProviders = allProviders.filter(providerName => {
                      const company = companies.find(c => c.name === providerName);
                      return company?.propiedadDeLaEmpresa !== 'Propia';
                    });

                    const renderProviderCard = (providerName: string) => {
                      const providerItems = transportingOrder.items.filter(i => (i.proveedor || "Sin Proveedor") === providerName);
                      return (
                        <div key={providerName} className={`bg-slate-50 rounded-2xl p-5 border flex flex-col ${ownProviders.includes(providerName) ? 'border-green-400/50 shadow-sm shadow-green-100' : 'border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                            <span className="font-bold text-slate-800 text-base">{providerName}</span>
                          </div>
                          
                          <div className="flex flex-col xl:flex-row gap-6">
                            <div className="flex-[2] space-y-6 min-w-0">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="min-w-0">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Transporte</label>
                                  <DatePicker
                                    name={`fechaTransporteSub_${providerName}`}
                                    defaultValue={transportingOrder.transportInfo?.providerData?.[providerName]?.fechaTransporteSub || ""}
                                    onChange={(val) => setTransportingOrder(prev => prev ? { ...prev, transportInfo: { ...prev.transportInfo, providerData: { ...prev.transportInfo?.providerData, [providerName]: { ...prev.transportInfo?.providerData?.[providerName], fechaTransporteSub: val } } } } : null)}
                                    className={getInputClass(transportingOrder.transportInfo?.providerData?.[providerName]?.fechaTransporteSub, true, "blue") + " !py-0 !px-3 text-xs rounded-lg !h-[38px]"}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Cobro</label>
                                  <DatePicker
                                    name={`fechaCobroSub_${providerName}`}
                                    defaultValue={transportingOrder.transportInfo?.providerData?.[providerName]?.fechaCobroSub || ""}
                                    onChange={(val) => setTransportingOrder(prev => prev ? { ...prev, transportInfo: { ...prev.transportInfo, providerData: { ...prev.transportInfo?.providerData, [providerName]: { ...prev.transportInfo?.providerData?.[providerName], fechaCobroSub: val } } } } : null)} 
                                    className={getInputClass(transportingOrder.transportInfo?.providerData?.[providerName]?.fechaCobroSub, true, "blue") + " !py-0 !px-3 text-xs rounded-lg !h-[38px]"}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1"># RM/DV</label>
                                  <input
                                    type="text"
                                    name={`numAlterno_${providerName}`}
                                    defaultValue={transportingOrder.transportInfo?.providerData?.[providerName]?.numAlterno || ""}
                                    placeholder="# RM/DV"
                                    className={getInputClass(transportingOrder.transportInfo?.providerData?.[providerName]?.numAlterno, true, "blue") + " !py-0 !px-3 text-xs rounded-lg !h-[38px]"}
                                  />
                                </div>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Resumen de Equipos</h4>
                                <ul className="space-y-2">
                                  {providerItems.map(item => (
                                    <li key={item.id} className="text-sm font-medium text-slate-700 flex justify-between items-start gap-2">
                                      <span>{item.equipo}</span>
                                      <span className="text-slate-400 text-xs whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">Cant: {item.cantidad}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                              <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-2 relative">
                                <label className="text-[10px] font-bold text-slate-500 uppercase truncate">RM/DV</label>
                                
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => toggleUploadBox(providerName, 'rmdv')}
                                    className={`p-1 rounded transition-colors inline-flex w-max ${showUploadBox[providerName] === 'rmdv' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                    title="Adjuntar RM/DV"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </button>
                                  
                                  {showUploadBox[providerName] === 'rmdv' && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => toggleUploadBox(providerName, 'rmdv')} />
                                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95">
                                        <div className="text-[10px] font-bold text-slate-500 mb-2 px-1">Adjuntar archivo</div>
                                        <div className="flex flex-col gap-1 mb-3">
                                          <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-700 text-xs">
                                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Subir archivo</span>
                                            <input 
                                              type="file" 
                                              className="hidden" 
                                              multiple 
                                              onChange={(e) => {
                                                handleProviderRmDvFileUpload(e, providerName);
                                                toggleUploadBox(providerName, 'rmdv');
                                              }}
                                            />
                                          </label>
                                          <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-700 text-xs">
                                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Tomar foto o video</span>
                                            <input 
                                              type="file" 
                                              accept="image/*,video/*"
                                              capture="environment"
                                              className="hidden" 
                                              multiple 
                                              onChange={(e) => {
                                                handleProviderRmDvFileUpload(e, providerName);
                                                toggleUploadBox(providerName, 'rmdv');
                                              }}
                                            />
                                          </label>
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-400 mb-1 px-1">O suelta un archivo aquí</div>
                                        <label 
                                          onDragOver={(e) => handleDragOver(e, providerName, 'rmdv')}
                                          onDragLeave={(e) => handleDragLeave(e, providerName)}
                                          onDrop={(e) => handleDropRmDv(e, providerName)}
                                          className={`cursor-pointer flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-lg transition-colors min-h-[90px] group ${dragOverBox[providerName] === 'rmdv' ? 'bg-indigo-50 border-indigo-400' : 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300'}`}
                                        >
                                          <div className="w-8 h-8 mb-2 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
                                            <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                          </div>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            multiple 
                                            onChange={(e) => {
                                              handleProviderRmDvFileUpload(e, providerName);
                                              toggleUploadBox(providerName, 'rmdv');
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {transportingOrder.transportInfo?.providerRmDvAttachments?.[providerName]?.length ? (
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                  {transportingOrder.transportInfo.providerRmDvAttachments[providerName].map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 group">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                          <File className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[10px] font-medium text-slate-700 truncate">{file.name}</span>
                                          <span className="text-[8px] text-slate-400">{(Number(file.size || 0) / 1024).toFixed(1)} KB</span>
                                        </div>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setTransportingOrder(prev => {
                                            if (!prev) return null;
                                            const current = prev.transportInfo?.providerRmDvAttachments?.[providerName] || [];
                                            return {
                                              ...prev,
                                              transportInfo: {
                                                ...prev.transportInfo!,
                                                providerRmDvAttachments: {
                                                  ...prev.transportInfo?.providerRmDvAttachments,
                                                  [providerName]: current.filter(f => f.id !== file.id)
                                                }
                                              }
                                            };
                                          });
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                              <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-2 relative">
                                <label className="text-[10px] font-bold text-slate-500 uppercase truncate">Otros Adjuntos</label>
                                
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => toggleUploadBox(providerName, 'otros')}
                                    className={`p-1 rounded transition-colors inline-flex w-max ${showUploadBox[providerName] === 'otros' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                    title="Adjuntar Otros Archivos"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </button>
                                  
                                  {showUploadBox[providerName] === 'otros' && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => toggleUploadBox(providerName, 'otros')} />
                                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95">
                                        <div className="text-[10px] font-bold text-slate-500 mb-2 px-1">Adjuntar archivo</div>
                                        <div className="flex flex-col gap-1 mb-3">
                                          <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-700 text-xs">
                                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Subir archivo</span>
                                            <input 
                                              type="file" 
                                              className="hidden" 
                                              multiple 
                                              onChange={(e) => {
                                                handleProviderFileUpload(providerName, e);
                                                toggleUploadBox(providerName, 'otros');
                                              }}
                                            />
                                          </label>
                                          <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-700 text-xs">
                                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Tomar foto o video</span>
                                            <input 
                                              type="file" 
                                              accept="image/*,video/*"
                                              capture="environment"
                                              className="hidden" 
                                              multiple 
                                              onChange={(e) => {
                                                handleProviderFileUpload(providerName, e);
                                                toggleUploadBox(providerName, 'otros');
                                              }}
                                            />
                                          </label>
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-400 mb-1 px-1">O suelta un archivo aquí</div>
                                        <label 
                                          onDragOver={(e) => handleDragOver(e, providerName, 'otros')}
                                          onDragLeave={(e) => handleDragLeave(e, providerName)}
                                          onDrop={(e) => handleDropOtros(e, providerName)}
                                          className={`cursor-pointer flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-lg transition-colors min-h-[90px] group ${dragOverBox[providerName] === 'otros' ? 'bg-blue-50 border-blue-400' : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300'}`}
                                        >
                                          <div className="w-8 h-8 mb-2 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                                            <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                          </div>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            multiple 
                                            onChange={(e) => {
                                              handleProviderFileUpload(providerName, e);
                                              toggleUploadBox(providerName, 'otros');
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {transportingOrder.transportInfo?.providerAttachments?.[providerName]?.length ? (
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                  {transportingOrder.transportInfo.providerAttachments[providerName].map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 group">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-7 h-7 rounded bg-slate-50 flex items-center justify-center flex-shrink-0">
                                          <File className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[10px] font-medium text-slate-700 truncate">{file.name}</span>
                                          <span className="text-[8px] text-slate-400">{(Number(file.size || 0) / 1024).toFixed(1)} KB</span>
                                        </div>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setTransportingOrder(prev => {
                                            if (!prev) return null;
                                            const current = prev.transportInfo?.providerAttachments?.[providerName] || [];
                                            return {
                                              ...prev,
                                              transportInfo: {
                                                ...prev.transportInfo!,
                                                providerAttachments: {
                                                  ...prev.transportInfo?.providerAttachments,
                                                  [providerName]: current.filter(f => f.id !== file.id)
                                                }
                                              }
                                            };
                                          });
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-8">
                        {ownProviders.length > 0 && (
                          <div className="bg-white rounded-xl shadow-sm border-2 border-green-400 p-6">
                            <h3 className="text-base font-bold text-green-600 mb-4 flex items-center gap-2">
                              <span>Equipo Propio</span>
                            </h3>
                            <div className="flex flex-col gap-4">
                              {ownProviders.map(renderProviderCard)}
                            </div>
                          </div>
                        )}
                        {thirdPartyProviders.length > 0 && (
                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Equipo De Terceros</h3>
                            <div className="flex flex-col gap-4">
                              {thirdPartyProviders.map(renderProviderCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setTransportingOrder(null)}
                  className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Guardar Información de Transp.
                </button>
              </div>
            </form>
          </div>
    </>
  );
}

import React from 'react';
import { MapPin, Building2, Calendar, Layers, CheckCircle2, ClipboardCheck, Truck, ChevronDown } from 'lucide-react';
import { RAZONES_TRANSPORTE } from '../../constants/orders';
import { trimInput } from '../../lib/utils';
import { SearchableDropdown } from '../SearchableDropdown';
import { Order, Company } from '../../types';
import { cleanInput } from '../../lib/utils';
import { getInputClass } from '../../lib/orderUtils';
import { StepIndicator } from '../StepIndicators';

interface LogisticsStepUIProps {
  coordinatingOrder: Order;
  setCoordinatingOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  companies: Company[];
  handleCompleteLogistics: (e: React.FormEvent) => void;
  isRazonDropdownOpen: boolean;
  setIsRazonDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  vehicleOptions: {label: string; value: string}[];
}

export function LogisticsStepUI({
  coordinatingOrder,
  setCoordinatingOrder,
  companies,
  handleCompleteLogistics,
  isRazonDropdownOpen,
  setIsRazonDropdownOpen,
  vehicleOptions
}: LogisticsStepUIProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState('');

  return (
    <>
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-emerald-50/30">
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
                          if (trimmed && trimmed !== coordinatingOrder.nombre) {
                            setCoordinatingOrder(prev => prev ? { ...prev, nombre: trimmed, isManualTitle: true } : null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingTitle(false);
                            const trimmed = titleInput.trim();
                            if (trimmed && trimmed !== coordinatingOrder.nombre) {
                              setCoordinatingOrder(prev => prev ? { ...prev, nombre: trimmed, isManualTitle: true } : null);
                            }
                          } else if (e.key === 'Escape') {
                            setIsEditingTitle(false);
                          }
                        }}
                        className="text-xl font-bold bg-white border border-emerald-300 rounded px-2 outline-none w-full max-w-md focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span 
                        className="text-xl font-bold text-slate-900 truncate px-1 -mx-1 rounded transition-colors cursor-text hover:bg-emerald-100"
                        onClick={() => {
                          setTitleInput(coordinatingOrder.nombre || '');
                          setIsEditingTitle(true);
                        }}
                        title="Click para editar"
                      >
                        {coordinatingOrder.nombre || 'Detalles de la Solicitud'}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button 
                      type="button"
                      onClick={() => {
                        const newIsManual = !coordinatingOrder.isManualTitle;
                        setCoordinatingOrder(prev => {
                          if (!prev) return null;
                          if (!newIsManual) {
                            // If switching back to automatic, we should ideally regenerate it, but since we don't have generateOrderTitle here, we just leave the name as is or let the master logic handle it if needed. Actually we should just toggle the flag.
                            return { ...prev, isManualTitle: newIsManual };
                          }
                          return { ...prev, isManualTitle: newIsManual };
                        });
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase transition-colors ${coordinatingOrder.isManualTitle ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                    >
                      {coordinatingOrder.isManualTitle ? 'Manual' : 'Automático'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 justify-start lg:justify-center items-center lg:w-1/3 mt-2 lg:mt-0">
                  <h2 className="text-lg lg:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" />
                    Coordinación Logística
                  </h2>
                </div>
                <div className="flex lg:justify-end lg:w-1/3 w-full mt-2 lg:mt-0">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full shrink-0 h-fit">
                    Pedido #{coordinatingOrder.id?.slice(0, 8)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Cliente:</span> {coordinatingOrder.cliente}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Obra:</span> {coordinatingOrder.destino || <span className="text-red-500 font-bold">Sin definir</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Fecha Transporte Solicitada:</span> {coordinatingOrder.fecha}
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Tipo de Transporte:</span> <span className="capitalize">{coordinatingOrder.tipoTransporte || 'No especificado'}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCompleteLogistics} onChange={(e) => {
              const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
              const name = target.name;
              if (!name || name === 'razonTransporte') return;
              const value = (target.type === 'text' || target.tagName === 'TEXTAREA') ? cleanInput(target.value) : target.value;
              setCoordinatingOrder(prev => {
                if (!prev) return null;
                if (name === 'tipoTransporte') return { ...prev, tipoTransporte: value };
                return {
                  ...prev,
                  logisticsInfo: {
                    ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' },
                    [name]: value
                  }
                };
              });
            }}>
              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Transportista / Empresa de Logística</label>
                    <SearchableDropdown
                      value={coordinatingOrder.logisticsInfo?.transportista || ""}
                      onChange={(val) => setCoordinatingOrder(prev => prev ? { ...prev, logisticsInfo: { ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' }, transportista: val } } : null)}
                      options={companies.filter(c => 
                        (c.roles?.includes('Proveedor') || (c as any).type === 'proveedor') && 
                        (c.services?.some(s => s.toLowerCase().trim().includes('transporte')))
                      ).map(c => ({ value: c.name, label: c.commercialName || c.name }))}
                      className={getInputClass(coordinatingOrder.logisticsInfo?.transportista, true, "emerald")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Vehículo</label>
                    <SearchableDropdown
                      value={coordinatingOrder.logisticsInfo?.tipoVehiculo || ""}
                      onChange={(val) => setCoordinatingOrder(prev => prev ? { ...prev, logisticsInfo: { ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' }, tipoVehiculo: val } } : null)}
                      options={vehicleOptions}
                      className={getInputClass(coordinatingOrder.logisticsInfo?.tipoVehiculo, true, "emerald")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cobro Transporte</label>
                    <SearchableDropdown
                      value={coordinatingOrder.logisticsInfo?.cobroTransporte || ""}
                      onChange={(val) => setCoordinatingOrder(prev => prev ? { ...prev, logisticsInfo: { ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' }, cobroTransporte: val } } : null)}
                      options={[{ value: 'Cobrar', label: 'Cobrar' }, { value: 'No cobrar', label: 'No cobrar' }]}
                      className={getInputClass(coordinatingOrder.logisticsInfo?.cobroTransporte, true, "emerald")}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Razón Transporte</label>
                    <div 
                      className={getInputClass(coordinatingOrder.logisticsInfo?.razonTransporte, true, "emerald") + " cursor-pointer flex justify-between items-center min-h-[46px]"}
                      onClick={() => setIsRazonDropdownOpen(!isRazonDropdownOpen)}
                    >
                      <span className="truncate">
                        {coordinatingOrder.logisticsInfo?.razonTransporte?.length 
                          ? (Array.isArray(coordinatingOrder.logisticsInfo.razonTransporte) ? coordinatingOrder.logisticsInfo.razonTransporte.join(', ') : coordinatingOrder.logisticsInfo.razonTransporte)
                          : 'Seleccione una opción'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                    {isRazonDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-0" 
                          onClick={() => setIsRazonDropdownOpen(false)}
                        />
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                          {RAZONES_TRANSPORTE.map(r => (
                            <div 
                              key={r} 
                              className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 relative z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                let current = coordinatingOrder.logisticsInfo?.razonTransporte || [];
                                if (!Array.isArray(current)) {
                                  current = [current];
                                }
                                
                                const hasTipo = current.includes(r);
                                const updated = hasTipo ? current.filter(item => item !== r) : [...current, r];
                                
                                setCoordinatingOrder(prev => {
                                  if (!prev) return null;
                                  return {
                                    ...prev,
                                    logisticsInfo: {
                                      ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' },
                                      razonTransporte: updated
                                    }
                                  };
                                });
                              }}
                            >
                              <div className={`mr-3 w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center transition-colors ${(Array.isArray(coordinatingOrder.logisticsInfo?.razonTransporte) ? coordinatingOrder.logisticsInfo.razonTransporte.includes(r) : coordinatingOrder.logisticsInfo?.razonTransporte === r) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                                {(Array.isArray(coordinatingOrder.logisticsInfo?.razonTransporte) ? coordinatingOrder.logisticsInfo.razonTransporte.includes(r) : coordinatingOrder.logisticsInfo?.razonTransporte === r) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-sm text-slate-700 select-none">{r}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notas de Entrega / Instrucciones</label>
                  <textarea
                    name="notas"
                    rows={3}
                    value={coordinatingOrder.logisticsInfo?.notas || ""}
                    onChange={(e) => {
                      const val = cleanInput(e.target.value);
                      setCoordinatingOrder(prev => prev ? {
                        ...prev,
                        logisticsInfo: {
                          ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' },
                          notas: val
                        }
                      } : null);
                    }}
                    onBlur={(e) => {
                      const val = trimInput(e.target.value);
                      setCoordinatingOrder(prev => prev ? {
                        ...prev,
                        logisticsInfo: {
                          ...prev.logisticsInfo || { transportista: '', tipoVehiculo: '', notas: '' },
                          notas: val
                        }
                      } : null);
                    }}
                    placeholder="Ej. Entregar en la puerta trasera, contactar a Juan Pérez al llegar."
                    className={getInputClass(coordinatingOrder.logisticsInfo?.notas, false, "emerald") + " resize-none"}
                  ></textarea>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resumen de Equipos a Entregar</p>
                  <div className="grid grid-cols-1 gap-2">
                    {coordinatingOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 font-medium">{item.equipo}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500">Cant: {item.cantidad}</span>
                          <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400">{item.proveedor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCoordinatingOrder(null)}
                  className="text-slate-500 hover:text-slate-700 font-medium px-4 py-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Guardar y Finalizar
                </button>
              </div>
            </form>
          </div>
    </>
  );
}

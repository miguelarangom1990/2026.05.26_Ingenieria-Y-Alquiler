import React from 'react';
import { DatePicker } from '../DatePicker';
import { SearchableDropdown } from '../SearchableDropdown';
import { Company, ConstructionSite, LineItem } from '../../types';
import { getInputClass } from '../../lib/orderUtils';
import { generateOrderTitle } from '../../lib/utils';
import { isSimilarEquipment } from '../../views/EquipmentList';
import { cleanInput } from '../../lib/utils';
import { TIPOS_TRANSPORTE, ACTIVE_ORDER_STATUSES } from '../../constants/orders';
import { Edit2, Plus, X, FileText, Building2, Package, Trash2, Save, ChevronRight, History } from 'lucide-react';

interface OrderFormModalProps {
  isModalOpen: boolean;
  editingOrderId: string | null;
  createOrderType: 'ALQUILER' | 'TRANSPORTE';
  handleCancelEdit: () => void;
  handleSave: (e: React.FormEvent, continueToNextStep?: boolean) => void;
  cliente: string;
  setCliente: (c: string) => void;
  destino: string;
  setDestino: (d: string) => void;
  isNombreManual: boolean;
  nombre: string;
  setNombre: (n: string) => void;
  setIsSaved: (s: boolean) => void;
  companies: Company[];
  constructionSites: ConstructionSite[];
  fecha: Date | null;
  setFecha: (f: Date | null) => void;
  tipoTransporte: string;
  setTipoTransporte: (t: string) => void;
  items: LineItem[];
  handleItemChange: (id: string, field: keyof LineItem, value: string | number) => void;
  equipmentOptions: { value: string; label: string }[];
  handleRemoveItem: (id: string) => void;
  handleAddItem: () => void;
}

export function OrderFormModal({
  isModalOpen,
  editingOrderId,
  createOrderType,
  handleCancelEdit,
  handleSave,
  cliente,
  setCliente,
  destino,
  setDestino,
  isNombreManual,
  nombre,
  setNombre,
  setIsSaved,
  companies,
  constructionSites,
  fecha,
  setFecha,
  tipoTransporte,
  setTipoTransporte,
  items,
  handleItemChange,
  equipmentOptions,
  handleRemoveItem,
  handleAddItem
}: OrderFormModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden animate-in fade-in zoom-in-95 duration-300 ${editingOrderId ? 'border-slate-200' : 'border-indigo-200'}`}>
      <div className={`p-6 md:p-8 border-b border-slate-100 ${editingOrderId ? 'bg-slate-50/50' : 'bg-indigo-50/30'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:w-1/3">
            <h2 className="flex flex-wrap items-center gap-2 min-w-0">
              {!editingOrderId && <Plus className="w-5 h-5 shrink-0 text-indigo-600" />}
              <span className="text-xl font-bold text-slate-900 truncate">
                {editingOrderId ? (nombre || 'Detalles de la Solicitud') : (createOrderType === 'TRANSPORTE' ? 'Nuevo Transp.' : 'Nueva Solicitud de Equipos')}
              </span>
            </h2>
            {editingOrderId && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-50 text-slate-600 border border-slate-200 uppercase">
                  {isNombreManual ? 'Manual' : 'Automático'}
                </span>
              </div>
            )}
          </div>
          
          <div className="hidden lg:flex flex-1 justify-center items-center lg:w-1/3 mt-2 lg:mt-0">
            {editingOrderId && (
              <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2 text-slate-900">
                <History className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600" />
                En Solicitud
              </h2>
            )}
          </div>

          <div className="flex lg:justify-end lg:w-1/3 w-full mt-2 lg:mt-0 items-center justify-between lg:justify-end gap-2">
            {editingOrderId && (
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full shrink-0 h-fit">
                Pedido #{editingOrderId.slice(0, 8)}
              </span>
            )}
            <button 
              type="button"
              onClick={handleCancelEdit}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 ml-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
        
      <form onSubmit={handleSave} className="transition-all">
        {/* General Info Section */}
        <div className="p-6 md:p-8 border-b border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Información General
              </span>
              {editingOrderId && (
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-1 rounded">
                  Modo Edición
                </span>
              )}
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${editingOrderId ? 'lg:grid-cols-4' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cliente / Empresa
                </label>
                <SearchableDropdown
                  required
                  value={cliente}
                  placeholder="Buscar cliente..."
                  onChange={(val) => { 
                    const cleanedVal = cleanInput(val);
                    setCliente(cleanedVal); 
                    setDestino(''); // Reset Obra when Cliente changes
                    if (!isNombreManual) {
                        setNombre(`Pedido ${cleanedVal}`.trim());
                    }
                    setIsSaved(false); 
                  }}
                  options={companies.filter(c => 
                    (c.roles?.includes('Cliente') || (c as any).type === 'cliente')
                  ).map(c => ({ value: c.name, label: c.name })).sort((a, b) => a.label.localeCompare(b.label))}
                  className={getInputClass(cliente, true, "indigo")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Obra
                </label>
                <div className="relative">
                  <SearchableDropdown
                    required
                    value={destino}
                    placeholder="Buscar obra..."
                    onChange={(val) => { 
                      const cleanedVal = cleanInput(val);
                      setDestino(cleanedVal); 
                      if (!isNombreManual) {
                          setNombre(`Pedido ${cliente} - ${cleanedVal}`.trim());
                      }
                      setIsSaved(false); 
                    }}
                    className={getInputClass(destino, true, "indigo")}
                    disabled={!cliente} // Disable if no client selected
                    icon={<Building2 className="w-4 h-4 text-slate-400" />}
                    options={constructionSites
                      .filter(d => {
                        if (!cliente) return true;
                        const selectedCompany = companies.find(c => c.name === cliente);
                        if (selectedCompany) {
                          return d.clientId === selectedCompany.id;
                        }
                        return false;
                      })
                      .map(d => ({ value: d.name, label: d.name })).sort((a, b) => a.label.localeCompare(b.label))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fecha Transporte Solicitada
                </label>
                <DatePicker
                  value={fecha}
                  required
                  onChange={(val) => { setFecha(val); setIsSaved(false); }}
                  className={getInputClass(fecha, true, "indigo")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Transporte
                </label>
                <SearchableDropdown
                  value={tipoTransporte}
                  required
                  placeholder="Buscar tipo..."
                  onChange={(val) => { setTipoTransporte(val); setIsSaved(false); }}
                  options={TIPOS_TRANSPORTE.map(t => ({ value: t, label: t })).sort((a, b) => a.label.localeCompare(b.label))}
                  className={getInputClass(tipoTransporte, true, "indigo")}
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                Equipos Solicitados
              </h2>
            </div>

            {/* Desktop Header Row */}
            <div className="hidden md:grid grid-cols-12 gap-4 mb-3 px-2 text-sm font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Equipo</div>
              <div className="col-span-2">Cantidad</div>
              <div className="col-span-4">Proveedor</div>
              <div className="col-span-1 text-center">Acción</div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center bg-slate-50 md:bg-transparent p-4 md:p-2 rounded-xl border border-slate-200 md:border-transparent transition-all hover:bg-slate-50"
                >
                  {/* Equipo */}
                  <div className="col-span-1 md:col-span-5">
                    <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Equipo</label>
                    <SearchableDropdown
                      required
                      allowCustom={true}
                      value={item.equipo || ''}
                      placeholder="Buscar o escribir equipo..."
                      onChange={(val) => handleItemChange(item.id, 'equipo', cleanInput(val))}
                      options={equipmentOptions}
                      matcher={(optLabel, searchTerm) => isSimilarEquipment(searchTerm, optLabel)}
                      className={getInputClass(item.equipo || '', true, "indigo")}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Cantidad</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.cantidad || ''}
                      onChange={(e) => handleItemChange(item.id, 'cantidad', Number(e.target.value) || '')}
                      placeholder="Ej. 1"
                      className={getInputClass(item.cantidad, true, "indigo")}
                    />
                  </div>

                  {/* Proveedor */}
                  <div className="col-span-1 md:col-span-4">
                    <label className="block md:hidden text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Proveedor</label>
                    <SearchableDropdown
                      value={item.proveedor || ''}
                      placeholder="Buscar proveedor..."
                      onChange={(val) => handleItemChange(item.id, 'proveedor', cleanInput(val))}
                      options={companies.filter(c => 
                        (c.roles?.includes('Proveedor') || (c as any).type === 'proveedor') && 
                        (c.services?.some(s => s.toLowerCase().trim().includes('alquiler')))
                      ).map(p => ({ value: p.name, label: p.commercialName || p.name }))}
                      className={getInputClass(item.proveedor ? item.proveedor : '', true, "indigo")}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Item Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar otro equipo
              </button>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Total de líneas: <span className="font-semibold text-slate-700">{items.length}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={(e) => handleSave(e, false)}
                className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow active:scale-95 ${editingOrderId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>

              <button
                type="button"
                onClick={(e) => handleSave(e, true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
    </div>
  );
}

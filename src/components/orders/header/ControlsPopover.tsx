import React from 'react';
import { Settings, ArrowUpDown, Filter, Layers, ChevronDown, ChevronUp, X, Trash2, Plus as PlusIcon, CheckCircle2 } from 'lucide-react';
import { SortRule, SectionType } from '../../../types';
import { DatePicker } from '../../DatePicker';
import { useOrdersContext } from '../../../context/OrdersContext';

interface ControlsPopoverProps {
  showControlsPopover: boolean;
  setShowControlsPopover: (show: boolean) => void;
  showSortPopover: boolean;
  setShowSortPopover: (show: boolean) => void;
  showFilterPopover: boolean;
  setShowFilterPopover: (show: boolean) => void;
  showGroupPopover: boolean;
  setShowGroupPopover: (show: boolean) => void;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  groupBy: string;
  setGroupBy: (group: any) => void;
  activeFilters: any;
  labels: any;
  currentSection?: SectionType;
}

export const ControlsPopover: React.FC<ControlsPopoverProps> = ({
  showControlsPopover,
  setShowControlsPopover,
  showSortPopover,
  setShowSortPopover,
  showFilterPopover,
  setShowFilterPopover,
  showGroupPopover,
  setShowGroupPopover,
  sortRules,
  setSortRules,
  groupBy,
  setGroupBy,
  activeFilters,
  labels,
  currentSection
}) => {
  const { ui } = useOrdersContext();
  const { companies = [], constructionSites = [] } = ui || {};

  const filterRules = activeFilters.filterRules;
  const [openDropdownRuleId, setOpenDropdownRuleId] = React.useState<string | null>(null);

  const getOptionsForField = React.useCallback((field: string): string[] => {
    if (field === 'tipoCobro') {
      return ['Limpieza', 'Reparación', 'Reposición'];
    }
    if (field === 'cliente') {
      return Array.from(new Set<string>(
        companies
          .filter(c => c.roles?.includes('Cliente') || (c as any).type === 'cliente')
          .map(c => (c.name || c.commercialName || c.legalName || '') as string)
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
    }
    if (field === 'proveedor') {
      return Array.from(new Set<string>(
        companies
          .filter(c => c.roles?.includes('Proveedor') || (c as any).type === 'proveedor')
          .map(c => (c.name || c.commercialName || c.legalName || '') as string)
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
    }
    if (field === 'obra') {
      return Array.from(new Set<string>(
        constructionSites
          .map(s => (s.name || '') as string)
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [companies, constructionSites]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowControlsPopover(!showControlsPopover)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm hover:shadow-md active:scale-95 ${showControlsPopover ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
      >
        <Settings className="w-4 h-4" />
        Controles
      </button>
      {showControlsPopover && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowControlsPopover(false)}
          ></div>
          <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-40 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-right min-w-[max-content]">
            <div className="flex flex-wrap items-start gap-6">
              {/* Ordenación */}
              <div className="flex flex-col gap-3 min-w-[140px] relative">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ordenación</span>
                </div>
                
                <button 
                  onClick={() => setShowSortPopover(!showSortPopover)}
                  className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${
                    sortRules.length > 0 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{sortRules.length > 0 ? `${sortRules.length} ${sortRules.length === 1 ? 'Nivel' : 'Niveles'}` : 'Ordenar'}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showSortPopover ? 'rotate-180' : ''}`} />
                </button>

                {showSortPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onMouseDown={() => setShowSortPopover(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4 text-blue-600" />
                          <h3 className="font-bold text-slate-800">Criterios de Ordenación</h3>
                        </div>
                        <button onClick={() => setShowSortPopover(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {sortRules.map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                            <select 
                              value={rule.field}
                              onChange={(e) => {
                                const newRules = [...sortRules];
                                newRules[idx].field = e.target.value as any;
                                setSortRules(newRules);
                              }}
                              className="flex-1 text-[11px] font-bold border border-slate-200 bg-white rounded-xl px-2 py-1.5 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 cursor-pointer"
                            >
                              <option value="fechaSolicitud">{labels.fechaSolicitud}</option>
                              {currentSection !== 'maintenance' && (
                                <option value="fechaTransporte">Fecha Transporte</option>
                              )}
                              <option value="fechaCreacion">{labels.fechaCreacion}</option>
                              <option value="cliente">Cliente</option>
                              <option value="status">{labels.status}</option>
                              <option value="proveedor">{labels.proveedor}</option>
                            </select>
                            <button 
                              onClick={() => {
                                const newRules = [...sortRules];
                                newRules[idx].direction = newRules[idx].direction === 'asc' ? 'desc' : 'asc';
                                setSortRules(newRules);
                              }}
                              className={`p-1.5 rounded-lg transition-all shadow-sm ${rule.direction === 'asc' ? 'text-blue-600 bg-white' : 'text-amber-600 bg-white'}`}
                            >
                              {rule.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {sortRules.length > 1 && (
                              <button onClick={() => setSortRules(sortRules.filter((_, i) => i !== idx))} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button onClick={() => setSortRules([...sortRules, { id: crypto.randomUUID(), field: 'fechaSolicitud', direction: 'desc' }])} className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-xl transition-all flex items-center gap-2">
                          <PlusIcon className="w-4 h-4" /> Añadir Nivel
                        </button>
                        {sortRules.length > 1 && <button onClick={() => setSortRules([{ id: sortRules[0]?.id || crypto.randomUUID(), field: 'fechaSolicitud', direction: 'desc' }])} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-2 hover:bg-red-50 rounded-xl transition-all">Restablecer</button>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-12 w-px bg-slate-100 hidden lg:block"></div>

              {/* Filtros */}
              <div className="flex flex-col gap-3 min-w-[140px] relative">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filtros</span>
                </div>
                <button onClick={() => setShowFilterPopover(!showFilterPopover)} className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${filterRules.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5" />
                    <span>{filterRules.length > 0 ? `${filterRules.length} ${filterRules.length === 1 ? 'Filtro' : 'Filtros'}` : 'Filtrar'}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilterPopover ? 'rotate-180' : ''}`} />
                </button>
                {showFilterPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onMouseDown={() => setShowFilterPopover(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-[450px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-left min-h-[400px]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-indigo-600" />
                          <h3 className="font-bold text-slate-800">Constructor de Filtros</h3>
                        </div>
                        <button onClick={() => setShowFilterPopover(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="space-y-3 pr-2 overflow-visible">
                        {filterRules.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Filter className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No hay filtros activos</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {filterRules.map((rule: any, idx: number) => (
                              <React.Fragment key={rule.id}>
                                {idx > 0 && (
                                  <div className="flex items-center gap-2 px-2 my-1">
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                    <button
                                      onClick={() => activeFilters.updateFilter(filterRules[idx - 1].id, { logicalOperator: filterRules[idx - 1].logicalOperator === 'OR' ? 'AND' : 'OR' })}
                                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-colors ${filterRules[idx - 1].logicalOperator === 'OR' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
                                    >
                                      {filterRules[idx - 1].logicalOperator === 'OR' ? 'O' : 'Y'}
                                    </button>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 border border-slate-200 shadow-sm relative" style={{ zIndex: filterRules.length - idx }}>
                                  <select 
                                    value={rule.field}
                                    onChange={(e) => activeFilters.updateFilter(rule.id, { field: e.target.value as any, value: '' })}
                                    className="text-[11px] font-bold border border-slate-200 bg-white rounded-xl px-2 py-1.5 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 cursor-pointer uppercase min-w-[100px]"
                                  >
                                    <option value="cliente">Cliente</option>
                                    <option value="proveedor">{labels.proveedor}</option>
                                    <option value="obra">Obra</option>
                                    <option value="status">{labels.status}</option>
                                    <option value="fechaSolicitud">{labels.fechaSolicitud}</option>
                                    {currentSection !== 'maintenance' && (
                                      <option value="fechaTransporte">Fecha Transporte</option>
                                    )}
                                    <option value="fechaCreacion">{labels.fechaCreacion}</option>
                                    {currentSection === 'maintenance' && (
                                      <option value="tipoCobro">Tipo de cobro</option>
                                    )}
                                  </select>
                                  <select 
                                    value={rule.operator}
                                    onChange={(e) => activeFilters.updateFilter(rule.id, { operator: e.target.value as any })}
                                    className="text-[11px] font-medium border border-slate-200 bg-white rounded-xl px-2 py-1.5 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 cursor-pointer"
                                  >
                                    <option value="is">es</option>
                                    <option value="contains">contiene</option>
                                    <option value="is_not">no es</option>
                                  </select>
                                  <div className="flex-1">
                                    {['tipoCobro', 'cliente', 'proveedor', 'obra'].includes(rule.field) ? (
                                      <div className="relative w-full">
                                        <div 
                                          className="w-full text-[11px] font-semibold border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center"
                                          onClick={() => setOpenDropdownRuleId(openDropdownRuleId === rule.id ? null : rule.id)}
                                        >
                                          <span className="truncate text-slate-700 max-w-[150px]">
                                            {rule.value ? rule.value.split(',').join(', ') : 'Seleccione...'}
                                          </span>
                                          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                        </div>
                                        {openDropdownRuleId === rule.id && (
                                          <>
                                            <div 
                                              className="fixed inset-0 z-[100]" 
                                              onClick={() => setOpenDropdownRuleId(null)}
                                            />
                                            <div className="absolute left-0 right-0 z-[110] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto py-1 min-w-[200px]">
                                              {getOptionsForField(rule.field).length === 0 ? (
                                                <div className="px-3 py-2 text-[11px] text-slate-400 italic">No hay opciones disponibles</div>
                                              ) : rule.field === 'tipoCobro' ? (
                                                getOptionsForField(rule.field).map((option: string) => {
                                                  const selectedValues = rule.value ? rule.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                                  const isChecked = selectedValues.includes(option);
                                                  return (
                                                    <label 
                                                      key={option} 
                                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer select-none text-[11px] transition-colors"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                          const checked = e.target.checked;
                                                          let nextValues;
                                                          if (checked) {
                                                            nextValues = [...selectedValues, option];
                                                          } else {
                                                            nextValues = selectedValues.filter((v: string) => v !== option);
                                                          }
                                                          activeFilters.updateFilter(rule.id, { value: nextValues.join(',') });
                                                        }}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                                      />
                                                      <span className="font-semibold text-slate-700 truncate">{option}</span>
                                                    </label>
                                                  );
                                                })
                                              ) : (
                                                getOptionsForField(rule.field).map((option: string) => {
                                                  const isSelected = rule.value === option;
                                                  return (
                                                    <div 
                                                      key={option} 
                                                      onClick={() => {
                                                        activeFilters.updateFilter(rule.id, { value: option });
                                                        setOpenDropdownRuleId(null);
                                                      }}
                                                      className={`px-3 py-1.5 text-[11px] font-semibold cursor-pointer select-none transition-colors truncate flex items-center justify-between ${
                                                        isSelected 
                                                          ? 'bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100' 
                                                          : 'text-slate-700 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      <span className="truncate mr-2">{option}</span>
                                                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ) : ['fechaSolicitud', 'fechaTransporte', 'fechaCreacion'].includes(rule.field) ? (
                                      <DatePicker
                                        value={rule.value}
                                        onChange={(val) => activeFilters.updateFilter(rule.id, { value: val })}
                                        placeholder="Valor..."
                                        className="w-full text-[11px] font-semibold border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                                      />
                                    ) : (
                                      <input 
                                        type="text"
                                        value={rule.value}
                                        onChange={(e) => activeFilters.updateFilter(rule.id, { value: e.target.value })}
                                        placeholder="Valor..."
                                        className="w-full text-[11px] font-semibold border-none bg-white rounded-xl px-2 py-1 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                                      />
                                    )}
                                  </div>
                                  <button onClick={() => activeFilters.removeFilter(rule.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button onClick={() => activeFilters.addFilter()} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-xl transition-all flex items-center gap-2">
                          <PlusIcon className="w-4 h-4" /> Añadir Filtro
                        </button>
                        {filterRules.length > 0 && <button onClick={() => activeFilters.clearFilters()} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-2 hover:bg-red-50 rounded-xl transition-all">Borrar todo</button>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="h-12 w-px bg-slate-100 hidden lg:block"></div>

              {/* Agrupación */}
              <div className="flex flex-col gap-3 min-w-[140px] relative">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Agrupación</span>
                </div>
                <button onClick={() => setShowGroupPopover(!showGroupPopover)} className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${groupBy !== 'none' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'}`}>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{groupBy === 'none' ? 'Sin Agrupar' : 'Agrupado'}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showGroupPopover ? 'rotate-180' : ''}`} />
                </button>
                {showGroupPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onMouseDown={() => setShowGroupPopover(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          <h3 className="font-bold text-slate-800">Agrupar por</h3>
                        </div>
                        <button onClick={() => setShowGroupPopover(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {[{ value: 'none', label: 'Sin Agrupación' }, { value: 'cliente', label: 'Por Cliente' }, { value: 'status', label: labels.porStatus }, { value: 'proveedor', label: labels.porProveedor }, { value: 'fechaSolicitud', label: labels.porFechaSolicitud }, { value: 'fechaTransporte', label: 'Por Fecha Transporte'}, { value: 'fechaCreacion', label: labels.porFechaCreacion }]
                          .filter(option => currentSection !== 'maintenance' || option.value !== 'fechaTransporte')
                          .map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setGroupBy(option.value as any); setShowGroupPopover(false); }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${groupBy === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {option.label}
                            {groupBy === option.value && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

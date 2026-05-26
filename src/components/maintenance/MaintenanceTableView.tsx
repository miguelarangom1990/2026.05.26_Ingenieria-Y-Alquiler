import React from 'react';
import { GripVertical, ChevronRight, ChevronDown, Paperclip, Columns3, Search, Eye, EyeOff, Settings2 } from 'lucide-react';
import { MaintenanceCard, MaintenanceStatus, SortRule } from '../../types';
import { MAINTENANCE_STATUS_LABELS } from '../../constants/orders';

import { MAINT_TABLE_COLUMNS_CONFIG } from '../../constants/orders';

const ALL_MAINT_COLUMNS = [
  'id', 'cliente', 'obra', 'equipo', 'idEquipo', 'cantidad', 'status', 'proveedorMant', 'propiedad', 'tipoCobro',
  'fechaEntrega', 'cotProvMantEnviada', 'numCotProvMant', 'aprobacionGerencia',
  'costoMant', 'numOrdenCompraIyA', 'ordenCompraAttachments', 'cobroMantClient', 'cotClientEnviada',
  'valorCotCliente', 'numCotMantCliente', 'aprobClientFactMantenimiento', 'facturaEstado', 'numFacturaMant', 'salidaTallerRealizada',
  'numOrdenMantSalidaT', 'ordenMantSalidaTallerArch', 'reciboTaller', 'cotClienteArch',
  'facturaMantArch', 'cotProvMantArch'
];

interface MaintColumnManagerProps {
  maintTableColOrder: string[];
  setMaintTableColOrder: (cols: string[]) => void;
}

const MaintColumnManager: React.FC<MaintColumnManagerProps> = ({ maintTableColOrder, setMaintTableColOrder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const clickOutside = (ev: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(ev.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const toggleColumnVisibility = (colId: string) => {
    if (maintTableColOrder.includes(colId)) {
      if (maintTableColOrder.length > 1) {
        setMaintTableColOrder(maintTableColOrder.filter(id => id !== colId));
      }
    } else {
      const newOrder: string[] = [];
      ALL_MAINT_COLUMNS.forEach(id => {
        if (maintTableColOrder.includes(id) || id === colId) {
          newOrder.push(id);
        }
      });
      setMaintTableColOrder(newOrder);
    }
  };

  const filteredCols = ALL_MAINT_COLUMNS.filter(colId => {
    const label = MAINT_TABLE_COLUMNS_CONFIG[colId] || colId;
    return label.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-7 h-7 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        title="Mostrar / ocultar columnas"
      >
        <Columns3 className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 text-slate-800 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5" /> Mostrar/Ocultar
            </span>
            <button
              type="button"
              onClick={() => {
                setMaintTableColOrder(ALL_MAINT_COLUMNS);
              }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase cursor-pointer"
            >
              Resetear
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-medium mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Mostrando:</span>
            <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">{maintTableColOrder.length} de {ALL_MAINT_COLUMNS.length} columnas</span>
          </div>

          <div className="relative mb-3 flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar columna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-normal bg-slate-50/50 h-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 font-bold select-none text-[12px]"
              >
                ×
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 text-left">
            {filteredCols.map(colId => {
              const isVisible = maintTableColOrder.includes(colId);
              const label = MAINT_TABLE_COLUMNS_CONFIG[colId] || colId;
              return (
                <div
                  key={colId}
                  onClick={() => toggleColumnVisibility(colId)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`p-1 rounded-md ${isVisible ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'} group-hover:scale-105 transition-transform`}>
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-xs truncate font-medium ${isVisible ? 'text-slate-800' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className={`w-7 h-4 rounded-full transition-colors duration-200 ease-in-out ${isVisible ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm absolute top-0.5 ${isVisible ? 'left-3.5' : 'left-0.5'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredCols.length === 0 && (
              <div className="text-center py-4 text-xs text-slate-400 font-medium">
                No se encontraron columnas
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setMaintTableColOrder(ALL_MAINT_COLUMNS);
              }}
              className="flex-1 text-center py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] text-slate-600 font-bold transition-all cursor-pointer"
            >
              Mostrar Todas
            </button>
            <button
              type="button"
              onClick={() => {
                setMaintTableColOrder([ALL_MAINT_COLUMNS[0]]);
              }}
              className="flex-1 text-center py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] text-slate-600 font-bold transition-all cursor-pointer"
            >
              Ocultar Todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to extract string values for maintenance card columns
const getCardColText = (card: MaintenanceCard, colId: string): string => {
  switch (colId) {
    case 'id':
      return card.id ? `#${card.id.slice(0, 8)}` : '';
    case 'cliente':
      return card.cliente && card.cliente !== 'Sin cliente'
        ? card.cliente
        : Array.from(new Set(card.items?.map((i: any) => i.clienteCobro).filter(Boolean))).join(', ') || card.cliente || '';
    case 'obra':
      return card.obra && card.obra !== 'Mantenimiento Interno'
        ? card.obra
        : Array.from(new Set(card.items?.map((i: any) => i.obraCobro).filter(Boolean))).join(', ') || card.obra || '';
    case 'equipo':
      return card.nombre || Array.from(new Set(card.items?.map((i: any) => i.equipo).filter(Boolean))).join(', ') || '';
    case 'idEquipo':
      return Array.from(new Set(card.items?.map((i: any) => i.idEquipo).filter(Boolean))).join(', ');
    case 'cantidad':
      return card.items?.length?.toString() || '';
    case 'status':
      return MAINTENANCE_STATUS_LABELS[card.status as MaintenanceStatus] || card.status || '';
    case 'proveedorMant':
      return Array.from(new Set(card.items?.map((i: any) => i.proveedorMantenimiento).filter(Boolean))).join(', ');
    case 'propiedad':
      return Array.from(new Set(card.items?.map((i: any) => i.propiedadEquipo || 'Propio'))).join(', ');
    case 'tipoCobro':
      return Array.from(new Set(card.items?.flatMap((i: any) => i.tipoCobro || []).filter(Boolean))).join(', ');
    case 'fechaEntrega':
      return card.fechaIngreso || '';
    case 'solicitudCotProv':
      return Array.from(new Set(card.items?.map((i: any) => i.solicitudCotProv).filter(Boolean))).join(', ');
    case 'cotProvMantEnviada':
      return Array.from(new Set(card.items?.map((i: any) => i.cotProvMantEnviada).filter(Boolean))).join(', ');
    case 'numCotProvMant':
      return Array.from(new Set(card.items?.map((i: any) => i.numCotProvMant).filter(Boolean))).join(', ');
    case 'aprobacionGerencia':
      return Array.from(new Set(card.items?.map((i: any) => i.aprobacionGerencia).filter(Boolean))).join(', ');
    case 'costoMant': {
      const sum = card.items?.reduce((acc: number, i: any) => acc + (Number(i.costoMantenimiento) || Number(i.costoMant) || 0), 0) || 0;
      return sum ? `$${sum.toLocaleString()}` : '';
    }
    case 'numOrdenCompraIyA':
      return Array.from(new Set(card.items?.map((i: any) => i.numOrdenCompraIyA).filter(Boolean))).join(', ');
    case 'ordenCompraAttachments':
      return (card.items?.flatMap((i: any) => i.ordenCompraAttachments || []) || []).map((f: any) => f.name).join(', ');
    case 'cobroMantClient':
      return Array.from(new Set(card.items?.map((i: any) => i.cobroMantClient).filter(Boolean))).join(', ');
    case 'cotClientEnviada':
      return Array.from(new Set(card.items?.map((i: any) => i.cotClientEnviada).filter(Boolean))).join(', ');
    case 'valorCotCliente': {
      const sum = card.items?.reduce((acc: number, i: any) => acc + (Number(i.valorCotizadoCliente) || Number(i.valorCotCliente) || Number(i.valorCobradoCliente) || 0), 0) || 0;
      return sum ? `$${sum.toLocaleString()}` : '';
    }
    case 'numCotMantCliente':
      return Array.from(new Set(card.items?.map((i: any) => i.numCotMantCliente).filter(Boolean))).join(', ');
    case 'aprobClientFactMantenimiento':
      return Array.from(new Set(card.items?.map((i: any) => i.aprobClientFactMantenimiento).filter(Boolean))).join(', ');
    case 'facturaEstado':
      return Array.from(new Set(card.items?.map((i: any) => i.facturaEstado).filter(Boolean))).join(', ');
    case 'numFacturaMant':
      return Array.from(new Set(card.items?.map((i: any) => i.numFacturaMant).filter(Boolean))).join(', ');
    case 'salidaTallerRealizada':
      return Array.from(new Set(card.items?.map((i: any) => i.salidaTallerRealizada).filter(Boolean))).join(', ');
    case 'numOrdenMantSalidaT':
      return Array.from(new Set(card.items?.map((i: any) => i.numOrdenMantSalidaT).filter(Boolean))).join(', ');
    case 'ordenMantSalidaTallerArch':
      return (card.items?.flatMap((i: any) => i.ordenMantSalidaTallerArchivos || []) || []).map((f: any) => f.name).join(', ');
    case 'reciboTaller':
      return (card.items?.flatMap((i: any) => i.recibosTaller || []) || []).map((f: any) => f.name).join(', ');
    case 'cotClienteArch':
      return (card.items?.flatMap((i: any) => i.cotClienteAttachments || []) || []).map((f: any) => f.name).join(', ');
    case 'facturaMantArch':
      return (card.items?.flatMap((i: any) => i.facturaArchivos || []) || []).map((f: any) => f.name).join(', ');
    case 'cotProvMantArch':
      return (card.items?.flatMap((i: any) => i.archivosAdjuntos || []) || []).map((f: any) => f.name).join(', ');
    default:
      return '';
  }
};

interface SearchableTableFilterProps {
  colId: string;
  value: string;
  onChange: (val: string) => void;
  allCards: MaintenanceCard[];
}

const SearchableTableFilter: React.FC<SearchableTableFilterProps> = ({
  colId,
  value,
  onChange,
  allCards
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Compute unique values alphabetically
  const uniqueVal = React.useMemo(() => {
    const valuesSet = new Set<string>();
    allCards.forEach(card => {
      const text = getCardColText(card, colId);
      if (!text || text === '-') return;
      
      // Split on comma to get individual options for lists that join multiple items
      if (['cliente', 'obra', 'equipo', 'idEquipo', 'proveedorMant', 'propiedad', 'tipoCobro', 'solicitudCotProv', 'cotProvMantEnviada', 'numCotProvMant', 'aprobacionGerencia', 'numOrdenCompraIyA', 'cobroMantClient', 'cotClientEnviada', 'aprobClientFactMantenimiento', 'facturaEstado', 'numFacturaMant', 'salidaTallerRealizada', 'numOrdenMantSalidaT', 'ordenCompraAttachments', 'ordenMantSalidaTallerArch', 'reciboTaller', 'cotClienteArch', 'facturaMantArch', 'cotProvMantArch'].includes(colId)) {
        text.split(',').forEach(v => {
          const trimmed = v.trim();
          if (trimmed && trimmed !== '-') {
            valuesSet.add(trimmed);
          }
        });
      } else {
        const trimmed = text.trim();
        if (trimmed && trimmed !== '-') {
          valuesSet.add(trimmed);
        }
      }
    });
    return Array.from(valuesSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [allCards, colId]);

  // Filter suggestions matching typed input
  const filteredSuggestions = React.useMemo(() => {
    if (!value) return uniqueVal;
    const lowerVal = value.toLowerCase();
    return uniqueVal.filter(v => v.toLowerCase().includes(lowerVal));
  }, [uniqueVal, value]);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar..."
          className="w-full text-[10px] px-1.5 py-0.5 pr-5 border border-slate-200 bg-white text-slate-800 rounded-md focus:outline-none focus:border-indigo-500 font-normal shadow-sm h-7"
        />
        {value && (
          <button 
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-1.5 text-slate-400 hover:text-slate-600 font-bold select-none text-[12px] leading-none text-center"
            title="Limpiar"
          >
            ×
          </button>
        )}
      </div>
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-[10px] text-slate-700 font-medium custom-scrollbar min-w-[150px]">
          {filteredSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors truncate border-b border-slate-50 last:border-0"
              onClick={() => {
                onChange(suggestion);
                setIsOpen(false);
              }}
              title={suggestion}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface MaintenanceTableViewProps {
  processedMaintenanceData: { groups: { key: string; label: string; items: MaintenanceCard[] }[] };
  selectedMaintenanceIds: Set<string>;
  setSelectedMaintenanceIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setMaintenanceViewMode: (mode: 'detailed' | 'simplified') => void;
  maintTableColOrder: string[];
  setMaintTableColOrder: React.Dispatch<React.SetStateAction<string[]>>;
  maintDraggedColId: string | null;
  setMaintDraggedColId: React.Dispatch<React.SetStateAction<string | null>>;
  columnWidths: Record<string, number>;
  setColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  toggleOrderExpansion: (id: string, e?: React.MouseEvent) => void;
  expandedOrders: Set<string>;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
}

export const MaintenanceTableView: React.FC<MaintenanceTableViewProps> = ({
  processedMaintenanceData,
  selectedMaintenanceIds,
  setSelectedMaintenanceIds,
  setViewingMaintenanceCard,
  setMaintenanceViewMode,
  maintTableColOrder,
  setMaintTableColOrder,
  maintDraggedColId,
  setMaintDraggedColId,
  columnWidths,
  setColumnWidths,
  toggleOrderExpansion,
  expandedOrders,
  sortRules,
  setSortRules
}) => {
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({});

  const allCards = React.useMemo(() => {
    return processedMaintenanceData.groups.flatMap(g => g.items);
  }, [processedMaintenanceData]);

  const filteredCards = React.useMemo(() => {
    return allCards.filter(card => {
      return Object.entries(columnFilters).every(([colId, filterVal]) => {
        const valStr = filterVal as string;
        if (!valStr || valStr.trim() === '') return true;
        const colText = getCardColText(card, colId).toLowerCase();
        return colText.includes(valStr.toLowerCase().trim());
      });
    });
  }, [allCards, columnFilters]);

  const handleDragStartCol = (e: React.DragEvent, colId: string) => {
    setMaintDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropCol = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (maintDraggedColId && maintDraggedColId !== targetColId) {
      const draggedIndex = maintTableColOrder.indexOf(maintDraggedColId);
      const targetIndex = maintTableColOrder.indexOf(targetColId);
      const newOrder = [...maintTableColOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, maintDraggedColId);
      setMaintTableColOrder(newOrder);
    }
    setMaintDraggedColId(null);
  };

  const handleHeaderSortClick = (colId: string, e: React.MouseEvent) => {
    if (maintDraggedColId) return;

    const isShiftPressed = e.shiftKey;
    const existingIdx = sortRules.findIndex(r => r.field === colId);
    let newRules = [...sortRules];

    if (isShiftPressed) {
      if (existingIdx !== -1) {
        const existingRule = sortRules[existingIdx];
        if (existingRule.direction === 'asc') {
          newRules[existingIdx] = { ...existingRule, direction: 'desc' };
        } else {
          newRules.splice(existingIdx, 1);
        }
      } else {
        const newRule = { id: crypto.randomUUID(), field: colId, direction: 'asc' as const };
        if (newRules.length >= 3) {
          newRules.shift();
        }
        newRules.push(newRule);
      }
    } else {
      if (existingIdx !== -1) {
        if (sortRules.length === 1) {
          const existingRule = sortRules[0];
          if (existingRule.direction === 'asc') {
            newRules = [{ ...existingRule, direction: 'desc' }];
          } else {
            newRules = [];
          }
        } else {
          newRules = [{ id: sortRules[existingIdx].id || crypto.randomUUID(), field: colId, direction: 'asc' as const }];
        }
      } else {
        newRules = [{ id: crypto.randomUUID(), field: colId, direction: 'asc' as const }];
      }
    }

    setSortRules(newRules);
  };

  const handleResizeMouseDown = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.currentTarget.parentElement;
    if (!th) return;
    const startX = e.pageX;
    const startWidth = th.getBoundingClientRect().width;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      setColumnWidths(prev => ({ ...prev, [colId]: newWidth }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderCellWithColId = (colId: string, card: MaintenanceCard, type: 'main' | 'equipment', contextItem?: any) => {
    const isMain = type === 'main';
    const isEq = type === 'equipment';
    
    const v = (content: React.ReactNode, extraClass?: string, title?: string) => (
      <td 
        key={`${isMain ? card.id : contextItem?.id}-${colId}`} 
        className={`p-4 ${extraClass || ''}`}
        style={columnWidths[colId] ? { width: columnWidths[colId], minWidth: columnWidths[colId], maxWidth: columnWidths[colId] } : { minWidth: 150 }}
        title={title}
      >
        {content}
      </td>
    );

    const renderFilesList = (fieldName: string) => {
      const files: any[] = isMain
        ? (card.items?.flatMap((i: any) => i[fieldName] || []) || []).filter(Boolean)
        : isEq ? (contextItem?.[fieldName] || []) : [];

      if (!files || files.length === 0) return v('-');

      return v(
        <div className="flex flex-wrap gap-1 items-center max-w-full">
          {files.map((file: any) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5 bg-indigo-50/50 hover:bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 max-w-[120px] truncate"
              title={file.name}
              onClick={(e) => e.stopPropagation()}
            >
              <Paperclip className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{file.name}</span>
            </a>
          ))}
        </div>
      );
    };

    switch (colId) {
      case 'id': return v(isMain ? `#${card.id?.slice(0, 8)}` : '-', 'font-mono text-xs text-slate-500');
      case 'cliente': {
          const text = isMain 
            ? (card.cliente && card.cliente !== 'Sin cliente' ? card.cliente : Array.from(new Set(card.items?.map((i: any) => i.clienteCobro).filter(Boolean))).join(', ') || '-') 
            : (contextItem?.clienteCobro || '-');
          return v(text, isMain ? 'text-slate-900 font-medium truncate' : 'text-slate-500 truncate', text);
      }
      case 'obra': {
          const text = isMain 
            ? (card.obra && card.obra !== 'Mantenimiento Interno' ? card.obra : Array.from(new Set(card.items?.map((i: any) => i.obraCobro).filter(Boolean))).join(', ') || card.obra || '-') 
            : (contextItem?.obraCobro || '-');
          return v(text, isMain ? 'text-slate-600 truncate' : 'text-slate-500 truncate', text);
      }
      case 'equipo': {
          const text = isMain ? (card.nombre || card.items[0]?.equipo || '-') :
                      isEq ? contextItem.equipo : '-';
          return v(text, `truncate ${isEq ? 'text-slate-900 font-medium' : 'text-slate-600'}`, text);
      }
      case 'idEquipo': {
          const text = isMain ? (card.items[0]?.idEquipo || '-') :
                      isEq ? (contextItem.idEquipo || '-') : '-';
          return v(text, `truncate ${isEq ? 'text-slate-900 font-medium' : 'text-slate-600'}`, text);
      }
      case 'cantidad': {
          const text = isMain ? (card.items.length || '-') :
                      isEq ? contextItem.cantidad : '-';
          return v(text, `truncate ${isMain ? '' : 'text-slate-900 font-medium'}`, text?.toString());
      }
      case 'status': 
        return v(
          isMain ? (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
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
          ) : '-'
        );
      case 'proveedorMant': {
          const text = isMain ? (Array.from(new Set(card.items.map((i: any) => i.proveedorMantenimiento).filter(Boolean))).join(', ') || '-') :
                      isEq ? (contextItem.proveedorMantenimiento || '-') : '-';
          return v(text, isMain ? 'truncate text-slate-600' : 'truncate font-medium text-slate-900');
      }
      case 'propiedad': {
          const text = isMain 
            ? (Array.from(new Set(card.items?.map((i: any) => i.propiedadEquipo || 'Propio'))).join(', ') || '-') 
            : isEq ? (contextItem?.propiedadEquipo || 'Propio') : '-';
          return v(text, 'truncate', text);
      }
      case 'tipoCobro': {
          const text = isMain 
            ? (Array.from(new Set(card.items?.flatMap((i: any) => i.tipoCobro || []).filter(Boolean))).join(', ') || '-') 
            : isEq ? (contextItem?.tipoCobro?.join(', ') || '-') : '-';
          return v(text, 'truncate', text);
      }
      case 'fechaEntrega': {
          const text = isMain 
            ? (card.fechaIngreso || '-') 
            : isEq ? (contextItem?.fechaEntregaTaller || contextItem?.fechaEntregaSolicitada || '-') : '-';
          return v(text, 'truncate', text);
      }
      case 'solicitudCotProv': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.solicitudCotProv).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.solicitudCotProv || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'cotProvMantEnviada': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.cotProvMantEnviada).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.cotProvMantEnviada || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'numCotProvMant': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.numCotProvMant).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.numCotProvMant || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'aprobacionGerencia': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.aprobacionGerencia).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.aprobacionGerencia || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'costoMant': {
        const text = isMain 
          ? (card.items?.reduce((acc: number, i: any) => acc + (Number(i.costoMantenimiento) || Number(i.costoMant) || 0), 0) || '-') 
          : isEq ? (contextItem?.costoMantenimiento || contextItem?.costoMant || '-') : '-';
        const formatted = typeof text === 'number' ? `$${text.toLocaleString()}` : text;
        return v(formatted, 'truncate text-slate-600 font-mono', formatted?.toString());
      }
      case 'numOrdenCompraIyA': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.numOrdenCompraIyA).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.numOrdenCompraIyA || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'ordenCompraAttachments': {
        return renderFilesList('ordenCompraAttachments');
      }
      case 'cobroMantClient': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.cobroMantClient).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.cobroMantClient || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'cotClientEnviada': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.cotClientEnviada).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.cotClientEnviada || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'valorCotCliente': {
        const text = isMain 
          ? (card.items?.reduce((acc: number, i: any) => acc + (Number(i.valorCotizadoCliente) || Number(i.valorCotCliente) || Number(i.valorCobradoCliente) || 0), 0) || '-') 
          : isEq ? (contextItem?.valorCotizadoCliente || contextItem?.valorCotCliente || contextItem?.valorCobradoCliente || '-') : '-';
        const formatted = typeof text === 'number' ? `$${text.toLocaleString()}` : text;
        return v(formatted, 'truncate text-slate-600 font-mono', formatted?.toString());
      }
      case 'numCotMantCliente': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.numCotMantCliente).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.numCotMantCliente || '-') : '-';
        return v(text, 'truncate text-slate-600 font-mono', text);
      }
      case 'aprobClientFactMantenimiento': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.aprobClientFactMantenimiento).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.aprobClientFactMantenimiento || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'facturaEstado': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.facturaEstado).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.facturaEstado || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'numFacturaMant': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.numFacturaMant).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.numFacturaMant || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'salidaTallerRealizada': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.salidaTallerRealizada).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.salidaTallerRealizada || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'numOrdenMantSalidaT': {
        const text = isMain 
          ? (Array.from(new Set(card.items?.map((i: any) => i.numOrdenMantSalidaT).filter(Boolean))).join(', ') || '-') 
          : isEq ? (contextItem?.numOrdenMantSalidaT || '-') : '-';
        return v(text, 'truncate', text);
      }
      case 'ordenMantSalidaTallerArch': {
        return renderFilesList('ordenMantSalidaTallerArchivos');
      }
      case 'reciboTaller': {
        return renderFilesList('recibosTaller');
      }
      case 'cotClienteArch': {
        return renderFilesList('cotClienteAttachments');
      }
      case 'facturaMantArch': {
        return renderFilesList('facturaArchivos');
      }
      case 'cotProvMantArch': {
        return renderFilesList('archivosAdjuntos');
      }
      default: return v('-');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 min-h-[200px]">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-max min-w-full text-left border-collapse whitespace-nowrap table-fixed">
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0]">
            {/* Row of dropdown filters above header labels */}
            <tr className="bg-slate-50 select-none border-b border-slate-100">
              <th className="p-1 sticky left-0 bg-slate-50 z-30 border-r border-slate-100 w-16 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <MaintColumnManager maintTableColOrder={maintTableColOrder} setMaintTableColOrder={setMaintTableColOrder} />
                  {Object.values(columnFilters).some(v => v !== '') && (
                    <button 
                      type="button" 
                      onClick={() => setColumnFilters({})}
                      className="text-[9px] bg-red-50 text-red-600 hover:bg-slate-100 border border-red-200 rounded px-1 py-0.5 font-bold uppercase tracking-wider transition-colors"
                      title="Limpiar todos los filtros"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </th>
              {maintTableColOrder.map(colId => (
                <th 
                  key={`filter-th-${colId}`} 
                  style={columnWidths[colId] ? { width: columnWidths[colId], minWidth: columnWidths[colId], maxWidth: columnWidths[colId] } : { minWidth: 150 }}
                  className="p-2 sticky bg-slate-50 z-10 border-b border-slate-200/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchableTableFilter
                    colId={colId}
                    value={columnFilters[colId] || ''}
                    onChange={(val) => setColumnFilters(prev => ({ ...prev, [colId]: val }))}
                    allCards={allCards}
                  />
                </th>
              ))}
            </tr>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 select-none">
              <th className="p-4 font-semibold w-16 sticky left-0 bg-slate-50 z-20 border-r border-slate-100">
                <div className="flex items-center justify-center gap-2">
                  <input 
                    type="checkbox"
                    checked={filteredCards.length > 0 && selectedMaintenanceIds.size === filteredCards.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMaintenanceIds(new Set(filteredCards.map(o => o.id)));
                      } else {
                        setSelectedMaintenanceIds(new Set());
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </th>
              {maintTableColOrder.map(colId => {
                const idx = sortRules.findIndex(r => r.field === colId);
                const isSorted = idx !== -1;
                const rule = isSorted ? sortRules[idx] : null;
                return (
                  <th 
                    key={colId} 
                    style={columnWidths[colId] ? { width: columnWidths[colId], minWidth: columnWidths[colId], maxWidth: columnWidths[colId] } : { minWidth: 150 }}
                    className={`relative p-4 font-semibold group cursor-pointer select-none transition-colors ${maintDraggedColId === colId ? 'opacity-50 border border-indigo-300 bg-indigo-50/50' : 'hover:bg-slate-100'}`}
                    draggable
                    onDragStart={(e) => handleDragStartCol(e, colId)}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => handleDropCol(e, colId)}
                    onClick={(e) => handleHeaderSortClick(colId, e)}
                    title="Clic para ordenar. Shift + Clic para agregar criterios (máx. 3)"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="truncate">{MAINT_TABLE_COLUMNS_CONFIG[colId] || colId}</span>
                        {isSorted && rule && (
                          <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold border border-indigo-100/50 shadow-sm shrink-0">
                            {rule.direction === 'asc' ? '↑' : '↓'}
                            {sortRules.length > 1 && (
                              <span className="text-[8px] bg-indigo-150 text-indigo-600 rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono shrink-0">
                                {idx + 1}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="w-3 h-3 text-slate-300 cursor-grab active:cursor-grabbing" />
                      </div>
                    </div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-300 active:bg-indigo-500 transition-colors z-10"
                      onMouseDown={(e) => handleResizeMouseDown(colId, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCards.map(card => (
              <React.Fragment key={card.id}>
                <tr 
                  className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${selectedMaintenanceIds.has(card.id) ? 'bg-indigo-50/30' : ''}`}
                  onClick={() => { setViewingMaintenanceCard(card); setMaintenanceViewMode('simplified'); }}
                >
                  <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMaintenanceIds.has(card.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSet = new Set(selectedMaintenanceIds);
                          if (e.target.checked) newSet.add(card.id);
                          else newSet.delete(card.id);
                          setSelectedMaintenanceIds(newSet);
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleOrderExpansion(card.id, e); }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        {expandedOrders.has(card.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  {maintTableColOrder.map(colId => renderCellWithColId(colId, card, 'main'))}
                </tr>
                
                {expandedOrders.has(card.id) && card.items.map((item) => (
                  <tr key={`${card.id}-item-${item.id}`} className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors border-b border-slate-100 last:border-0 relative">
                    <td className="p-4 text-center text-indigo-300 border-r border-slate-100/50">↳</td>
                    {maintTableColOrder.map(colId => renderCellWithColId(colId, card, 'equipment', item))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

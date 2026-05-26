import React from 'react';
import { Trash2, ChevronUp, ChevronDown, ArrowUpDown, Columns3, Search, Eye, EyeOff, Settings2 } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { STATUS_LABELS, getProviderSummary } from '../../lib/orderUtils';

import { TABLE_COLUMNS_CONFIG } from '../../constants/orders';

const ALL_ORDER_COLUMNS = [
  'id', 'nombre', 'cliente', 'destino', 'fecha', 'estado', 'tipoTransp', 'equipo', 'cantidad', 'proveedor',
  'transportista', 'tipoVehiculo', 'razonTransp', 'cobroTransp',
  'fTranspSub', 'fCobroSub', 'numAlterno', 'otrosAdjuntos', 'rmDvAdjuntos', 'notas'
];

interface ColumnManagerProps {
  tableColOrder: string[];
  setTableColOrder: (cols: string[]) => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({ tableColOrder, setTableColOrder }) => {
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
    if (tableColOrder.includes(colId)) {
      if (tableColOrder.length > 1) {
        setTableColOrder(tableColOrder.filter(id => id !== colId));
      }
    } else {
      const newOrder: string[] = [];
      ALL_ORDER_COLUMNS.forEach(id => {
        if (tableColOrder.includes(id) || id === colId) {
          newOrder.push(id);
        }
      });
      setTableColOrder(newOrder);
    }
  };

  const filteredCols = ALL_ORDER_COLUMNS.filter(colId => {
    const label = TABLE_COLUMNS_CONFIG[colId] || colId;
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
                setTableColOrder(ALL_ORDER_COLUMNS);
              }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase cursor-pointer"
            >
              Resetear
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-medium mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Mostrando:</span>
            <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">{tableColOrder.length} de {ALL_ORDER_COLUMNS.length} columnas</span>
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
              const isVisible = tableColOrder.includes(colId);
              const label = TABLE_COLUMNS_CONFIG[colId] || colId;
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
                setTableColOrder(ALL_ORDER_COLUMNS);
              }}
              className="flex-1 text-center py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] text-slate-600 font-bold transition-all cursor-pointer"
            >
              Mostrar Todas
            </button>
            <button
              type="button"
              onClick={() => {
                setTableColOrder([ALL_ORDER_COLUMNS[0]]);
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

const getOrderColText = (order: Order, colId: string): string => {
  switch (colId) {
    case 'id':
      return order.id ? `#${order.id.slice(0, 8)}` : '';
    case 'nombre':
      return order.nombre || '';
    case 'cliente':
      return order.cliente || '';
    case 'destino':
      return order.destino || '';
    case 'fecha':
      return order.fecha || '';
    case 'estado':
      return STATUS_LABELS[order.status as OrderStatus] || order.status || '';
    case 'tipoTransp':
      return order.tipoTransporte || '';
    case 'equipo':
      return order.items?.map((i: any) => i.equipo).filter(Boolean).join(', ') || '';
    case 'cantidad':
      return order.items?.map((i: any) => i.cantidad).filter((x: any) => x !== undefined && x !== null).join(', ') || '';
    case 'proveedor':
      return Array.from(new Set(order.items?.map((i: any) => i.proveedor).filter(Boolean))).join(', ') || '';
    case 'fTranspSub':
      return getProviderSummary(order, 'fechaTransporteSub') || '';
    case 'fCobroSub':
      return getProviderSummary(order, 'fechaCobroSub') || '';
    case 'numAlterno':
      return getProviderSummary(order, 'numAlterno') || '';
    case 'otrosAdjuntos': {
      const cnt = Object.values(order.transportInfo?.providerAttachments || {}).flat().length;
      return cnt > 0 ? `${cnt} archivo(s)` : '';
    }
    case 'rmDvAdjuntos': {
      const cnt = Object.values(order.transportInfo?.providerRmDvAttachments || {}).flat().length;
      return cnt > 0 ? `${cnt} archivo(s)` : '';
    }
    case 'transportista':
      return order.logisticsInfo?.transportista || '';
    case 'tipoVehiculo':
      return order.logisticsInfo?.tipoVehiculo || '';
    case 'razonTransp': {
      const val = order.logisticsInfo?.razonTransporte;
      return Array.isArray(val) ? val.join(', ') : (val || '');
    }
    case 'cobroTransp':
      return order.logisticsInfo?.cobroTransporte || '';
    case 'notas':
      return order.logisticsInfo?.notas || '';
    default:
      return '';
  }
};

interface SearchableOrderTableFilterProps {
  colId: string;
  value: string;
  onChange: (val: string) => void;
  allOrders: Order[];
}

const SearchableOrderTableFilter: React.FC<SearchableOrderTableFilterProps> = ({
  colId,
  value,
  onChange,
  allOrders
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Compute unique values alphabetically
  const uniqueVal = React.useMemo(() => {
    const valuesSet = new Set<string>();
    allOrders.forEach(order => {
      const text = getOrderColText(order, colId);
      if (!text || text === '-') return;
      
      // Split on comma to get individual options for columns containing lists
      if (['equipo', 'proveedor', 'razonTransp'].includes(colId)) {
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
  }, [allOrders, colId]);

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

interface OrdersTableViewProps {
  sortedHistory: Order[];
  selectedOrderIds: Set<string>;
  setSelectedOrderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  deleteOrder: (id: string) => void;
  setConfirmDialog: (config: { isOpen: boolean; message: string; onConfirm: () => void }) => void;
  setViewingOrder: (order: Order | null) => void;
  toggleOrderExpansion: (id: string, e?: React.MouseEvent) => void;
  expandedOrders: Set<string>;
  tableColOrder: string[];
  setTableColOrder: React.Dispatch<React.SetStateAction<string[]>>;
  draggedColId: string | null;
  setDraggedColId: React.Dispatch<React.SetStateAction<string | null>>;
  tableColWidths: Record<string, number>;
  setTableColWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  tableExpandMode: 'equipment' | 'provider';
}

export const OrdersTableView: React.FC<OrdersTableViewProps> = ({
  sortedHistory,
  selectedOrderIds,
  setSelectedOrderIds,
  deleteOrder,
  setConfirmDialog,
  setViewingOrder,
  toggleOrderExpansion,
  expandedOrders,
  tableColOrder,
  setTableColOrder,
  draggedColId,
  setDraggedColId,
  tableColWidths,
  setTableColWidths,
  tableExpandMode
}) => {
  const [columnFilters, setColumnFilters] = React.useState<Record<string, string>>({});

  const filteredHistory = React.useMemo(() => {
    return sortedHistory.filter(order => {
      return Object.entries(columnFilters).every(([colId, filterVal]) => {
        const valStr = filterVal as string;
        if (!valStr || valStr.trim() === '') return true;
        const colText = getOrderColText(order, colId).toLowerCase();
        return colText.includes(valStr.toLowerCase().trim());
      });
    });
  }, [sortedHistory, columnFilters]);

  const handleDragStartCol = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropCol = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (draggedColId && draggedColId !== targetColId) {
      const draggedIndex = tableColOrder.indexOf(draggedColId);
      const targetIndex = tableColOrder.indexOf(targetColId);
      const newOrder = [...tableColOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColId);
      setTableColOrder(newOrder);
    }
    setDraggedColId(null);
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
      setTableColWidths(prev => ({ ...prev, [colId]: newWidth }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderCellWithColId = (colId: string, order: Order, rowType: 'main' | 'equipment' | 'provider', contextItem: any = null) => {
    const isMain = rowType === 'main';
    const isEq = rowType === 'equipment';
    const isProv = rowType === 'provider';
    
    const style = tableColWidths[colId] ? { width: tableColWidths[colId], minWidth: tableColWidths[colId], maxWidth: tableColWidths[colId] } : { minWidth: 150 };
    
    const v = (content: any, classNames: string = "", title?: string) => (
      <td 
        key={`${order.id}-${rowType}-${colId}-${contextItem ? contextItem.id || contextItem.proveedor || '' : ''}`} 
        className={`p-4 text-sm text-slate-600 ${isMain ? 'cursor-pointer' : ''} ${classNames}`} 
        onClick={isMain ? () => setViewingOrder(order) : undefined}
        title={title}
        style={style}
      >
        {content}
      </td>
    );

    switch (colId) {
      case 'id': return v(<span className="font-mono">{order.id?.slice(0, 8)}</span>, isMain ? 'text-slate-600' : 'text-slate-500');
      case 'nombre': return v(order.nombre || '-', isMain ? 'text-slate-900 font-medium truncate' : 'text-slate-500 font-medium truncate');
      case 'cliente': return v(order.cliente, isMain ? 'text-slate-600 truncate' : 'text-slate-500 truncate');
      case 'destino': return v(order.destino, isMain ? 'text-slate-600 truncate' : 'text-slate-500 truncate');
      case 'fecha': return v(order.fecha, isMain ? 'text-slate-600 truncate' : 'text-slate-500 truncate');
      case 'estado': 
        return v(
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!isMain ? 'opacity-70' : ''} ${
            order.status === 'PEDIDO' ? 'bg-slate-100 text-slate-800' :
            order.status === 'EN_LOGISTICA' ? 'bg-emerald-100 text-emerald-800' :
            order.status === 'EN_TRANSPORTE' ? 'bg-blue-100 text-blue-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {isMain ? (STATUS_LABELS[order.status as OrderStatus] || order.status) : order.status.replace('_', ' ')}
          </span>
        );
      case 'tipoTransp': return v(order.tipoTransporte || '-', 'uppercase truncate ' + (isMain ? '' : 'text-slate-500'));
      case 'equipo': {
          const text = isMain ? (order.items.map((i: any) => i.equipo).join(', ') || '-') :
                      isEq ? contextItem.equipo :
                      isProv ? contextItem.equipos.join(', ') : '-';
          return v(text, `truncate ${isMain ? '' : (isProv ? 'text-slate-900 font-medium' : 'text-slate-900 font-medium')}`, isMain || isProv ? text : undefined);
      }
      case 'cantidad': {
          const text = isMain ? (order.items.map((i: any) => i.cantidad).join(', ') || '-') :
                      isEq ? contextItem.cantidad :
                      isProv ? contextItem.cantidadTotal : '-';
          return v(text, `truncate ${isMain ? '' : 'text-slate-900 font-medium'}`, isMain ? text : undefined);
      }
      case 'proveedor': {
          const text = isMain ? (Array.from(new Set(order.items.map((i: any) => i.proveedor).filter(Boolean))).join(', ') || '-') :
                      isEq ? (contextItem.proveedor || '-') :
                      isProv ? (contextItem.proveedor === 'Sin Proveedor' ? '-' : contextItem.proveedor) : '-';
          return v(text, `truncate ${!isMain ? 'text-slate-900 font-medium' : ''}`, isMain ? text : undefined);
      }
      case 'fTranspSub': {
          const text = isMain ? getProviderSummary(order, 'fechaTransporteSub') :
                      (isEq && contextItem.proveedor) ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.fechaTransporteSub || '-') :
                      (isProv && contextItem.proveedor !== 'Sin Proveedor') ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.fechaTransporteSub || '-') : '-';
          const isMissing = !!(text.match(/\((\d+)\/(\d+)\)/) && text.match(/\((\d+)\/(\d+)\)/)?.[1] !== text.match(/\((\d+)\/(\d+)\)/)?.[2]);
          return v(text, isMissing ? '!text-red-500 font-bold truncate' : (!isMain ? 'text-slate-500 truncate' : 'truncate'));
      }
      case 'fCobroSub': {
          const text = isMain ? getProviderSummary(order, 'fechaCobroSub') :
                      (isEq && contextItem.proveedor) ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.fechaCobroSub || '-') :
                      (isProv && contextItem.proveedor !== 'Sin Proveedor') ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.fechaCobroSub || '-') : '-';
          const isMissing = !!(text.match(/\((\d+)\/(\d+)\)/) && text.match(/\((\d+)\/(\d+)\)/)?.[1] !== text.match(/\((\d+)\/(\d+)\)/)?.[2]);
          return v(text, isMissing ? '!text-red-500 font-bold truncate' : (!isMain ? 'text-slate-500 truncate' : 'truncate'));
      }
      case 'numAlterno': {
          const text = isMain ? getProviderSummary(order, 'numAlterno') :
                      (isEq && contextItem.proveedor) ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.numAlterno || '-') :
                      (isProv && contextItem.proveedor !== 'Sin Proveedor') ? (order.transportInfo?.providerData?.[contextItem.proveedor]?.numAlterno || '-') : '-';
          const isMissing = !!(text.match(/\((\d+)\/(\d+)\)/) && text.match(/\((\d+)\/(\d+)\)/)?.[1] !== text.match(/\((\d+)\/(\d+)\)/)?.[2]);
          return v(text, isMissing ? '!text-red-500 font-bold truncate' : (!isMain ? 'text-slate-500 truncate' : 'truncate'));
      }
      case 'otrosAdjuntos': {
          const textArea = isMain ? (Object.values(order.transportInfo?.providerAttachments || {}).flat().length > 0 ? `${Object.values(order.transportInfo?.providerAttachments || {}).flat().length} archivo(s)` : '-') :
                          (isEq && contextItem.proveedor && order.transportInfo?.providerAttachments?.[contextItem.proveedor]?.length) ? `${order.transportInfo.providerAttachments[contextItem.proveedor].length} archivo(s)` :
                          (isProv && contextItem.proveedor !== 'Sin Proveedor' && order.transportInfo?.providerAttachments?.[contextItem.proveedor]?.length) ? `${order.transportInfo.providerAttachments[contextItem.proveedor].length} archivo(s)` : '-';
          return v(textArea, !isMain ? 'text-slate-500 truncate' : 'truncate');
      }
      case 'rmDvAdjuntos': {
          const textArea = isMain ? (Object.values(order.transportInfo?.providerRmDvAttachments || {}).flat().length > 0 ? `${Object.values(order.transportInfo?.providerRmDvAttachments || {}).flat().length} archivo(s)` : '-') :
                          (isEq && contextItem.proveedor && order.transportInfo?.providerRmDvAttachments?.[contextItem.proveedor]?.length) ? `${order.transportInfo.providerRmDvAttachments[contextItem.proveedor].length} archivo(s)` :
                          (isProv && contextItem.proveedor !== 'Sin Proveedor' && order.transportInfo?.providerRmDvAttachments?.[contextItem.proveedor]?.length) ? `${order.transportInfo.providerRmDvAttachments[contextItem.proveedor].length} archivo(s)` : '-';
          return v(textArea, !isMain ? 'text-slate-500 truncate' : 'truncate');
      }
      case 'transportista': return v(order.logisticsInfo?.transportista || '-', 'truncate');
      case 'tipoVehiculo': return v(order.logisticsInfo?.tipoVehiculo || '-', 'truncate');
      case 'razonTransp': {
          const val = order.logisticsInfo?.razonTransporte;
          const text = Array.isArray(val) ? val.join(', ') : (val || '-');
          return v(text, 'truncate', text);
      }
      case 'cobroTransp': return v(order.logisticsInfo?.cobroTransporte || '-', 'truncate');
      case 'notas': return v(order.logisticsInfo?.notas || '-', 'truncate max-w-xs', order.logisticsInfo?.notas);
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
                  <ColumnManager tableColOrder={tableColOrder} setTableColOrder={setTableColOrder} />
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
              {tableColOrder.map(colId => (
                <th 
                  key={`filter-th-${colId}`} 
                  style={tableColWidths[colId] ? { width: tableColWidths[colId], minWidth: tableColWidths[colId], maxWidth: tableColWidths[colId] } : { minWidth: 150 }}
                  className="p-2 sticky bg-slate-50 z-10 border-b border-slate-200/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchableOrderTableFilter
                    colId={colId}
                    value={columnFilters[colId] || ''}
                    onChange={(val) => setColumnFilters(prev => ({ ...prev, [colId]: val }))}
                    allOrders={sortedHistory}
                  />
                </th>
              ))}
            </tr>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 select-none">
              <th className="p-4 font-semibold w-16 sticky left-0 bg-slate-50 z-20 border-r border-slate-100">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    checked={filteredHistory.length > 0 && selectedOrderIds.size === filteredHistory.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(new Set(filteredHistory.map(o => o.id)));
                      } else {
                        setSelectedOrderIds(new Set());
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </th>
              {tableColOrder.map(colId => (
                <th 
                  key={colId}
                  draggable 
                  onDragStart={(e) => handleDragStartCol(e, colId)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropCol(e, colId)}
                  className={`p-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-move group relative select-none hover:bg-slate-100 transition-colors`}
                  style={tableColWidths[colId] ? { width: tableColWidths[colId], minWidth: tableColWidths[colId], maxWidth: tableColWidths[colId] } : { minWidth: 150 }}
                  onDragEnd={() => setDraggedColId(null)}
                >
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <ArrowUpDown className="w-3 h-3 flex-shrink-0 text-slate-300 pointer-events-none group-hover:text-slate-400" />
                    <span className="truncate flex-1">{TABLE_COLUMNS_CONFIG[colId] || colId}</span>
                  </div>
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-indigo-400 z-10"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => handleResizeMouseDown(colId, e)}
                  />
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-slate-200 pointer-events-none hidden group-hover:block" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.map(order => (
              <React.Fragment key={order.id}>
                <tr className={`group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 relative ${selectedOrderIds.has(order.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSet = new Set(selectedOrderIds);
                          if (e.target.checked) newSet.add(order.id);
                          else newSet.delete(order.id);
                          setSelectedOrderIds(newSet);
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrderExpansion(order.id, e);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title={expandedOrders.has(order.id) ? "Ocultar equipos" : "Ver equipos"}
                      >
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  {tableColOrder.map(colId => renderCellWithColId(colId, order, 'main'))}
                </tr>
                
                {expandedOrders.has(order.id) && (tableExpandMode === 'equipment' ? order.items.map((item) => (
                  <tr key={`${order.id}-item-${item.id}`} className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors border-b border-slate-100 last:border-0 relative">
                    <td className="p-4 text-center text-indigo-300 border-r border-slate-100/50">↳</td>
                    {tableColOrder.map(colId => renderCellWithColId(colId, order, 'equipment', item))}
                  </tr>
                )) : Object.values(order.items.reduce((acc, item) => {
                  const provider = item.proveedor || 'Sin Proveedor';
                  if (!acc[provider]) {
                    acc[provider] = {
                      proveedor: provider,
                      equipos: [],
                      cantidadTotal: 0,
                      itemRef: item
                    };
                  }
                  acc[provider].equipos.push(`${item.equipo} (${item.cantidad})`);
                  acc[provider].cantidadTotal += item.cantidad;
                  return acc;
                }, {} as Record<string, { proveedor: string, equipos: string[], cantidadTotal: number, itemRef: any }>)).map((group: any, index) => (
                  <tr key={`${order.id}-provider-${index}`} className="bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors border-b border-slate-100 last:border-0 relative">
                    <td className="p-4 text-center text-indigo-300 border-r border-slate-100/50">↳</td>
                    {tableColOrder.map(colId => renderCellWithColId(colId, order, 'provider', group))}
                  </tr>
                )))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

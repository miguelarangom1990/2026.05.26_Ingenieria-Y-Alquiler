import { Order, MaintenanceCard, SortRule, FilterRule, OrderStatus, MaintenanceStatus } from '../types';
import { STATUS_RANK, MAINTENANCE_COLUMNS, REVISION_CHECKLIST_DEVOLUCION, REVISION_CHECKLIST_REMISION } from '../constants/orders';

export const formatNumber = (val: number | '' | undefined) => {
  if (val === '' || val === undefined) return '';
  return new Intl.NumberFormat('es-CO').format(val);
};

export const parseNumber = (val: string) => {
  const clean = val.replace(/\D/g, '');
  return clean === '' ? '' : Number(clean);
};

export const formatDateTime = (timestamp: number | string | undefined) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};

export const formatDate = (date: string | number | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const getRevisionChecklist = (order: Order) => {
  return order.tipoTransporte === 'devolucion' ? REVISION_CHECKLIST_DEVOLUCION : REVISION_CHECKLIST_REMISION;
};

export const getInputClass = (value: any, isMandatory: boolean, activeRingColor: string = "indigo") => {
  const isEmpty = !value || value === "" || (Array.isArray(value) && value.length === 0);
  const baseClasses = "w-full px-4 py-2.5 rounded-xl border outline-none transition-all";
  
  if (isEmpty && isMandatory) {
    return `${baseClasses} border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-500`;
  }
  return `${baseClasses} border-slate-300 focus:ring-2 focus:ring-${activeRingColor}-500 bg-white`;
};

export const getProviderSummary = (order: Order, field: 'fechaTransporteSub' | 'fechaCobroSub' | 'numAlterno') => {
  const providers = Array.from(new Set(
      order.items
        .map((item: any) => item.proveedor)
        .filter((p: any) => p && p.trim() !== '' && p !== 'Sin Proveedor')
  )) as string[];
  
  const total = providers.length;
  if (total === 0) return '-';
  
  const filledValues = providers
      .map(p => order.transportInfo?.providerData?.[p]?.[field])
      .filter((val: any) => val && val.trim() !== '');
      
  const filledCount = filledValues.length;
  if (filledCount === 0) return '-';
  
  const uniqueValues = Array.from(new Set(filledValues));
  const isDate = field.startsWith('fecha');
  const prefixDiff = isDate ? 'Varias F.' : 'Varios #';
  
  if (uniqueValues.length === 1) {
      return `${uniqueValues[0]} (${filledCount}/${total})`;
  } else {
      return `${prefixDiff} (${filledCount}/${total})`;
  }
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  'SIN_CONFIRMAR': 'Sin Confirmar',
  'CONFIRMADO': 'Confirmado',
  'PEDIDO': 'Solicitud',
  'EN_LOGISTICA': 'En Logística',
  'EN_TRANSPORTE': 'En Transporte',
  'FINALIZADO': 'Revisión Docs',
  'REVISION_DOCUMENTOS': 'Revisión Docs',
  'MANTENIMIENTO': 'Mantenimiento',
  'CANCELADO': 'Cancelado',
  'COMPLETADO': 'Completado'
};

export const getProcessedHistory = (
  history: Order[],
  sortRules: SortRule[],
  filterRules: FilterRule[],
  historyMode: 'active' | 'history',
  selectedStatuses: OrderStatus[],
  groupBy: string
) => {
  const sorted = [...history].sort((a, b) => {
    for (const rule of sortRules) {
      let comparison = 0;
      const { field, direction } = rule;
      
      if (field === 'fechaSolicitud') {
        comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      } else if (field === 'fechaTransporte') {
        const valA = getProviderSummary(a, 'fechaTransporteSub');
        const valB = getProviderSummary(b, 'fechaTransporteSub');
        comparison = valA.localeCompare(valB);
      } else if (field === 'fechaCreacion') {
        comparison = a.timestamp - b.timestamp;
      } else if (field === 'cliente') {
        comparison = a.cliente.localeCompare(b.cliente);
      } else if (field === 'status') {
        comparison = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
      } else if (field === 'proveedor') {
        const provA = a.items?.find(i => i.proveedor)?.proveedor || 'Z-Sin Proveedor';
        const provB = b.items?.find(i => i.proveedor)?.proveedor || 'Z-Sin Proveedor';
        comparison = provA.localeCompare(provB);
      }
      
      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  let filtered = sorted.filter(order => {
    if (historyMode === 'history') {
      if (!['COMPLETADO', 'CANCELADO'].includes(order.status)) return false;
    } else {
      if (!['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO'].includes(order.status)) return false;
    }

    if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) return false;
    
    const activeRules = filterRules.filter(r => r.value || r.operator === 'is_not');
    if (activeRules.length === 0) return true;

    let result = true;
    for (let i = 0; i < activeRules.length; i++) {
      const rule = activeRules[i];
      
      let fieldValue = '';
      if (rule.field === 'cliente') fieldValue = order.cliente;
      else if (rule.field === 'status') fieldValue = order.status;
      else if (rule.field === 'fechaSolicitud') fieldValue = order.fecha;
      else if (rule.field === 'fechaTransporte') fieldValue = getProviderSummary(order, 'fechaTransporteSub') || '';
      else if (rule.field === 'fechaCreacion') fieldValue = new Date(order.timestamp || Date.now()).toISOString().split('T')[0];
      else if (rule.field === 'proveedor') {
        fieldValue = order.items.map(i => i.proveedor).filter(Boolean).join(', ');
      } else if (rule.field === 'obra') {
        fieldValue = order.destino;
      } else if (rule.field === 'equipo') {
        fieldValue = order.items.map(i => i.equipo).filter(Boolean).join(', ');
      } else if (rule.field === 'tipo') {
        fieldValue = order.type || '';
      } else if (rule.field === 'confirmado') {
        fieldValue = order.confirmado ? 'si' : 'no';
      } else if (rule.field === 'transportista') {
        fieldValue = order.logisticsInfo?.transportista || '';
      }

      let ruleResult = false;
      if (['cliente', 'obra', 'proveedor'].includes(rule.field)) {
        const selectedOps = (rule.value || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        if (selectedOps.length === 0) {
          ruleResult = true;
        } else {
          let cardVals: string[] = [];
          if (rule.field === 'cliente') {
            cardVals = order.cliente ? [order.cliente.toLowerCase()] : [];
          } else if (rule.field === 'obra') {
            cardVals = order.destino ? [order.destino.toLowerCase()] : [];
          } else if (rule.field === 'proveedor') {
            cardVals = order.items.map((i: any) => i.proveedor).filter(Boolean).map((s: string) => s.toLowerCase());
          }

          const hasOverlap = selectedOps.some((op: string) => cardVals.includes(op));
          if (rule.operator === 'is' || rule.operator === 'contains') {
            ruleResult = hasOverlap;
          } else if (rule.operator === 'is_not') {
            ruleResult = !hasOverlap;
          }
        }
      } else {
        const val = (rule.value || '').toLowerCase();
        const fVal = (fieldValue || '').toLowerCase();

        if (rule.operator === 'is') {
          ruleResult = fVal === val;
        } else if (rule.operator === 'contains') {
          ruleResult = fVal.includes(val);
        } else if (rule.operator === 'is_not') {
          ruleResult = fVal !== val;
        }
      }

      if (i === 0) {
        result = ruleResult;
      } else {
        const logicalOp = activeRules[i - 1].logicalOperator || 'AND';
        if (logicalOp === 'AND') {
          result = result && ruleResult;
        } else {
          result = result || ruleResult;
        }
      }
    }
    
    return result;
  });
  
  if (groupBy === 'none') return { groups: [{ key: 'all', label: '', items: filtered }], isGrouped: false };

  const groups: { [key: string]: Order[] } = {};
  filtered.forEach(order => {
    let key = '';
    if (groupBy === 'cliente') key = order.cliente;
    else if (groupBy === 'status') key = order.status;
    else if (groupBy === 'proveedor') key = order.items?.find(i => i.proveedor)?.proveedor || 'Sin Proveedor';
    else if (groupBy === 'fechaSolicitud') key = order.fecha;
    else if (groupBy === 'fechaTransporte') key = getProviderSummary(order, 'fechaTransporteSub') || 'Sin Fecha de Transporte';
    else if (groupBy === 'fechaCreacion') key = new Date(order.timestamp).toLocaleDateString();

    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
  });

  return { 
    groups: Object.entries(groups)
      .sort((a, b) => {
        if (groupBy === 'status') {
          return (STATUS_RANK[a[0]] ?? 0) - (STATUS_RANK[b[0]] ?? 0);
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([key, items]) => ({ 
        key, 
        label: groupBy === 'status' ? (STATUS_LABELS[key as OrderStatus] || key) : key, 
        items 
      })),
    isGrouped: true 
  };
};

export const getProcessedMaintenanceHistory = (
  maintenanceCards: MaintenanceCard[],
  sortRules: SortRule[],
  filterRules: FilterRule[],
  historyMode: 'active' | 'history',
  selectedStatuses: MaintenanceStatus[],
  groupBy: string
) => {
  const sorted = [...maintenanceCards].sort((a, b) => {
    for (const rule of sortRules) {
      let comparison = 0;
      const { field, direction } = rule;
      
      const getFileField = (col: string) => {
        if (col === 'ordenCompraAttachments') return 'ordenCompraAttachments';
        if (col === 'ordenMantSalidaTallerArch') return 'ordenMantSalidaTallerArchivos';
        if (col === 'reciboTaller') return 'recibosTaller';
        if (col === 'cotClienteArch') return 'cotClienteAttachments';
        if (col === 'facturaMantArch') return 'facturaArchivos';
        if (col === 'cotProvMantArch') return 'archivosAdjuntos';
        return '';
      };
      
      const fileField = getFileField(field);

      if (field === 'fechaSolicitud' || field === 'fechaEntrega') {
        const timeA = a.fechaIngreso ? new Date(a.fechaIngreso).getTime() : 0;
        const timeB = b.fechaIngreso ? new Date(b.fechaIngreso).getTime() : 0;
        comparison = timeA - timeB;
      } else if (field === 'fechaCreacion') {
        comparison = (a.timestamp || 0) - (b.timestamp || 0);
      } else if (field === 'id') {
        comparison = (a.id || '').localeCompare(b.id || '');
      } else if (field === 'cliente') {
        comparison = (a.cliente || '').localeCompare(b.cliente || '');
      } else if (field === 'obra') {
        comparison = (a.obra || '').localeCompare(b.obra || '');
      } else if (field === 'status' || field === 'estado') {
        const idxA = MAINTENANCE_COLUMNS.findIndex(c => c.status === a.status);
        const idxB = MAINTENANCE_COLUMNS.findIndex(c => c.status === b.status);
        comparison = idxA - idxB;
      } else if (field === 'proveedorMant' || field === 'proveedor') {
        const provA = a.items?.map(i => i.proveedorMantenimiento || i.proveedor).filter(Boolean).join(', ') || '';
        const provB = b.items?.map(i => i.proveedorMantenimiento || i.proveedor).filter(Boolean).join(', ') || '';
        comparison = provA.localeCompare(provB);
      } else if (field === 'equipo') {
        const eqA = a.nombre || a.items?.[0]?.equipo || '';
        const eqB = b.nombre || b.items?.[0]?.equipo || '';
        comparison = eqA.localeCompare(eqB);
      } else if (field === 'idEquipo') {
        const idEqA = a.items?.[0]?.idEquipo || '';
        const idEqB = b.items?.[0]?.idEquipo || '';
        comparison = idEqA.localeCompare(idEqB);
      } else if (field === 'cantidad') {
        const qA = a.items?.length || 0;
        const qB = b.items?.length || 0;
        comparison = qA - qB;
      } else if (field === 'propiedad') {
        const propA = a.items?.map(i => i.propiedadEquipo || 'Propio').join(', ') || '';
        const propB = b.items?.map(i => i.propiedadEquipo || 'Propio').join(', ') || '';
        comparison = propA.localeCompare(propB);
      } else if (field === 'tipoCobro') {
        const tcA = a.items?.flatMap(i => i.tipoCobro || []).join(', ') || '';
        const tcB = b.items?.flatMap(i => i.tipoCobro || []).join(', ') || '';
        comparison = tcA.localeCompare(tcB);
      } else if (field === 'costoMant' || field === 'costoMantenimiento') {
        const cA = a.items?.reduce((acc: number, i) => acc + (Number(i.costoMantenimiento) || Number(i.costoMant) || 0), 0) || 0;
        const cB = b.items?.reduce((acc: number, i) => acc + (Number(i.costoMantenimiento) || Number(i.costoMant) || 0), 0) || 0;
        comparison = cA - cB;
      } else if (field === 'valorCotCliente' || field === 'valorCotizadoCliente') {
        const vA = a.items?.reduce((acc: number, i) => acc + (Number(i.valorCotizadoCliente) || Number(i.valorCotCliente) || Number(i.valorCobradoCliente) || 0), 0) || 0;
        const vB = b.items?.reduce((acc: number, i) => acc + (Number(i.valorCotizadoCliente) || Number(i.valorCotCliente) || Number(i.valorCobradoCliente) || 0), 0) || 0;
        comparison = vA - vB;
      } else if (fileField) {
        const countA = a.items?.flatMap((i: any) => i[fileField] || []).filter(Boolean).length || 0;
        const countB = b.items?.flatMap((i: any) => i[fileField] || []).filter(Boolean).length || 0;
        comparison = countA - countB;
      } else {
        const strA = a.items?.map((i: any) => String((i as any)[field] || '')).filter(Boolean).join(', ') || '';
        const strB = b.items?.map((i: any) => String((i as any)[field] || '')).filter(Boolean).join(', ') || '';
        comparison = strA.localeCompare(strB);
      }
      
      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });

  let filtered = sorted.filter(card => {
    if (historyMode === 'history') {
      if (!['COMPLETADO', 'CANCELADO'].includes(card.status)) return false;
    } else {
      if (['COMPLETADO', 'CANCELADO'].includes(card.status)) return false;
    }
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(card.status)) return false;
    
    const activeRules = filterRules.filter(r => r.value || r.operator === 'is_not');
    if (activeRules.length === 0) return true;

    let result = true;
    for (let i = 0; i < activeRules.length; i++) {
      const rule = activeRules[i];
      
      let fieldValue = '';
      if (rule.field === 'cliente') fieldValue = card.cliente || '';
      else if (rule.field === 'status') fieldValue = card.status;
      else if (rule.field === 'fechaSolicitud') fieldValue = card.fechaIngreso;
      else if (rule.field === 'fechaCreacion') fieldValue = new Date(card.timestamp).toISOString().split('T')[0];
      else if (rule.field === 'proveedor') {
        fieldValue = card.items.map(i => i.proveedorMantenimiento || i.proveedor).filter(Boolean).join(', ');
      } else if (rule.field === 'obra') {
        fieldValue = card.obra || '';
      } else if (rule.field === 'equipo') {
        fieldValue = card.items.map(i => i.equipo).filter(Boolean).join(', ');
      } else if (rule.field === 'numCotProvMant') {
        fieldValue = card.items.map(i => i.numCotProvMant).filter(Boolean).join(', ');
      } else if (rule.field === 'numCotMantCliente') {
        fieldValue = card.items.map(i => i.numCotMantCliente).filter(Boolean).join(', ');
      } else if (rule.field === 'numOrdenCompraIyA') {
        fieldValue = card.items.map(i => i.numOrdenCompraIyA).filter(Boolean).join(', ');
      } else if (rule.field === 'numFacturaMant') {
        fieldValue = card.items.map(i => i.numFacturaMant).filter(Boolean).join(', ');
      } else if (rule.field === 'numOrdenMantSalidaT') {
        fieldValue = card.items.map(i => i.numOrdenMantSalidaT).filter(Boolean).join(', ');
      } else if (rule.field === 'tipoCobro') {
        fieldValue = card.items.flatMap(i => i.tipoCobro || []).filter(Boolean).join(', ');
      }

      let ruleResult = false;
      if (['cliente', 'obra', 'proveedor', 'tipoCobro'].includes(rule.field)) {
        const selectedOps = (rule.value || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        if (selectedOps.length === 0) {
          ruleResult = true;
        } else {
          let cardVals: string[] = [];
          if (rule.field === 'cliente') {
            cardVals = card.cliente ? [card.cliente.toLowerCase()] : [];
          } else if (rule.field === 'obra') {
            cardVals = card.obra ? [card.obra.toLowerCase()] : [];
          } else if (rule.field === 'proveedor') {
            cardVals = card.items.map((i: any) => i.proveedorMantenimiento || i.proveedor).filter(Boolean).map((s: string) => s.toLowerCase());
          } else if (rule.field === 'tipoCobro') {
            cardVals = card.items.flatMap((i: any) => i.tipoCobro || []).filter(Boolean).map((s: string) => s.toLowerCase());
          }

          const hasOverlap = selectedOps.some((op: string) => cardVals.includes(op));
          if (rule.operator === 'is' || rule.operator === 'contains') {
            ruleResult = hasOverlap;
          } else if (rule.operator === 'is_not') {
            ruleResult = !hasOverlap;
          }
        }
      } else {
        const val = (rule.value || '').toLowerCase();
        const fVal = (fieldValue || '').toLowerCase();

        if (rule.operator === 'is') {
          ruleResult = fVal === val;
        } else if (rule.operator === 'contains') {
          ruleResult = fVal.includes(val);
        } else if (rule.operator === 'is_not') {
          ruleResult = fVal !== val;
        }
      }

      if (i === 0) {
        result = ruleResult;
      } else {
        const logicalOp = activeRules[i - 1].logicalOperator || 'AND';
        if (logicalOp === 'AND') {
          result = result && ruleResult;
        } else {
          result = result || ruleResult;
        }
      }
    }
    
    return result;
  });
  
  if (groupBy === 'none') return { groups: [{ key: 'all', label: '', items: filtered }], isGrouped: false };

  const groups: { [key: string]: MaintenanceCard[] } = {};
  filtered.forEach(card => {
    let key = '';
    if (groupBy === 'cliente') key = card.cliente || 'Mantenimiento Interno';
    else if (groupBy === 'status') key = card.status;
    else if (groupBy === 'proveedor') key = card.items?.find(i => i.proveedor)?.proveedor || 'Sin Proveedor';
    else if (groupBy === 'fechaSolicitud') key = card.fechaIngreso;
    else if (groupBy === 'fechaCreacion') key = new Date(card.timestamp).toLocaleDateString();

    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  return { 
    groups: Object.entries(groups)
      .sort((a, b) => {
        if (groupBy === 'status') {
          return MAINTENANCE_COLUMNS.findIndex(c => c.status === a[0]) - MAINTENANCE_COLUMNS.findIndex(c => c.status === b[0]);
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([key, items]) => ({ 
        key, 
        label: groupBy === 'status' ? (MAINTENANCE_COLUMNS.find(c => c.status === key)?.title || key) : key, 
        items 
      })),
    isGrouped: true 
  };
};

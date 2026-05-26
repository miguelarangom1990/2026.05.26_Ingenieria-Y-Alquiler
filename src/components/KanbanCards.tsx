import React from 'react';
import { Trash2, Building2, MapPin, Calendar, CheckCircle2, History, ClipboardCheck, Wrench, PackagePlus, LogOut, Truck, XCircle, UserCircle, Package, Video, File, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order, MaintenanceCard, OrderStatus } from '../types';
import { getStatusBadge } from '../lib/utils';
import { MiniStepIndicator } from './StepIndicators';

export const OrderKanbanCard = ({
  order,
  setViewingOrder,
  handleDeleteOrder,
  maintenanceCards,
  handleMoveStageBackward,
  handleMoveStageForward
}: any) => {
  return (
    <div 
      key={order.id} 
      onClick={() => {
        setViewingOrder(order);
      }}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-3">
            {order.nombre || (
              (() => {
                const items = order.items;
                if (!items || items.length === 0) return order.destino || 'N/A';
                if (items.length === 1) {
                  return items[0].equipo || '';
                }
                if (items.length <= 3) {
                  return items.map((i: any) => i.equipo || '').join(', ');
                }
                return `${items.slice(0, 3).map((i: any) => i.equipo || '').join(', ')}, +${items.length - 3} más`;
              })()
            )}
          </h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">#{order.id?.slice(0, 8)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOrder(order.id);
            }}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar Solicitud"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="mb-1">
            {getStatusBadge(order)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-3 h-3" />
            <span className="truncate" title={order.destino}>{order.destino || <span className="text-red-500 font-bold">Sin definir</span>}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <UserCircle className="w-3 h-3" />
            <span className="truncate" title={order.cliente}>{order.cliente || <span className="text-slate-400 italic">Sin cliente</span>}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Package className="w-3 h-3" />
            <span>{(order.items || []).length} equipos</span>
          </div>
          {order.tipoTransporte && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Truck className="w-3 h-3" />
              <span className="uppercase">{order.tipoTransporte}</span>
            </div>
          )}
          {order.attachments && order.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {order.attachments?.slice(0, 5).map((file: any) => (
                <div 
                  key={file.id} 
                  className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-200 overflow-hidden" 
                  title={file.name}
                >
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : file.type.startsWith('video/') ? (
                    <Video className="w-3 h-3 text-purple-500" />
                  ) : (
                    <File className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              ))}
              {order.attachments.length > 5 && (
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-slate-200 text-[8px] font-bold text-slate-500">
                  +{order.attachments.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 pt-0.5 w-[120px]">
          <MiniStepIndicator order={order} />
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{order.fecha}</span>
        <div className="flex gap-2 items-center">
          {(() => {
            const linkedCardsCount = maintenanceCards.filter((card: any) => card.orderId === order.id).length;
            if (linkedCardsCount > 0) {
              return (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100" title="Tiene mantenimiento asociado">
                  <Wrench className="w-3 h-3" />
                  <span className="text-[9px] font-bold">MANT {linkedCardsCount > 1 ? `(${linkedCardsCount})` : ''}</span>
                </div>
              );
            }
            return null;
          })()}
          <div className="flex gap-1 items-center">
            {order.status !== 'PEDIDO' && handleMoveStageBackward && (
              <button
                onClick={(e) => handleMoveStageBackward(order, e)}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Etapa Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {order.status !== 'FINALIZADO' && handleMoveStageForward && (
              <button
                onClick={(e) => handleMoveStageForward(order, e)}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                title="Siguiente Etapa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="ml-1 flex items-center gap-1">
              {order.status === 'PEDIDO' && <History className="w-3.5 h-3.5 text-slate-300" />}
              {order.status === 'EN_TRANSPORTE' && <Truck className="w-3.5 h-3.5 text-blue-500" />}
              {order.status === 'EN_LOGISTICA' && <LogOut className="w-3.5 h-3.5 text-emerald-500" />}
              {order.status === 'FINALIZADO' && <PackagePlus className="w-3.5 h-3.5 text-purple-500" />}
              {order.status === 'COMPLETADO' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              {order.status === 'CANCELADO' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MaintenanceKanbanCard = ({
  card,
  setViewingMaintenanceCard,
  setMaintenanceViewMode,
  setConfirmDialog,
  deleteMaintenanceCard,
  MAINTENANCE_COLUMNS,
  generateMaintenanceTitle,
  setMaintenanceCards
}: any) => {
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
      onClick={() => {
        setViewingMaintenanceCard(card);
        setMaintenanceViewMode('simplified');
      }}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-3">
            {card.nombre || generateMaintenanceTitle(card.items, card.cliente)}
          </h4>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setConfirmDialog({
              isOpen: true,
              message: '¿Estás seguro de que quieres eliminar este mantenimiento?',
              onConfirm: () => {
                if (deleteMaintenanceCard) {
                  deleteMaintenanceCard(card.id);
                }
              }
            });
          }}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Eliminar mantenimiento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Obra: {resolvedObra}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Cliente: {resolvedCliente}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Propiedad: {resolvedPropiedad}</span>
        </div>
        {resolvedTipoCobro && (
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Cobro: {resolvedTipoCobro}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Fecha Ingreso Taller: {card.fechaIngreso}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span>{card.items?.length || 0} equipos</span>
        </div>
        {card.orderId && (
          <div className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Origen: #{card.orderId?.slice(0, 8)}</span>
          </div>
        )}
        {card.items?.[0]?.proveedorMantenimiento && (
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Prov: {card.items[0].proveedorMantenimiento}</span>
          </div>
        )}
        {card.numCotProvMant && (
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Cot: {card.numCotProvMant}</span>
          </div>
        )}
        {card.costoMantenimiento && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">$</span>
            <span>Costo: ${card.costoMantenimiento.toLocaleString()}</span>
          </div>
        )}
      </div>
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400" title="Fecha Creación">
          {card.timestamp ? new Date(card.timestamp).toISOString().split('T')[0] : ''}
        </span>
        <div className="flex gap-2 items-center">
          {card.orderId && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-100" title="Asociado a un pedido">
              <FileText className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider">PEDIDO</span>
            </div>
          )}
          <div className="flex gap-1 items-center">
            {(!['COMPLETADO', 'CANCELADO'].includes(card.status) && card.status !== 'SOLICITUD_REVISION') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = MAINTENANCE_COLUMNS.findIndex((c: any) => c.status === card.status);
                if (currentIndex > 0) {
                  const newStatus = MAINTENANCE_COLUMNS[currentIndex - 1].status;
                  setMaintenanceCards((prev: any[]) => prev.map((c: any) => c.id === card.id ? { ...c, status: newStatus, items: (newStatus === 'COT_PROV_MANT' && c.status !== 'COT_PROV_MANT') ? c.items.map((i: any) => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : c.items } : c));
                }
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Etapa Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            )}
            {(!['COMPLETADO', 'CANCELADO'].includes(card.status) && card.status !== 'ENTREGA_CLIENTE') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = MAINTENANCE_COLUMNS.findIndex((c: any) => c.status === card.status);
                if (currentIndex < MAINTENANCE_COLUMNS.length - 1) {
                  const newStatus = MAINTENANCE_COLUMNS[currentIndex + 1].status;
                  setMaintenanceCards((prev: any[]) => prev.map((c: any) => c.id === card.id ? { ...c, status: newStatus, items: (newStatus === 'COT_PROV_MANT' && c.status !== 'COT_PROV_MANT') ? c.items.map((i: any) => ({...i, cotProvMantEnviada: 'Cot Recibida' as any})) : c.items } : c));
                }
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Siguiente Etapa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

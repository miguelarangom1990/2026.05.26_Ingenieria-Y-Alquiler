import { useState } from 'react';
import { Order, OrderStatus, LineItem, SectionType } from '../types';
import { useFilterManagement } from './useFilterManagement';

export function useOrdersState() {
  const [cliente, setCliente] = useState('');
  const [nombre, setNombre] = useState('');
  const [isNombreManual, setIsNombreManual] = useState(false);
  const [destino, setDestino] = useState('');
  const [tipoTransporte, setTipoTransporte] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<'ALQUILER' | 'TRANSPORTE'>('ALQUILER');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [coordinatingOrder, setCoordinatingOrder] = useState<Order | null>(null);
  const [transportingOrder, setTransportingOrder] = useState<Order | null>(null);
  
  const [linkingOrderToMaintenance, setLinkingOrderToMaintenance] = useState<string | null>(null);
  const [linkOrderSearchQuery, setLinkOrderSearchQuery] = useState('');
  
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<LineItem[]>([{ id: crypto.randomUUID(), equipo: '', cantidad: '' }]);

  const ordersFilters = useFilterManagement([]);

  return {
    cliente, setCliente,
    nombre, setNombre,
    isNombreManual, setIsNombreManual,
    destino, setDestino,
    tipoTransporte, setTipoTransporte,
    fecha, setFecha,
    expandedOrders, setExpandedOrders,
    isSaved, setIsSaved,
    createOrderType, setCreateOrderType,
    editingOrderId, setEditingOrderId,
    selectedOrderIds, setSelectedOrderIds,
    selectedStatuses, setSelectedStatuses,
    isModalOpen, setIsModalOpen,
    viewingOrder, setViewingOrder,
    verifyingOrder, setVerifyingOrder,
    confirmingOrder, setConfirmingOrder,
    coordinatingOrder, setCoordinatingOrder,
    transportingOrder, setTransportingOrder,
    linkingOrderToMaintenance, setLinkingOrderToMaintenance,
    linkOrderSearchQuery, setLinkOrderSearchQuery,
    items, setItems,
    ordersFilters
  };
}

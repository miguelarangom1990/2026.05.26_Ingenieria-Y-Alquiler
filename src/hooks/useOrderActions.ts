import React, { useCallback } from 'react';
import { Order, OrderStatus, ConfirmDialogState, LineItem } from '../types';
import { useOrders } from './useOrders';

export function useOrderActions(
  ui: {
    setConfirmDialog: (state: ConfirmDialogState) => void;
    setViewingOrder: (order: Order | null) => void;
    setIsSaved: (val: boolean) => void;
    setIsModalOpen: (val: boolean) => void;
    setEditingOrderId: (id: string | null) => void;
    setCoordinatingOrder: (order: Order | null) => void;
    setTransportingOrder: (order: Order | null) => void;
    setNombre: (val: string) => void;
    setCliente: (val: string) => void;
    setDestino: (val: string) => void;
    setItems: (items: any[]) => void;
    setFecha: (val: string) => void;
    setTipoTransporte: (val: string) => void;
    setIsNombreManual: (val: boolean) => void;
    setSelectedStatuses: (statuses: OrderStatus[]) => void;
    createOrderType: 'ALQUILER' | 'TRANSPORTE' | 'MANTENIMIENTO';
    cliente: string;
    destino: string;
    tipoTransporte: string;
    items: any[];
    nombre: string;
    fecha: string;
    isNombreManual: boolean;
    editingOrderId: string | null;
    viewingOrder: Order | null;
    coordinatingOrder: Order | null;
    transportingOrder: Order | null;
    history: Order[];
  }
) {
  const { addOrder, updateOrder, deleteOrder, updateOrderStatus } = useOrders();

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  }, [updateOrderStatus]);

  const handleStartLogistics = useCallback((order: Order) => {
    ui.setCoordinatingOrder({ ...order });
    ui.setSelectedStatuses([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ui]);

  const handleDeleteOrder = useCallback((orderId: string) => {
    ui.setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.',
      onConfirm: () => {
        deleteOrder(orderId);
        ui.setViewingOrder(null);
      }
    });
  }, [deleteOrder, ui]);

  const handleSave = useCallback((e: React.FormEvent, continueToNext = false) => {
    e.preventDefault();
    const isAlquiler = ui.createOrderType === 'ALQUILER';
    if (!ui.cliente || !ui.destino || !ui.tipoTransporte || (isAlquiler && ui.items.some(i => !i.equipo || !i.cantidad))) {
      ui.setConfirmDialog({
        isOpen: true,
        message: "Por favor, complete todos los campos obligatorios.",
        onConfirm: () => {},
        isAlert: true
      });
      return;
    }
    
    const allSuppliersAssigned = !ui.items.some(i => !i.proveedor);
    const atLeastOneSupplierAssigned = ui.items.some(i => i.proveedor);
    
    const proceedSave = () => {
      let savedOrder: Order;
      const newStatus = 'PEDIDO';

      if (ui.editingOrderId) {
        const existingOrder = ui.history.find(o => o.id === ui.editingOrderId)!;
        let status = existingOrder.status;
        
        savedOrder = { 
          ...existingOrder, 
          nombre: ui.nombre.trim(), 
          cliente: ui.cliente.trim(), 
          destino: ui.destino.trim(), 
          fecha: ui.fecha, 
          tipoTransporte: ui.tipoTransporte, 
          items: ui.items.map(i => ({...i, equipo: (i.equipo || "").trim(), proveedor: (i.proveedor || "").trim(), cantidad: Number(i.cantidad) || 0, precio: Number(i.precio) || 0})), 
          status, 
          isManualTitle: ui.isNombreManual 
        };
        updateOrder(savedOrder);
        ui.setEditingOrderId(null);
      } else {
        savedOrder = {
          id: crypto.randomUUID(),
          nombre: ui.nombre.trim(),
          cliente: ui.cliente.trim(),
          destino: ui.destino.trim(),
          fecha: ui.fecha,
          tipoTransporte: ui.tipoTransporte,
          type: ui.createOrderType as any,
          isManualTitle: ui.isNombreManual,
          items: isAlquiler ? ui.items.map(i => ({...i, equipo: (i.equipo || "").trim(), proveedor: (i.proveedor || "").trim(), cantidad: Number(i.cantidad) || 0, precio: Number(i.precio) || 0})) : [],
          timestamp: Date.now(),
          status: newStatus
        };
        addOrder(savedOrder);
      }

      ui.setIsSaved(true);
      ui.setIsModalOpen(false);
      
      ui.setNombre('');
      ui.setCliente('');
      ui.setDestino('');
      ui.setItems([{ id: crypto.randomUUID(), equipo: '', cantidad: '' }]);
      
      if (continueToNext) {
        handleStartLogistics(savedOrder);
      }

      setTimeout(() => ui.setIsSaved(false), 3000);
    };

    if (continueToNext) {
      if (isAlquiler && !atLeastOneSupplierAssigned) {
        ui.setConfirmDialog({
          isOpen: true,
          message: "Por favor, asigne al menos un proveedor para continuar.",
          onConfirm: () => {},
          isAlert: true
        });
        return;
      }
      
      if (isAlquiler && !allSuppliersAssigned) {
        ui.setConfirmDialog({
          isOpen: true,
          message: "¿Desea continuar sin asignar un proveedor a todos los equipos?",
          onConfirm: proceedSave
        });
        return;
      }
    }

    proceedSave();
  }, [ui, updateOrder, addOrder, handleStartLogistics]);

  const handleEdit = useCallback((order: Order) => {
    ui.setEditingOrderId(order.id);
    ui.setNombre(order.nombre || '');
    ui.setCliente(order.cliente);
    ui.setDestino(order.destino);
    ui.setFecha(order.fecha);
    ui.setTipoTransporte(order.tipoTransporte || '');
    ui.setItems([...order.items]);
    ui.setIsNombreManual(!!order.isManualTitle);
    ui.setIsModalOpen(true);
  }, [ui]);

  const handleCancelEdit = useCallback(() => {
    ui.setEditingOrderId(null);
    ui.setNombre('');
    ui.setCliente('');
    ui.setDestino('');
    ui.setTipoTransporte('');
    ui.setItems([{ id: crypto.randomUUID(), equipo: '', cantidad: '' }]);
    ui.setIsModalOpen(false);
  }, [ui]);

  const handleMoveStageBackward = useCallback((order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (order.status === 'EN_LOGISTICA') {
      ui.setConfirmDialog({
        isOpen: true,
        message: '¿Desea devolver el pedido a la etapa inicial?',
        onConfirm: () => {
          updateOrderStatus(order.id, 'PEDIDO');
        }
      });
    } else if (order.status === 'EN_TRANSPORTE') {
      ui.setConfirmDialog({
        isOpen: true,
        message: '¿Desea devolver el pedido a la etapa de logística?',
        onConfirm: () => {
          updateOrderStatus(order.id, 'EN_LOGISTICA');
        }
      });
    } else if (order.status === 'FINALIZADO') {
      ui.setConfirmDialog({
        isOpen: true,
        message: '¿Desea devolver el pedido a la etapa de transporte?',
        onConfirm: () => {
          updateOrderStatus(order.id, 'EN_TRANSPORTE');
        }
      });
    }
  }, [ui, updateOrderStatus]);

  const handleRevertToTransport = useCallback((order: Order) => {
    const updatedOrder: Order = { ...order, status: 'EN_TRANSPORTE' };
    updateOrder(updatedOrder);
    if (ui.viewingOrder?.id === order.id) {
      ui.setViewingOrder(updatedOrder);
    }
    ui.setIsSaved(true);
    setTimeout(() => ui.setIsSaved(false), 3000);
  }, [ui, updateOrder]);

  const handleStartTransport = useCallback((order: Order) => {
    ui.setTransportingOrder({ ...order });
    ui.setSelectedStatuses([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ui]);

  const handleCompleteLogistics = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.coordinatingOrder) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const tipoTransporte = ui.coordinatingOrder.tipoTransporte;
    
    if (!tipoTransporte) {
      ui.setConfirmDialog({
        isOpen: true,
        message: "Por favor, seleccione el tipo de transporte.",
        onConfirm: () => {},
        isAlert: true
      });
      return;
    }

    const rawLogisticsInfo = ui.coordinatingOrder.logisticsInfo || {};
    const sanitizedLogisticsInfo = Object.fromEntries(
      Object.entries(rawLogisticsInfo).filter(([key]) => key !== '')
    );

    const logisticsInfo = {
      ...sanitizedLogisticsInfo,
      transportista: (ui.coordinatingOrder.logisticsInfo?.transportista || '').trim(),
      tipoVehiculo: (ui.coordinatingOrder.logisticsInfo?.tipoVehiculo || '').trim(),
      notas: ((formData.get('notas') as string) || ui.coordinatingOrder.logisticsInfo?.notas || '').trim(),
      cobroTransporte: (ui.coordinatingOrder.logisticsInfo?.cobroTransporte || '').trim(),
      razonTransporte: ui.coordinatingOrder.logisticsInfo?.razonTransporte || [],
    };

    updateOrder({ ...ui.coordinatingOrder, status: ui.coordinatingOrder.status === 'PEDIDO' ? 'EN_LOGISTICA' : ui.coordinatingOrder.status, logisticsInfo, tipoTransporte });
    ui.setSelectedStatuses([]);
    ui.setCoordinatingOrder(null);
    ui.setIsSaved(true);
    setTimeout(() => ui.setIsSaved(false), 3000);
  }, [ui, updateOrder]);

  const handleCompleteTransport = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.transportingOrder) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const providers = Array.from(new Set(ui.transportingOrder.items.map(item => item.proveedor || "Sin Proveedor")));
    const providerData: Record<string, { fechaCobroSub?: string; fechaTransporteSub?: string; numAlterno?: string }> = {};
    
    providers.forEach((provider: string) => {
      providerData[provider] = {
        fechaCobroSub: formData.get(`fechaCobroSub_${provider}`) as string,
        fechaTransporteSub: formData.get(`fechaTransporteSub_${provider}`) as string,
        numAlterno: (formData.get(`numAlterno_${provider}`) as string || "").trim(),
      };
    });

    const transportInfo = {
      ...ui.transportingOrder.transportInfo,
      providerAttachments: ui.transportingOrder.transportInfo?.providerAttachments || {},
      providerData,
    };

    const updatedItems = ui.transportingOrder.items.map(item => {
      const { fechaCobroSub, fechaTransporteSub, numAlterno, ...rest } = item;
      return rest;
    });

    updateOrder({ ...ui.transportingOrder, status: (ui.transportingOrder.status === 'EN_LOGISTICA' || ui.transportingOrder.status === 'PEDIDO') ? 'EN_TRANSPORTE' : ui.transportingOrder.status, transportInfo, items: updatedItems as LineItem[] });
    ui.setSelectedStatuses([]);
    ui.setTransportingOrder(null);
    ui.setIsSaved(true);
    setTimeout(() => ui.setIsSaved(false), 3000);
  }, [ui, updateOrder]);

  const handleMoveStageForward = useCallback((order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const verifiedCount = order.items.filter(i => i.proveedor).length;
    if (verifiedCount === 0) {
      ui.setConfirmDialog({
        isOpen: true,
        message: 'No puede avanzar a la siguiente etapa. Faltan diligenciar campos obligatorios en la Solicitud (asignar proveedor).',
        onConfirm: () => {},
        isAlert: true
      });
      return;
    }

    if (order.status === 'PEDIDO') {
      handleStartLogistics(order);
    } else if (order.status === 'EN_LOGISTICA') {
      const mandatoryLogistics = order.logisticsInfo?.transportista && 
                        order.logisticsInfo?.tipoVehiculo;
      if (!mandatoryLogistics) {
        ui.setConfirmDialog({
          isOpen: true,
          message: 'No puede avanzar a Transporte. Faltan diligenciar campos obligatorios en Logística (transportista y tipo de vehículo).',
          onConfirm: () => {},
          isAlert: true
        });
        return;
      }
      handleStartTransport(order);
    } else if (order.status === 'EN_TRANSPORTE') {
      const mandatoryLogistics = order.logisticsInfo?.transportista && 
                        order.logisticsInfo?.tipoVehiculo;
      if (!mandatoryLogistics) {
        ui.setConfirmDialog({
          isOpen: true,
          message: 'No puede finalizar el pedido. Faltan diligenciar campos obligatorios en Logística (transportista y tipo de vehículo).',
          onConfirm: () => {},
          isAlert: true
        });
        return;
      }

      ui.setConfirmDialog({
        isOpen: true,
        message: '¿Confirmar que el transporte ha finalizado? El pedido pasará a revisión de documentos.',
        onConfirm: () => {
          updateOrderStatus(order.id, 'FINALIZADO');
          ui.setSelectedStatuses([]);
          ui.setIsSaved(true);
          setTimeout(() => ui.setIsSaved(false), 3000);
        }
      });
    }
  }, [ui, handleStartLogistics, handleStartTransport, updateOrderStatus]);

  return {
    handleDeleteOrder,
    handleStatusChange,
    handleStartLogistics,
    handleSave,
    handleEdit,
    handleCancelEdit,
    handleMoveStageBackward,
    handleMoveStageForward,
    handleRevertToTransport,
    handleCompleteLogistics,
    handleStartTransport,
    handleCompleteTransport,
    addOrder,
    updateOrder
  };
}

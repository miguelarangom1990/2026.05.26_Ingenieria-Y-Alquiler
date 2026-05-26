import React, { useCallback } from 'react';
import { MaintenanceCard, MaintenanceStatus, ConfirmDialogState, Order, MaintenanceItem } from '../types';
import { useMaintenance } from './useMaintenance';
import { MAINTENANCE_COLUMNS } from '../constants/orders';
import { generateMaintenanceTitle } from '../lib/utils';

export function useMaintenanceActions(
  ui: {
    setConfirmDialog: (state: ConfirmDialogState) => void;
    setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
    setIsSaved: (val: boolean) => void;
    setIsModalOpen: (val: boolean) => void;
    setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
    setEditingMaintenanceStage: (stage: MaintenanceStatus | null) => void;
    setOrderForNewInspection: (order: Order | null) => void;
    setSelectedItemsForInspection: (items: Set<string>) => void;
    setViewingOrder: (order: Order | null) => void;
    setViewMode: (mode: any) => void;
    editingMaintenanceCard: MaintenanceCard | null;
    editingMaintenanceStage: MaintenanceStatus | null;
    maintenanceCards: MaintenanceCard[];
  }
) {
  const { addMaintenanceCard, updateMaintenanceCard, deleteMaintenanceCard, updateMaintenanceStatus, updateMaintenanceField, updateMaintenanceItems } = useMaintenance();

  const handleDeleteMaintenance = useCallback((cardId: string) => {
    ui.setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que quieres eliminar este mantenimiento?',
      onConfirm: () => {
        deleteMaintenanceCard(cardId);
        ui.setViewingMaintenanceCard(null);
      }
    });
  }, [deleteMaintenanceCard, ui]);

  const handleStatusChange = useCallback((cardId: string, newStatus: MaintenanceStatus) => {
    updateMaintenanceStatus(cardId, newStatus);
  }, [updateMaintenanceStatus]);

  const handleSaveCard = useCallback((advanceStage: boolean = false) => {
    if (!ui.editingMaintenanceCard) return;

    let currentActualStatus = ui.editingMaintenanceCard.status;
    let editingStage = ui.editingMaintenanceStage || currentActualStatus;
    
    let newEditingStage = editingStage;
    let newActualStatus = currentActualStatus;
    const currentItems = ui.editingMaintenanceCard.items;

    if (advanceStage) {
      if (editingStage === 'APROB_MANT_IYA' && currentItems.some(i => i.cobroMantClient === 'no cobrar')) {
        newEditingStage = 'CERVINO';
      } else {
        const currentIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === editingStage);
        if (currentIndex !== -1 && currentIndex < MAINTENANCE_COLUMNS.length - 1) {
          newEditingStage = MAINTENANCE_COLUMNS[currentIndex + 1].status as MaintenanceStatus;
        }
      }

      const actualIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === currentActualStatus);
      const newEditingIndex = MAINTENANCE_COLUMNS.findIndex(c => c.status === newEditingStage);
      if (newEditingIndex > actualIndex) {
        newActualStatus = newEditingStage;
      }
    }

    const updatedCard: MaintenanceCard = {
      ...ui.editingMaintenanceCard,
      status: newActualStatus,
      nombre: ui.editingMaintenanceCard.isManualTitle ? ui.editingMaintenanceCard.nombre : generateMaintenanceTitle(ui.editingMaintenanceCard.items as any, ui.editingMaintenanceCard.cliente),
      items: advanceStage && newActualStatus === 'COT_PROV_MANT' && ui.editingMaintenanceCard.status !== 'COT_PROV_MANT'
        ? currentItems.map(i => ({...i, cotProvMantEnviada: 'Cot Recibida' as any}))
        : currentItems
    };

    const exists = ui.maintenanceCards.some(c => c.id === updatedCard.id);
    if (exists) {
      updateMaintenanceCard(updatedCard);
    } else {
      addMaintenanceCard(updatedCard);
    }

    if (advanceStage) {
      ui.setEditingMaintenanceCard(updatedCard);
      ui.setEditingMaintenanceStage(newEditingStage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      ui.setEditingMaintenanceCard(null);
      ui.setEditingMaintenanceStage(null);
    }
    ui.setIsSaved(true);
    setTimeout(() => ui.setIsSaved(false), 3000);
  }, [ui, updateMaintenanceCard, addMaintenanceCard, ui.maintenanceCards]);

  const handleSaveMaintenanceCard = useCallback((e?: any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const advance = e === true;
    handleSaveCard(advance);
  }, [handleSaveCard]);

  const handleCreateMaintenanceFromOrder = useCallback((order: Order) => {
    const existingCards = ui.maintenanceCards.filter(c => c.orderId === order.id);
    const existingItemIds = new Set(existingCards.flatMap(c => c.items.map(i => i.equipo)));
    
    const availableItems = order.items.filter(i => !existingItemIds.has(i.equipo));

    if (availableItems.length === 0) {
      alert("Ya se han creado mantenimientos para todos los equipos en este pedido.");
      return;
    }

    ui.setOrderForNewInspection(order);
    ui.setSelectedItemsForInspection(new Set(availableItems.map(i => i.id)));
  }, [ui]);

  const executeCreateMaintenanceFromOrder = useCallback((order: Order, selectedItemsIds: Set<string>, redirect: boolean) => {
    const selectedItems = order.items.filter(i => selectedItemsIds.has(i.id));
    if (selectedItems.length === 0) return;

    const existingCards = ui.maintenanceCards.filter(c => c.orderId === order.id);
    const existingItemIds = new Set(existingCards.flatMap(c => c.items.map(i => i.equipo)));
    
    const validItems = selectedItems.filter(i => !existingItemIds.has(i.equipo));
    
    if (validItems.length === 0) {
      alert("Los equipos seleccionados ya tienen un mantenimiento asociado en esta devolución.");
      return;
    }

    const newCards = validItems.map(i => {
      const newItem = {
        id: crypto.randomUUID(),
        equipo: i.equipo,
        cantidad: Number(i.cantidad) || 0,
        estado: 'SOLICITUD_REVISION',
        cotProvMantEnviada: 'Sin Solicitar' as any
      };
      return {
        id: crypto.randomUUID(),
        orderId: order.id,
        cliente: order.cliente,
        obra: order.destino,
        nombre: generateMaintenanceTitle([newItem] as any, order.cliente),
        isManualTitle: false,
        fechaIngreso: new Date().toISOString().split('T')[0],
        items: [newItem],
        status: 'SOLICITUD_REVISION',
        timestamp: Date.now()
      } as MaintenanceCard;
    });

    newCards.forEach(c => addMaintenanceCard(c));

    if (redirect) {
      ui.setViewingOrder(null);
      ui.setEditingMaintenanceCard(newCards[0]);
      ui.setViewMode('maintenance');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ui, addMaintenanceCard]);

  const handleCreateStandaloneMaintenance = useCallback(() => {
    const newCard: MaintenanceCard = {
      id: crypto.randomUUID(),
      cliente: '',
      nombre: 'Mantenimiento Interno',
      isManualTitle: false,
      fechaIngreso: new Date().toISOString().split('T')[0],
      items: [],
      status: 'SOLICITUD_REVISION',
      timestamp: Date.now()
    };
    ui.setEditingMaintenanceCard(newCard);
    ui.setViewMode('maintenance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ui]);

  return {
    handleDeleteMaintenance,
    handleStatusChange,
    handleSaveCard,
    handleSaveMaintenanceCard,
    handleCreateMaintenanceFromOrder,
    executeCreateMaintenanceFromOrder,
    handleCreateStandaloneMaintenance,
    updateMaintenanceField,
    updateMaintenanceCard,
    addMaintenanceCard,
    updateMaintenanceItems
  };
}

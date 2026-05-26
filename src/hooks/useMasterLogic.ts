import { useState, useRef, useEffect } from 'react';
import { useOrdersAndMaintenanceUI } from './useOrdersAndMaintenanceUI';
import { useItemManagement } from './useItemManagement';
import { useOrderFileUploads } from './useOrderFileUploads';
import { useExcelImport } from './useExcelImport';
import { useColumnResizing } from './useColumnResizing';
import { useProcessedData } from './useProcessedData';
import { useOrders } from './useOrders';
import { useMaintenance } from './useMaintenance';
import { useOrderActions } from './useOrderActions';
import { useMaintenanceActions } from './useMaintenanceActions';
import { useCommentActions } from './useCommentActions';
import { useUrlSync } from './useUrlSync';
import { useAppData } from './useAppData';
import { Company, ConstructionSite, Equipment, EquipmentCategory, Order, MaintenanceCard } from '../types';

export const useMasterLogic = (
  realCompanies: Company[],
  realSites: ConstructionSite[],
  realEquipment: Equipment[],
  realCategories: EquipmentCategory[],
  asModal: boolean = false
) => {
  const { equipmentOptions, vehicleOptions } = useAppData({
    realCompanies, realSites, realEquipment, realCategories
  });

  const uiState = useOrdersAndMaintenanceUI(realCompanies, realSites);
  
  const { 
    items, setItems, setNombre, isNombreManual, setIsSaved, setEditingMaintenanceCard,
    viewingOrder, setViewingOrder, viewingMaintenanceCard, setViewingMaintenanceCard,
    historyMode, sortRules, ordersFilters, maintenanceFilters, selectedStatuses, groupBy,
    currentSection, setCurrentSection, setCoordinatingOrder, setTransportingOrder,
    setEditingOrderId, setIsModalOpen, setConfirmDialog, setCreateOrderType, setIsNombreManual,
    setSelectedStatuses,
    createOrderType, cliente, setCliente, destino, setDestino, fecha, setFecha,
    tipoTransporte, setTipoTransporte, editingOrderId, coordinatingOrder, transportingOrder,
    editingMaintenanceStage, setEditingMaintenanceStage, setIsUploading, setCommentAttachments,
    companies, setCompanies, constructionSites, setConstructionSites, setOrderForNewInspection,
    setSelectedItemsForInspection, setViewMode, columnWidths, setColumnWidths
  } = uiState;

  const itemMgmt = useItemManagement({
    items, setItems, setNombre, isNombreManual, setIsSaved, setEditingMaintenanceCard
  });

  const ordersData = useOrders();
  const maintenanceData = useMaintenance();

  const fileUploads = useOrderFileUploads({
    setIsUploading, setCommentAttachments, history: ordersData.orders || [], 
    updateOrderField: ordersData.updateOrderField, viewingOrder, setViewingOrder,
    setTransportingOrder, transportingOrder, 
    setIsDraggingAttachments: uiState.setIsDraggingAttachments, 
    setConfirmDialog: uiState.setConfirmDialog
  });

  const excelImport = useExcelImport({
    setCompanies, setConstructionSites, companies
  });

  const resizing = useColumnResizing({
    initialWidths: columnWidths,
    onWidthsChange: setColumnWidths
  });

  const processed = useProcessedData({
    history: ordersData.orders || [],
    maintenanceCards: maintenanceData.maintenanceCards || [],
    sortRules,
    ordersFilterRules: ordersFilters.filterRules,
    maintenanceFilterRules: maintenanceFilters.filterRules,
    historyMode,
    selectedStatuses,
    groupBy
  });

  const orderActions = useOrderActions({
    setConfirmDialog, setViewingOrder, setIsSaved, setIsModalOpen, setEditingOrderId,
    setCoordinatingOrder, setTransportingOrder, setNombre, setCliente, setDestino,
    setItems, setFecha, setTipoTransporte, setIsNombreManual, setSelectedStatuses,
    createOrderType, cliente, destino, tipoTransporte, items, nombre: uiState.nombre, 
    fecha, isNombreManual, editingOrderId, viewingOrder, coordinatingOrder, 
    transportingOrder, history: ordersData.orders
  });

  const maintenanceActions = useMaintenanceActions({
    setConfirmDialog, setViewingMaintenanceCard, setIsSaved, setIsModalOpen, 
    setEditingMaintenanceCard, setEditingMaintenanceStage, setOrderForNewInspection, 
    setSelectedItemsForInspection, setViewingOrder, setViewMode,
    editingMaintenanceCard: uiState.editingMaintenanceCard, 
    editingMaintenanceStage: uiState.editingMaintenanceStage, 
    maintenanceCards: maintenanceData.maintenanceCards
  });

  const commentActions = useCommentActions({
    newComment: uiState.newComment, 
    setNewComment: uiState.setNewComment, 
    commentAttachments: uiState.commentAttachments, 
    setCommentAttachments: uiState.setCommentAttachments,
    history: ordersData.orders || [],
    viewingOrder, 
    setViewingOrder,
    maintenanceCards: maintenanceData.maintenanceCards || [],
    viewingMaintenanceCard, 
    setViewingMaintenanceCard,
    updateOrderField: ordersData.updateOrderField, 
    updateMaintenanceField: maintenanceData.updateMaintenanceField
  });

  useUrlSync({
    viewingOrder, setViewingOrder, viewingMaintenanceCard, setViewingMaintenanceCard,
    history: ordersData.orders || [], maintenanceCards: maintenanceData.maintenanceCards || [], 
    currentSection, setCurrentSection, asModal
  });

  return {
    ui: uiState,
    items: itemMgmt,
    orders: ordersData,
    maintenance: maintenanceData,
    files: fileUploads,
    excel: excelImport,
    resizing,
    processed,
    actions: {
      orders: orderActions,
      maintenance: maintenanceActions,
      comments: commentActions
    },
    appData: {
      equipmentOptions,
      vehicleOptions
    }
  };
};

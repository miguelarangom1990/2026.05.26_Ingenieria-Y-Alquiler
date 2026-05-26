import React, { useState, useRef, useEffect } from 'react';
import { useMasterLogic } from '../hooks/useMasterLogic';
import { OrdersProvider, useOrdersContext } from '../context/OrdersContext';
import { Plus, Trash2, Save, FileText, Building2, Truck, Package, CheckCircle2, XCircle, History, ChevronDown, ChevronUp, ChevronLeft, Calendar, Edit2, X, UserCheck, User, MapPin, ClipboardCheck, KanbanSquare, ListFilter, ChevronRight, ArrowUpDown, Layers, MessageSquare, Paperclip, Send, File, Image, Video, Download, Filter, Wrench, LogOut, PackagePlus, Menu, UserCircle, Settings, AlertTriangle, Users, HardHat, Store, FileUp, RefreshCw, Key, DollarSign, Briefcase, AlertCircle, Check, Search, ShoppingBag, GripVertical, Hash, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { MaintenanceCard, MaintenanceItem, MaintenanceStatus, Company, ConstructionSite, Order, LineItem, OrderStatus, Comment, Attachment, SortField, SortDirection, SortRule, FilterRule, OrdersAndMaintenanceProps, ItemType } from '../types';
import { cleanInput, trimInput, generateMaintenanceTitle, generateOrderTitle } from '../lib/utils';
import { isSimilarEquipment } from './EquipmentList';
import {
  EQUIPOS,
  TIPOS_VEHICULO,
  TIPOS_TRANSPORTE,
  ACTIVE_ORDER_STATUSES,
  SECTION_LABELS,
  FALLBACK_SITES
} from '../constants/orders';

import { normalizeText } from '../lib/textUtils';
import { STATUS_LABELS, getProcessedHistory, getProcessedMaintenanceHistory, formatNumber, parseNumber, getRevisionChecklist, getInputClass, formatDate, formatDateTime } from '../lib/orderUtils';

import { OrderDetailsModal } from '../components/orders/OrderDetailsModal';
import { MaintenanceDetailsModal } from '../components/maintenance/MaintenanceDetailsModal';
import { MaintenanceItemDetailsModal } from '../components/maintenance/MaintenanceItemDetailsModal';
import { StepViews } from '../components/orders/StepViews';
import { EntityManagementModals } from '../components/modals/EntityManagementModals';
import { AttachmentsModal } from '../components/modals/AttachmentsModal';
import { InspectionModal } from '../components/modals/InspectionModal';
import { EntityListViews } from '../components/orders/EntityListViews';
import { StatusBadge, getTransportTypeBadge } from '../components/orders/StatusBadges';
import { LinkingModals } from '../components/modals/LinkingModals';
import { OrdersHeader } from '../components/orders/OrdersHeader';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { OrdersContent } from '../components/orders/OrdersContent';
import { MaintenanceContent } from '../components/maintenance/MaintenanceContent';
import { MAINTENANCE_COLUMNS } from '../constants/orders';

export default function App(props: OrdersAndMaintenanceProps) {
  return (
    <OrdersProvider {...props}>
      <OrdersAndMaintenanceInner {...props} />
    </OrdersProvider>
  );
}

function OrdersAndMaintenanceInner({ 
  realCompanies = [], 
  realSites = [], 
  realEquipment = [],
  realCategories = [],
  asModal = false
}: OrdersAndMaintenanceProps) {
  
  const {
    ui, items: itemMgmt, orders: ordersData, maintenance: maintenanceData,
    files, excel, resizing, processed, actions, appData
  } = useOrdersContext();

  const {
    currentSection, setCurrentSection, isModalOpen, setIsModalOpen, viewMode, setViewMode,
    historyMode, selectedStatuses, setSelectedStatuses, selectedOrderIds, setSelectedOrderIds,
    selectedMaintenanceIds, setSelectedMaintenanceIds, isActionMenuOpen, setIsActionMenuOpen,
    isCreateMenuOpen, setIsCreateMenuOpen, isModifyMenuOpen, setIsModifyMenuOpen,
    isApartadosMenuOpen, setIsApartadosMenuOpen, isSidebarOpen, setIsSidebarOpen,
    editingOrderId, setEditingOrderId, createOrderType, setCreateOrderType,
    nombre, setNombre, isNombreManual, setIsNombreManual, cliente, setCliente,
    destino, setDestino, fecha, setFecha, tipoTransporte, setTipoTransporte,
    viewingOrder, setViewingOrder, viewingMaintenanceCard, setViewingMaintenanceCard,
    viewingItemDetails, setViewingItemDetails, columnWidths, setColumnWidths,
    confirmDialog, setConfirmDialog, isAttachmentsModalOpen, setIsAttachmentsModalOpen,
    commentPanelWidth, setCommentPanelWidth, windowWidth, setWindowWidth,
    commentAttachments, setCommentAttachments, newComment, setNewComment,
    isUploading, setIsUploading, isDraggingComment, setIsDraggingComment,
    isDraggingAttachments, setIsDraggingAttachments, resizingColumn, setResizingColumn,
    isEditingViewingTitle, setIsEditingViewingTitle, viewingTitleInput, setViewingTitleInput,
    isRazonDropdownOpen, setIsRazonDropdownOpen, openTipoCobroId, setOpenTipoCobroId,
    editingMaintenanceCard, setEditingMaintenanceCard, editingMaintenanceStage, setEditingMaintenanceStage,
    maintenanceViewMode, setMaintenanceViewMode, orderForNewInspection, setOrderForNewInspection,
    selectedItemsForInspection, setSelectedItemsForInspection, newInspectionChoiceCard, setNewInspectionChoiceCard,
    linkingOrderToMaintenance, setLinkingOrderToMaintenance, linkingMaintenanceToOrder, setLinkingMaintenanceToOrder,
    linkOrderSearchQuery, setLinkOrderSearchQuery, verifyingOrder, setVerifyingOrder,
    confirmingOrder, setConfirmingOrder, coordinatingOrder, setCoordinatingOrder,
    transportingOrder, setTransportingOrder, companies, setCompanies,
    constructionSites, setConstructionSites, handleSaveClient, handleEditClient,
    handleSaveWork, handleEditWork, handleSaveSupplier, handleEditSupplier,
    tableColOrder, setTableColOrder, draggedColId, setDraggedColId,
    maintTableColOrder, setMaintTableColOrder, maintDraggedColId, setMaintDraggedColId,
    tableColWidths, setTableColWidths, tableExpandMode, setTableExpandMode,
    sortRules, setSortRules, groupBy, ordersFilters, maintenanceFilters, isSaved, setIsSaved, items, setItems,
    setIsNewClientModalOpen, setIsNewWorkModalOpen, setIsNewSupplierModalOpen, setHistoryMode,
    isNewClientModalOpen, isNewWorkModalOpen, isNewSupplierModalOpen, wizardConfig, setWizardConfig,
    clientDuplicateError, setClientDuplicateError, forceCreationConfirmDialog, setForceCreationConfirmDialog,
    setExpandedOrders, expandedOrders
  } = ui;

  const { orders: history, updateOrder, updateOrderField, deleteOrder, updateOrderStatus } = ordersData;
  const { maintenanceCards, setMaintenanceCards, updateMaintenanceCard, updateMaintenanceField, updateMaintenanceItems, deleteMaintenanceCard, updateMaintenanceStatus } = maintenanceData;
  const { handleAddItem, handleRemoveItem, handleItemChange, handleUpdateMaintenanceItemEquipo, handleUpdateMaintenanceItemIdEquipo, handleUpdateMaintenanceItemCantidad, handleUpdateMaintenanceItemProvider, handleRemoveMaintenanceItem, handleAddEmptyMaintenanceItem } = itemMgmt;
  const { handleCommentFileUpload, handleFileUpload, handleProviderFileUpload, handleProviderRmDvFileUpload, handleRmDvFileUpload, handleFotosYOtrosFileUpload, handleAttachmentsDrop, handleDeleteAttachment, handleAttachmentsDragOver, handleAttachmentsDragLeave, handleCommentDragOver, handleCommentDragLeave, handleCommentDrop } = files;
  const { triggerImport, handleImportExcel, importFileRef } = excel;
  const { handleResizeMouseDown } = resizing;
  const { sortedOrders: sortedHistory, sortedMaintenance: sortedMaintenanceHistory, processedOrders: processedData, processedMaintenance: processedMaintenanceData } = processed;
  const { handleDeleteOrder, handleStartLogistics, handleSave, handleEdit, handleCancelEdit, handleMoveStageBackward, handleMoveStageForward, handleRevertToTransport, handleCompleteLogistics, handleStartTransport, handleCompleteTransport } = actions.orders;
  const { handleSaveMaintenanceCard, handleCreateMaintenanceFromOrder, executeCreateMaintenanceFromOrder, handleCreateStandaloneMaintenance } = actions.maintenance;
  const { handleAddComment } = actions.comments;
  const { equipmentOptions, vehicleOptions } = appData;


  
  
  
  
  
  

  const labels = (currentSection === 'orders' || currentSection === 'maintenance') 
    ? SECTION_LABELS[currentSection as 'orders' | 'maintenance'] 
    : SECTION_LABELS.orders;

  
  
  
  
  
  

  
  
  
  
  
  
  
  

  
  
  
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const modifyMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
      if (modifyMenuRef.current && !modifyMenuRef.current.contains(event.target as Node)) {
        setIsModifyMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateOrder = (type: 'ALQUILER' | 'TRANSPORTE' = 'ALQUILER') => {
    setCreateOrderType(type);
    setEditingOrderId(null);
    setNombre('');
    setIsNombreManual(false);
    setCliente('');
    setDestino('');
    setItems([{ id: crypto.randomUUID(), equipo: '', cantidad: '' }]);
    setIsModalOpen(true);
    setIsCreateMenuOpen(false);
  };


  
  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  





  
  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  
  
  

  
  
  
  
  

  
  
  
  

  // States for Maintenance Table
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  
    const activeFilters = currentSection === 'orders' ? ordersFilters : maintenanceFilters;
  const filterRules = activeFilters.filterRules;

  const inputRef = useRef<HTMLInputElement>(null);
;

  const isEditingAnyCard = verifyingOrder || coordinatingOrder || editingOrderId || editingMaintenanceCard || transportingOrder || isModalOpen;

  return (
    <div className={asModal ? 'absolute top-[-9999px] left-[-9999px] w-0 h-0 overflow-hidden bg-transparent' : 'w-full h-full flex flex-col bg-slate-50 min-h-0 overflow-hidden'}>
      <div className={asModal ? '' : `flex flex-col flex-1 transition-all duration-300 min-h-0`}>
        <div className="mx-auto w-full transition-all duration-300">
          <OrdersHeader
            currentSection={currentSection as any}
            historyMode={historyMode === true || historyMode === 'history' ? 'history' : 'active'}
            setHistoryMode={setHistoryMode as any}
            viewMode={viewMode}
            setViewMode={setViewMode}
            tableExpandMode={tableExpandMode}
            setTableExpandMode={setTableExpandMode}
            handleCreateOrder={handleCreateOrder}
            handleCreateTransport={() => {}} 
            handleCreateStandaloneMaintenance={handleCreateStandaloneMaintenance}
            sortRules={sortRules}
            setSortRules={ui.setSortRules}
            groupBy={groupBy}
            setGroupBy={ui.setGroupBy}
            activeFilters={activeFilters}
            labels={labels}
            history={history}
            maintenanceCards={maintenanceCards}
            setIsNewWorkModalOpen={setIsNewWorkModalOpen}
            setIsNewClientModalOpen={setIsNewClientModalOpen}
            setIsNewSupplierModalOpen={setIsNewSupplierModalOpen}
            triggerImport={triggerImport}
          />
        </div>
        {isModalOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto mt-4 mb-4 hide-scrollbar">
            <OrderFormModal
              isModalOpen={isModalOpen}
              handleCancelEdit={handleCancelEdit}
              handleSave={handleSave}
              editingOrderId={editingOrderId}
              createOrderType={createOrderType}
              cliente={cliente}
              setCliente={setCliente}
              destino={destino}
              setDestino={setDestino}
              fecha={fecha}
              setFecha={setFecha}
              tipoTransporte={tipoTransporte}
              setTipoTransporte={setTipoTransporte}
              items={items}
              handleItemChange={handleItemChange}
              handleRemoveItem={handleRemoveItem}
              handleAddItem={handleAddItem}
              companies={ui.companies}
              constructionSites={ui.constructionSites}
              equipmentOptions={equipmentOptions}
              isNombreManual={ui.isNombreManual}
              nombre={ui.nombre}
              setNombre={setNombre}
              setIsSaved={setIsSaved}
            />
          </div>
        )}

        <LinkingModals
          linkingOrderToMaintenance={linkingOrderToMaintenance}
          setLinkingOrderToMaintenance={setLinkingOrderToMaintenance}
          maintenanceCards={maintenanceCards}
          updateMaintenanceField={updateMaintenanceField}
          setConfirmDialog={setConfirmDialog}
          linkingMaintenanceToOrder={linkingMaintenanceToOrder}
          setLinkingMaintenanceToOrder={setLinkingMaintenanceToOrder}
          history={history || []}
          editingMaintenanceCard={editingMaintenanceCard}
          setEditingMaintenanceCard={setEditingMaintenanceCard}
          updateMaintenanceCard={updateMaintenanceCard}
          generateMaintenanceTitle={generateMaintenanceTitle}
          linkOrderSearchQuery={linkOrderSearchQuery}
          setLinkOrderSearchQuery={setLinkOrderSearchQuery}
        />

        {/* Hidden File Input for Excel Import */}
        <input 
          type="file"
          ref={importFileRef}
          onChange={handleImportExcel}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

                <EntityManagementModals
          isNewClientModalOpen={isNewClientModalOpen}
          setIsNewClientModalOpen={setIsNewClientModalOpen}
          isNewWorkModalOpen={isNewWorkModalOpen}
          setIsNewWorkModalOpen={setIsNewWorkModalOpen}
          isNewSupplierModalOpen={isNewSupplierModalOpen}
          setIsNewSupplierModalOpen={setIsNewSupplierModalOpen}
          handleCreateClient={handleSaveClient}
          handleCreateWork={handleSaveWork}
          handleCreateSupplier={handleSaveSupplier}
          companies={companies}
          constructionSites={constructionSites}
          wizardConfig={wizardConfig}
          setWizardConfig={setWizardConfig}
          clientDuplicateError={clientDuplicateError}
          setClientDuplicateError={setClientDuplicateError}
          forceCreationConfirmDialog={forceCreationConfirmDialog}
          setForceCreationConfirmDialog={setForceCreationConfirmDialog}
        />
        {viewingOrder && (
          <OrderDetailsModal
            viewingOrder={viewingOrder}
            setViewingOrder={setViewingOrder}
            updateOrder={updateOrder}
            updateOrderField={updateOrderField}
            updateOrderStatus={updateOrderStatus}
            history={history || []}
            setEditingOrderId={setEditingOrderId}
            setIsModalOpen={setIsModalOpen}
            setCoordinatingOrder={setCoordinatingOrder}
            setTransportingOrder={setTransportingOrder}
            setConfirmDialog={setConfirmDialog}
            asModal={asModal}
            viewMode={viewMode}
            commentPanelWidth={commentPanelWidth}
            setCommentPanelWidth={setCommentPanelWidth}
            windowWidth={windowWidth}
            commentAttachments={commentAttachments}
            setCommentAttachments={setCommentAttachments}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={(id, text, extraFields) => handleAddComment(id, false, text, extraFields)}
            isDraggingComment={isDraggingComment}
            handleCommentDragOver={handleCommentDragOver}
            handleCommentDragLeave={handleCommentDragLeave}
            handleCommentDrop={handleCommentDrop}
            handleCommentFileUpload={handleCommentFileUpload}
            isModifyMenuOpen={isModifyMenuOpen}
            setIsModifyMenuOpen={setIsModifyMenuOpen}
            isActionMenuOpen={isActionMenuOpen}
            setIsActionMenuOpen={setIsActionMenuOpen}
            modifyMenuRef={modifyMenuRef}
            actionMenuRef={actionMenuRef}
            getStatusBadge={(order) => <StatusBadge order={order} />}
            handleChecklistItemChange={(orderId, item, checked) => {
              updateOrderField(orderId, 'checklist', { ...(history?.find(o => o.id === orderId)?.checklist || {}), [item]: checked });
              if (viewingOrder?.id === orderId) {
                setViewingOrder(prev => prev ? { ...prev, checklist: { ...(prev.checklist || {}), [item]: checked } } : null);
              }
            }}
            handleDeleteCommentAttachment={(orderId, commentId, attachmentId) => handleDeleteAttachment(orderId, commentId, attachmentId, false)}
            handleDeleteOrder={handleDeleteOrder}
            handleEdit={handleEdit}
            handleStartLogistics={handleStartLogistics}
            handleStartTransport={handleStartTransport}
            handleMoveStageBackward={handleMoveStageBackward}
            handleMoveStageForward={handleMoveStageForward}
            handleRevertToTransport={handleRevertToTransport}
            handleCreateMaintenanceFromOrder={handleCreateMaintenanceFromOrder}
            setLinkingOrderToMaintenance={setLinkingOrderToMaintenance}
            setEditingMaintenanceCard={setEditingMaintenanceCard}
            setViewMode={setViewMode}
            setIsAttachmentsModalOpen={setIsAttachmentsModalOpen}
            setIsSaved={setIsSaved}
            isEditingViewingTitle={isEditingViewingTitle}
            setIsEditingViewingTitle={setIsEditingViewingTitle}
            viewingTitleInput={viewingTitleInput}
            setViewingTitleInput={setViewingTitleInput}
            maintenanceCards={maintenanceCards || []}
            companies={companies}
          />
        )}

        {viewingMaintenanceCard && (
          <MaintenanceDetailsModal
            viewingMaintenanceCard={viewingMaintenanceCard}
            setViewingMaintenanceCard={setViewingMaintenanceCard}
            updateMaintenanceCard={updateMaintenanceCard}
            deleteMaintenanceCard={deleteMaintenanceCard}
            updateMaintenanceStatus={updateMaintenanceStatus}
            updateMaintenanceItems={updateMaintenanceItems}
            updateMaintenanceField={updateMaintenanceField}
            maintenanceCards={maintenanceCards || []}
            setEditingMaintenanceCard={setEditingMaintenanceCard}
            setEditingMaintenanceStage={setEditingMaintenanceStage}
            setConfirmDialog={setConfirmDialog}
            asModal={asModal}
            maintenanceViewMode={maintenanceViewMode as "simple" | "detailed"}
            commentPanelWidth={commentPanelWidth}
            setCommentPanelWidth={setCommentPanelWidth}
            windowWidth={windowWidth}
            isDraggingComment={isDraggingComment}
            commentAttachments={commentAttachments}
            setCommentAttachments={setCommentAttachments}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={(id, isMaintenance, text, extraFields) => handleAddComment(id, true, text, extraFields)}
            handleCommentFileUpload={handleCommentFileUpload}
            handleCommentDragOver={handleCommentDragOver}
            handleCommentDragLeave={handleCommentDragLeave}
            handleCommentDrop={handleCommentDrop}
            handleDeleteCommentAttachment={(cardId, commentId, attachmentId) => handleDeleteAttachment(cardId, commentId, attachmentId, true)}
            setViewingItemDetails={setViewingItemDetails}
          />
        )}

        {viewingItemDetails && (
          <MaintenanceItemDetailsModal
            item={viewingItemDetails}
            onClose={() => setViewingItemDetails(null)}
          />
        )}

        <AttachmentsModal
          isOpen={isAttachmentsModalOpen}
          onClose={() => setIsAttachmentsModalOpen(false)}
          viewingOrder={viewingOrder}
          isDraggingAttachments={isDraggingAttachments}
          isUploading={isUploading}
          handleAttachmentsDragOver={handleAttachmentsDragOver}
          handleAttachmentsDragLeave={handleAttachmentsDragLeave}
          handleAttachmentsDrop={handleAttachmentsDrop}
          handleFileUpload={handleFileUpload}
          handleDeleteAttachment={handleDeleteAttachment}
        />

        {(transportingOrder || editingMaintenanceCard || coordinatingOrder) && (
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <StepViews
              transportingOrder={transportingOrder}
              setTransportingOrder={setTransportingOrder}
              history={history || []}
              companies={companies}
              handleCompleteTransport={handleCompleteTransport}
              handleProviderFileUpload={handleProviderFileUpload}
              handleProviderRmDvFileUpload={handleProviderRmDvFileUpload}
              editingMaintenanceCard={editingMaintenanceCard}
              setEditingMaintenanceCard={setEditingMaintenanceCard}
              editingMaintenanceStage={editingMaintenanceStage}
              setEditingMaintenanceStage={setEditingMaintenanceStage}
              maintenanceViewMode={maintenanceViewMode}
              setMaintenanceViewMode={setMaintenanceViewMode}
              MAINTENANCE_COLUMNS={MAINTENANCE_COLUMNS}
              generateMaintenanceTitle={generateMaintenanceTitle}
              setLinkingMaintenanceToOrder={setLinkingMaintenanceToOrder}
              columnWidths={columnWidths}
              handleResizeMouseDown={handleResizeMouseDown}
              equipmentOptions={equipmentOptions}
              constructionSites={constructionSites}
              openTipoCobroId={openTipoCobroId}
              setOpenTipoCobroId={setOpenTipoCobroId}
              setViewingItemDetails={setViewingItemDetails}
              handleUpdateMaintenanceItemEquipo={handleUpdateMaintenanceItemEquipo}
              handleUpdateMaintenanceItemIdEquipo={handleUpdateMaintenanceItemIdEquipo}
              handleUpdateMaintenanceItemCantidad={handleUpdateMaintenanceItemCantidad}
              handleUpdateMaintenanceItemProvider={handleUpdateMaintenanceItemProvider}
              handleAddEmptyMaintenanceItem={handleAddEmptyMaintenanceItem}
              handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
              updateMaintenanceItems={updateMaintenanceItems}
              handleSaveMaintenanceCard={handleSaveMaintenanceCard}
              setViewingOrder={setViewingOrder}
              coordinatingOrder={coordinatingOrder}
              setCoordinatingOrder={setCoordinatingOrder}
              handleCompleteLogistics={handleCompleteLogistics}
              isRazonDropdownOpen={isRazonDropdownOpen}
              setIsRazonDropdownOpen={setIsRazonDropdownOpen}
              vehicleOptions={vehicleOptions}
            />
          </div>
        )}

        {!transportingOrder && !editingMaintenanceCard && !coordinatingOrder && (
          <div className={`mt-4 mb-4 flex flex-col flex-1 min-h-0 ${isModalOpen ? 'hidden' : ''}`}>
            <EntityListViews
              currentSection={currentSection}
              constructionSites={constructionSites}
              companies={companies}
              handleEditWork={handleEditWork}
              handleEditClient={handleEditClient}
              handleEditSupplier={handleEditSupplier}
            />

            {currentSection === 'maintenance' ? (
              <MaintenanceContent
                currentSection={currentSection}
                viewMode={viewMode}
                historyMode={historyMode === true || historyMode === 'history' ? 'history' : 'active'}
                maintenanceCards={maintenanceCards}
                sortedMaintenanceHistory={sortedMaintenanceHistory}
                processedMaintenanceData={processedMaintenanceData}
                selectedMaintenanceIds={selectedMaintenanceIds}
                setSelectedMaintenanceIds={setSelectedMaintenanceIds}
                deleteMaintenanceCard={deleteMaintenanceCard}
                setConfirmDialog={setConfirmDialog}
                setViewingMaintenanceCard={setViewingMaintenanceCard}
                setMaintenanceViewMode={setMaintenanceViewMode}
                MAINTENANCE_COLUMNS={MAINTENANCE_COLUMNS}
                generateMaintenanceTitle={generateMaintenanceTitle}
                setMaintenanceCards={setMaintenanceCards}
                updateMaintenanceStatus={updateMaintenanceStatus}
                updateMaintenanceItems={updateMaintenanceItems}
                maintTableColOrder={maintTableColOrder}
                setMaintTableColOrder={setMaintTableColOrder}
                maintDraggedColId={maintDraggedColId}
                setMaintDraggedColId={setMaintDraggedColId}
                columnWidths={columnWidths}
                setColumnWidths={setColumnWidths}
                activeFilters={activeFilters}
                setSelectedStatuses={setSelectedStatuses}
                sortRules={sortRules}
                setSortRules={setSortRules}
                toggleOrderExpansion={(id, e) => {
                   e.stopPropagation();
                   setExpandedOrders(prev => {
                     const next = new Set(prev);
                     if (next.has(id)) next.delete(id);
                     else next.add(id);
                     return next;
                   });
                 }}
                expandedOrders={expandedOrders}
                isModalOpen={isModalOpen}
              />
            ) : currentSection === 'orders' ? (
              <OrdersContent
                currentSection={currentSection}
                viewMode={viewMode}
                historyMode={historyMode === true || historyMode === 'history' ? 'history' : 'active'}
                history={history}
                sortedHistory={sortedHistory}
                processedData={processedData}
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                selectedOrderIds={selectedOrderIds}
                setSelectedOrderIds={setSelectedOrderIds}
                deleteOrder={deleteOrder}
                handleDeleteOrder={handleDeleteOrder}
                setConfirmDialog={setConfirmDialog}
                setViewingOrder={setViewingOrder}
                maintenanceCards={maintenanceCards}
                handleMoveStageBackward={handleMoveStageBackward}
                handleMoveStageForward={handleMoveStageForward}
                getStatusBadge={(order) => <StatusBadge order={order} />}
                toggleOrderExpansion={(id, e) => {
                  e.stopPropagation();
                  setExpandedOrders(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  });
                }}
                expandedOrders={expandedOrders}
                tableColOrder={tableColOrder}
                setTableColOrder={setTableColOrder}
                draggedColId={draggedColId}
                setDraggedColId={setDraggedColId}
                tableColWidths={tableColWidths}
                setTableColWidths={setTableColWidths}
                tableExpandMode={tableExpandMode}
                activeFilters={activeFilters}
                isModalOpen={isModalOpen}
              />
            ) : null}
          </div>
        )}
      </div>

      <InspectionModal
        order={orderForNewInspection}
        isOpen={!!orderForNewInspection}
        onClose={() => {
          setOrderForNewInspection(null);
          setSelectedItemsForInspection(new Set());
        }}
        selectedItems={selectedItemsForInspection}
        onToggleItem={(itemId) => {
          const newSet = new Set(selectedItemsForInspection);
          if (newSet.has(itemId)) newSet.delete(itemId);
          else newSet.add(itemId);
          setSelectedItemsForInspection(newSet);
        }}
        onConfirm={(toMaintenance) => {
          executeCreateMaintenanceFromOrder(orderForNewInspection!, selectedItemsForInspection, toMaintenance);
          setOrderForNewInspection(null);
          setSelectedItemsForInspection(new Set());
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={() => {
          const callback = confirmDialog.onConfirm;
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => callback(), 0);
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        isAlert={confirmDialog.isAlert}
      />
    </div>
  );
}

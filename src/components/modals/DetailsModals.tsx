import React from 'react';
import { Order, MaintenanceCard, Attachment, Comment } from '../../types';
import { OrderDetailsModal } from '../orders/OrderDetailsModal';
import { MaintenanceDetailsModal } from '../maintenance/MaintenanceDetailsModal';
import { MaintenanceItemDetailsModal } from '../maintenance/MaintenanceItemDetailsModal';

interface DetailsModalsProps {
  viewingOrder: Order | null;
  setViewingOrder: (order: Order | null) => void;
  updateOrder: (order: Order) => void;
  updateOrderField: (orderId: string, field: keyof Order, value: any) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: any) => void;
  history: Order[];
  setEditingOrderId: (id: string | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setCoordinatingOrder: (order: Order | null) => void;
  setTransportingOrder: (order: Order | null) => void;
  setConfirmDialog: (config: any) => void;
  asModal: boolean;
  viewMode: string;
  commentPanelWidth: number;
  setCommentPanelWidth: (width: number) => void;
  windowWidth: number;
  isDraggingComment: boolean;
  commentAttachments: Attachment[];
  setCommentAttachments: (attachments: Attachment[]) => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleAddComment: () => void;
  handleCommentFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommentDragOver: (e: React.DragEvent) => void;
  handleCommentDragLeave: (e: React.DragEvent) => void;
  handleCommentDrop: (e: React.DragEvent) => void;
  isModifyMenuOpen: boolean;
  setIsModifyMenuOpen: (isOpen: boolean) => void;
  isActionMenuOpen: boolean;
  setIsActionMenuOpen: (isOpen: boolean) => void;
  modifyMenuRef: React.RefObject<HTMLDivElement>;
  actionMenuRef: React.RefObject<HTMLDivElement>;
  getStatusBadge: (order: Order) => React.ReactNode;
  handleChecklistItemChange: (orderId: string, item: string, checked: boolean) => void;
  handleDeleteCommentAttachment: (attachmentId: string) => void;
  
  viewingMaintenanceCard: MaintenanceCard | null;
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  updateMaintenanceCard: (card: MaintenanceCard) => void;
  deleteMaintenanceCard: (id: string) => void;
  updateMaintenanceStatus: (id: string, status: any) => void;
  updateMaintenanceItems: (cardId: string, items: any[]) => void;
  maintenanceCards: MaintenanceCard[];
  setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
  setEditingMaintenanceStage: (stage: 'recepcion' | 'inspeccion' | 'presupuesto' | 'reparacion' | 'entrega') => void;
  maintenanceViewMode: string;
  setViewingItemDetails: (item: any | null) => void;
  viewingItemDetails: any | null;
}

export const DetailsModals: React.FC<DetailsModalsProps> = ({
  viewingOrder,
  setViewingOrder,
  updateOrder,
  updateOrderField,
  deleteOrder,
  updateOrderStatus,
  history,
  setEditingOrderId,
  setIsModalOpen,
  setCoordinatingOrder,
  setTransportingOrder,
  setConfirmDialog,
  asModal,
  viewMode,
  commentPanelWidth,
  setCommentPanelWidth,
  windowWidth,
  isDraggingComment,
  commentAttachments,
  setCommentAttachments,
  newComment,
  setNewComment,
  handleAddComment,
  handleCommentFileUpload,
  handleCommentDragOver,
  handleCommentDragLeave,
  handleCommentDrop,
  isModifyMenuOpen,
  setIsModifyMenuOpen,
  isActionMenuOpen,
  setIsActionMenuOpen,
  modifyMenuRef,
  actionMenuRef,
  getStatusBadge,
  handleChecklistItemChange,
  handleDeleteCommentAttachment,
  
  viewingMaintenanceCard,
  setViewingMaintenanceCard,
  updateMaintenanceCard,
  deleteMaintenanceCard,
  updateMaintenanceStatus,
  updateMaintenanceItems,
  maintenanceCards,
  setEditingMaintenanceCard,
  setEditingMaintenanceStage,
  maintenanceViewMode,
  setViewingItemDetails,
  viewingItemDetails
}) => {
  return (
    <>
      {/* Order Detail Modal */}
      {viewingOrder && (
        <OrderDetailsModal
          viewingOrder={viewingOrder}
          setViewingOrder={setViewingOrder}
          updateOrder={updateOrder}
          updateOrderField={updateOrderField}
          deleteOrder={deleteOrder}
          updateOrderStatus={updateOrderStatus}
          history={history}
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
          handleAddComment={handleAddComment}
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
          getStatusBadge={getStatusBadge}
          handleChecklistItemChange={handleChecklistItemChange}
          handleDeleteCommentAttachmentFromOrder={handleDeleteCommentAttachment}
        />
      )}

      {/* Maintenance Card Detail Modal */}
      {viewingMaintenanceCard && (
        <MaintenanceDetailsModal
          viewingMaintenanceCard={viewingMaintenanceCard}
          setViewingMaintenanceCard={setViewingMaintenanceCard}
          updateMaintenanceCard={updateMaintenanceCard}
          deleteMaintenanceCard={deleteMaintenanceCard}
          updateMaintenanceStatus={updateMaintenanceStatus}
          updateMaintenanceItems={updateMaintenanceItems}
          maintenanceCards={maintenanceCards}
          setEditingMaintenanceCard={setEditingMaintenanceCard}
          setEditingMaintenanceStage={setEditingMaintenanceStage}
          setConfirmDialog={setConfirmDialog}
          asModal={asModal}
          maintenanceViewMode={maintenanceViewMode}
          commentPanelWidth={commentPanelWidth}
          setCommentPanelWidth={setCommentPanelWidth}
          windowWidth={windowWidth}
          isDraggingComment={isDraggingComment}
          commentAttachments={commentAttachments}
          setCommentAttachments={setCommentAttachments}
          newComment={newComment}
          setNewComment={setNewComment}
          handleAddComment={handleAddComment}
          handleCommentFileUpload={handleCommentFileUpload}
          handleCommentDragOver={handleCommentDragOver}
          handleCommentDragLeave={handleCommentDragLeave}
          handleCommentDrop={handleCommentDrop}
          handleDeleteCommentAttachment={handleDeleteCommentAttachment}
          setViewingItemDetails={setViewingItemDetails}
        />
      )}

      {/* Maintenance Item Details Modal */}
      <MaintenanceItemDetailsModal
        viewingItemDetails={viewingItemDetails}
        setViewingItemDetails={setViewingItemDetails}
        maintenanceViewMode={maintenanceViewMode === 'simplified' ? 'simplified' : 'detailed'}
      />
    </>
  );
};

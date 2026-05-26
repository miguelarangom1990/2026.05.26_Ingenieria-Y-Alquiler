import React from 'react';
import { Order, MaintenanceCard, Company, ConstructionSite } from '../../types';
import { TransportStepUI } from './TransportStepUI';
import { LogisticsStepUI } from './LogisticsStepUI';
import { MaintenanceStepUI } from '../maintenance/MaintenanceStepUI';

interface StepViewsProps {
  transportingOrder: Order | null;
  setTransportingOrder: (order: Order | null) => void;
  history: Order[];
  companies: Company[];
  handleCompleteTransport: () => void;
  handleProviderFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProviderRmDvFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  editingMaintenanceCard: MaintenanceCard | null;
  setEditingMaintenanceCard: (card: MaintenanceCard | null) => void;
  editingMaintenanceStage: 'recepcion' | 'inspeccion' | 'presupuesto' | 'reparacion' | 'entrega';
  setEditingMaintenanceStage: (stage: 'recepcion' | 'inspeccion' | 'presupuesto' | 'reparacion' | 'entrega') => void;
  maintenanceViewMode: string;
  setMaintenanceViewMode: (mode: string) => void;
  MAINTENANCE_COLUMNS: any;
  generateMaintenanceTitle: (items: any[], cliente: string) => string;
  setLinkingMaintenanceToOrder: (id: string | null) => void;
  columnWidths: Record<string, number>;
  handleResizeMouseDown: (id: string, e: React.MouseEvent) => void;
  equipmentOptions: any[];
  constructionSites: ConstructionSite[];
  openTipoCobroId: string | null;
  setOpenTipoCobroId: (id: string | null) => void;
  setViewingItemDetails: (item: any | null) => void;
  handleUpdateMaintenanceItemEquipo: (cardId: string, itemId: string, equipo: string) => void;
  handleUpdateMaintenanceItemIdEquipo: (cardId: string, itemId: string, idEquipo: string) => void;
  handleUpdateMaintenanceItemCantidad: (cardId: string, itemId: string, cantidad: number) => void;
  handleUpdateMaintenanceItemProvider: (cardId: string, itemId: string, provider: string) => void;
  handleAddEmptyMaintenanceItem: () => void;
  handleRemoveMaintenanceItem: (itemId: string) => void;
  updateMaintenanceItems: (cardId: string, items: any[]) => void;
  handleSaveMaintenanceCard: (e: any, stage: string) => void;
  setViewingOrder: (order: Order | null) => void;
  
  coordinatingOrder: Order | null;
  setCoordinatingOrder: (order: Order | null) => void;
  handleCompleteLogistics: () => void;
  isRazonDropdownOpen: boolean;
  setIsRazonDropdownOpen: (isOpen: boolean) => void;
  vehicleOptions: any[];
}

export const StepViews: React.FC<StepViewsProps> = ({
  transportingOrder,
  setTransportingOrder,
  history,
  companies,
  handleCompleteTransport,
  handleProviderFileUpload,
  handleProviderRmDvFileUpload,
  
  editingMaintenanceCard,
  setEditingMaintenanceCard,
  editingMaintenanceStage,
  setEditingMaintenanceStage,
  maintenanceViewMode,
  setMaintenanceViewMode,
  MAINTENANCE_COLUMNS,
  generateMaintenanceTitle,
  setLinkingMaintenanceToOrder,
  columnWidths,
  handleResizeMouseDown,
  equipmentOptions,
  constructionSites,
  openTipoCobroId,
  setOpenTipoCobroId,
  setViewingItemDetails,
  handleUpdateMaintenanceItemEquipo,
  handleUpdateMaintenanceItemIdEquipo,
  handleUpdateMaintenanceItemCantidad,
  handleUpdateMaintenanceItemProvider,
  handleAddEmptyMaintenanceItem,
  handleRemoveMaintenanceItem,
  updateMaintenanceItems,
  handleSaveMaintenanceCard,
  setViewingOrder,
  
  coordinatingOrder,
  setCoordinatingOrder,
  handleCompleteLogistics,
  isRazonDropdownOpen,
  setIsRazonDropdownOpen,
  vehicleOptions,
}) => {
  if (transportingOrder) {
    return (
      <TransportStepUI 
        transportingOrder={transportingOrder} 
        setTransportingOrder={setTransportingOrder} 
        companies={companies} 
        handleCompleteTransport={handleCompleteTransport} 
        handleProviderFileUpload={handleProviderFileUpload} 
        handleProviderRmDvFileUpload={handleProviderRmDvFileUpload} 
      />
    );
  }

  if (editingMaintenanceCard) {
    return (
      <MaintenanceStepUI 
        editingMaintenanceCard={editingMaintenanceCard}
        history={history}
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
        companies={companies}
        openTipoCobroId={openTipoCobroId}
        setOpenTipoCobroId={setOpenTipoCobroId}
        setViewingItemDetails={setViewingItemDetails}
        handleUpdateMaintenanceItemEquipo={handleUpdateMaintenanceItemEquipo}
        handleUpdateMaintenanceItemIdEquipo={handleUpdateMaintenanceItemIdEquipo}
        handleUpdateMaintenanceItemCantidad={handleUpdateMaintenanceItemCantidad}
        handleUpdateMaintenanceItemProvider={handleUpdateMaintenanceItemProvider}
        handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
        handleAddEmptyMaintenanceItem={handleAddEmptyMaintenanceItem}
        handleSaveCard={(e) => {
          if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
          }
          handleSaveMaintenanceCard(e, editingMaintenanceStage);
        }}
        setViewingOrder={setViewingOrder}
      />
    );
  }

  if (coordinatingOrder) {
    return (
      <LogisticsStepUI 
        coordinatingOrder={coordinatingOrder} 
        setCoordinatingOrder={setCoordinatingOrder} 
        companies={companies} 
        handleCompleteLogistics={handleCompleteLogistics} 
        isRazonDropdownOpen={isRazonDropdownOpen} 
        setIsRazonDropdownOpen={setIsRazonDropdownOpen} 
        vehicleOptions={vehicleOptions} 
      />
    );
  }

  return null;
};

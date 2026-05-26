import { useState } from 'react';
import { MaintenanceCard, MaintenanceItem, MaintenanceStatus } from '../types';
import { useFilterManagement } from './useFilterManagement';

export function useMaintenanceState() {
  const [viewingMaintenanceCard, setViewingMaintenanceCard] = useState<MaintenanceCard | null>(null);
  const [viewingItemDetails, setViewingItemDetails] = useState<MaintenanceItem | null>(null);
  const [linkingMaintenanceToOrder, setLinkingMaintenanceToOrder] = useState<string | null>(null);
  const [editingMaintenanceCard, setEditingMaintenanceCard] = useState<MaintenanceCard | null>(null);
  const [maintTableExpandMode, setMaintTableExpandMode] = useState<'collapsed' | 'expanded'>('collapsed');
  const [maintenanceViewMode, setMaintenanceViewMode] = useState<'simplified' | 'detailed'>('simplified');
  const [selectedMaintenanceIds, setSelectedMaintenanceIds] = useState<Set<string>>(new Set());
  const [editingMaintenanceStage, setEditingMaintenanceStage] = useState<MaintenanceStatus | null>(null);
  
  const maintenanceFilters = useFilterManagement([]);

  return {
    viewingMaintenanceCard, setViewingMaintenanceCard,
    viewingItemDetails, setViewingItemDetails,
    linkingMaintenanceToOrder, setLinkingMaintenanceToOrder,
    editingMaintenanceCard, setEditingMaintenanceCard,
    maintTableExpandMode, setMaintTableExpandMode,
    maintenanceViewMode, setMaintenanceViewMode,
    selectedMaintenanceIds, setSelectedMaintenanceIds,
    editingMaintenanceStage, setEditingMaintenanceStage,
    maintenanceFilters
  };
}

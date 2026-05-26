import { useState, useCallback, useEffect } from 'react';
import { Order, MaintenanceCard, MaintenanceItem, MaintenanceStatus, OrderStatus, SortRule, FilterRule, Attachment, LineItem, Company, ConstructionSite, SectionType, ClientConfirmDialogState, WizardConfigState, ConfirmDialogState } from '../types';
import { useFilterManagement } from './useFilterManagement';
import { useClientManagement } from './useClientManagement';
import { useWorkManagement } from './useWorkManagement';
import { useSupplierManagement } from './useSupplierManagement';
import { useOrdersState } from './useOrdersState';
import { useMaintenanceState } from './useMaintenanceState';
import { useOrdersUI } from './useOrdersUI';

export function useOrdersAndMaintenanceUI(initialCompanies: Company[] = [], initialSites: ConstructionSite[] = []) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [constructionSites, setConstructionSites] = useState<ConstructionSite[]>(initialSites);
  
  const clientMgmt = useClientManagement(companies, setCompanies);
  const workMgmt = useWorkManagement(constructionSites, setConstructionSites);
  const supplierMgmt = useSupplierManagement(companies, setCompanies);
  
  const ordersState = useOrdersState();
  const maintenanceState = useMaintenanceState();
  const ordersUI = useOrdersUI();

  // Sincronizar con datos reales
  useEffect(() => {
    if (initialCompanies && initialCompanies.length > 0) {
      const mapped = initialCompanies.map(c => {
        return {
          ...c,
          name: c.name || c.legalName || 'Sin nombre'
        };
      });
      setCompanies(mapped);
    }
  }, [initialCompanies]);

  useEffect(() => {
    if (initialSites && initialSites.length > 0) {
      const mapped = initialSites.filter(s => !s.isVirtualObra).map(s => ({
        ...s,
        id: s.id,
        name: s.name,
        clientId: s.clientId
      })) as ConstructionSite[];
      setConstructionSites(mapped);
    }
  }, [initialSites]);

  useEffect(() => {
    localStorage.setItem('app_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('app_constructionSites', JSON.stringify(constructionSites));
  }, [constructionSites]);

  const [resizingColumn, setResizingColumn] = useState<{
    id: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  return {
    ...clientMgmt,
    ...workMgmt,
    ...supplierMgmt,
    ...ordersState,
    ...maintenanceState,
    ...ordersUI,
    resizingColumn, setResizingColumn,
    companies, setCompanies,
    constructionSites, setConstructionSites,
  };
}

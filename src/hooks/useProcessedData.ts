import { useMemo } from 'react';
import { Order, MaintenanceCard, SortRule, FilterRule, OrderStatus, MaintenanceStatus, SortField, SortDirection } from '../types';
import { getProcessedHistory, getProcessedMaintenanceHistory } from '../lib/orderUtils';

interface UseProcessedDataProps {
  history: Order[];
  maintenanceCards: MaintenanceCard[];
  sortRules: SortRule[];
  ordersFilterRules: FilterRule[];
  maintenanceFilterRules: FilterRule[];
  historyMode: boolean | 'active' | 'history';
  selectedStatuses: string[];
  groupBy: string | null;
}

export const useProcessedData = ({
  history,
  maintenanceCards,
  sortRules,
  ordersFilterRules,
  maintenanceFilterRules,
  historyMode,
  selectedStatuses,
  groupBy
}: UseProcessedDataProps) => {
  const mode = historyMode === true || historyMode === 'history' ? 'history' : 'active';

  const processedOrders = useMemo(() => getProcessedHistory(
    history,
    sortRules,
    ordersFilterRules,
    mode,
    selectedStatuses as OrderStatus[],
    groupBy || ''
  ), [history, sortRules, ordersFilterRules, mode, selectedStatuses, groupBy]);

  const sortedOrders = useMemo(() => processedOrders.groups.flatMap(g => g.items), [processedOrders]);

  const processedMaintenance = useMemo(() => getProcessedMaintenanceHistory(
    maintenanceCards,
    sortRules,
    maintenanceFilterRules,
    mode,
    selectedStatuses as unknown as MaintenanceStatus[],
    groupBy || ''
  ), [maintenanceCards, sortRules, maintenanceFilterRules, mode, selectedStatuses, groupBy]);

  const sortedMaintenance = useMemo(() => processedMaintenance.groups.flatMap(g => g.items), [processedMaintenance]);

  return {
    processedOrders,
    sortedOrders,
    processedMaintenance,
    sortedMaintenance
  };
};

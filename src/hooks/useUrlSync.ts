import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Order, MaintenanceCard } from '../types';

interface UseUrlSyncProps {
  viewingOrder: Order | null;
  setViewingOrder: (order: Order | null) => void;
  viewingMaintenanceCard: MaintenanceCard | null;
  setViewingMaintenanceCard: (card: MaintenanceCard | null) => void;
  history: Order[];
  maintenanceCards: MaintenanceCard[];
  currentSection: string;
  setCurrentSection: (section: any) => void;
  asModal: boolean;
}

export const useUrlSync = ({
  viewingOrder,
  setViewingOrder,
  viewingMaintenanceCard,
  setViewingMaintenanceCard,
  history,
  maintenanceCards,
  currentSection,
  setCurrentSection,
  asModal
}: UseUrlSyncProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const previousViewingOrder = useRef(viewingOrder);
  const previousViewingMaintenance = useRef(viewingMaintenanceCard);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let changed = false;

    if (previousViewingOrder.current && !viewingOrder && params.has('orderId')) {
      params.delete('orderId');
      changed = true;
    }

    if (previousViewingMaintenance.current && !viewingMaintenanceCard && params.has('maintenanceId')) {
      params.delete('maintenanceId');
      changed = true;
    }

    previousViewingOrder.current = viewingOrder;
    previousViewingMaintenance.current = viewingMaintenanceCard;

    if (changed) {
      if (asModal) {
        navigate(-1);
      } else {
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        navigate(`${location.pathname}${newSearch}`, { replace: true });
      }
    }
  }, [viewingOrder, viewingMaintenanceCard, location.search, location.pathname, navigate, asModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    const urlOrderId = params.get('orderId');
    if (urlOrderId && history && history.length > 0) {
      const orderToView = history.find(o => o.id === urlOrderId);
      if (orderToView && (!viewingOrder || viewingOrder.id !== urlOrderId)) {
        setViewingOrder(orderToView);
        if (currentSection !== 'orders') setCurrentSection('orders');
      }
    }

    const urlMaintenanceId = params.get('maintenanceId');
    if (urlMaintenanceId && maintenanceCards && maintenanceCards.length > 0) {
      const maintenanceToView = maintenanceCards.find(m => m.id === urlMaintenanceId);
      if (maintenanceToView && (!viewingMaintenanceCard || viewingMaintenanceCard.id !== urlMaintenanceId)) {
        setViewingMaintenanceCard(maintenanceToView);
        if (currentSection !== 'maintenance') setCurrentSection('maintenance');
      }
    }
  }, [location.search, history, maintenanceCards]);
};

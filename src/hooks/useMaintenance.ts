import { useFirebaseSync } from './useFirebaseSync';
import { MaintenanceCard, MaintenanceStatus, MaintenanceItem } from '../types';

export function useMaintenance() {
  const [maintenanceCards, setMaintenanceCards] = useFirebaseSync<MaintenanceCard>('maintenanceCards');

  const addMaintenanceCard = (card: MaintenanceCard) => {
    setMaintenanceCards(prev => [card, ...prev]);
  };

  const updateMaintenanceCard = (updatedCard: MaintenanceCard) => {
    setMaintenanceCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const updateMaintenanceField = <K extends keyof MaintenanceCard>(cardId: string, field: K, value: MaintenanceCard[K]) => {
    setMaintenanceCards(prev => prev.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };

  const updateMaintenanceItems = (cardId: string, items: MaintenanceItem[]) => {
    setMaintenanceCards(prev => prev.map(c => c.id === cardId ? { ...c, items } : c));
  };

  const deleteMaintenanceCard = (cardId: string) => {
    setMaintenanceCards(prev => prev.filter(c => c.id !== cardId));
  };

  const updateMaintenanceStatus = (cardId: string, status: MaintenanceStatus) => {
    setMaintenanceCards(prev => prev.map(c => c.id === cardId ? { ...c, status } : c));
  };

  return {
    maintenanceCards,
    setMaintenanceCards,
    addMaintenanceCard,
    updateMaintenanceCard,
    updateMaintenanceField,
    updateMaintenanceItems,
    deleteMaintenanceCard,
    updateMaintenanceStatus
  };
}

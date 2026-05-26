import React, { createContext, useContext, ReactNode } from 'react';
import { useMasterLogic } from '../hooks/useMasterLogic';
import { Company, ConstructionSite, Equipment, EquipmentCategory } from '../types';

interface AppProviderProps {
  children: ReactNode;
  realCompanies: Company[];
  realSites: ConstructionSite[];
  realEquipment: Equipment[];
  realCategories: EquipmentCategory[];
  asModal?: boolean;
}

const OrdersContext = createContext<ReturnType<typeof useMasterLogic> | undefined>(undefined);

export const OrdersProvider: React.FC<AppProviderProps> = ({ 
  children, 
  realCompanies, 
  realSites, 
  realEquipment, 
  realCategories, 
  asModal = false 
}) => {
  const logic = useMasterLogic(
    realCompanies, 
    realSites, 
    realEquipment, 
    realCategories, 
    asModal
  );

  return (
    <OrdersContext.Provider value={logic}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return context;
};

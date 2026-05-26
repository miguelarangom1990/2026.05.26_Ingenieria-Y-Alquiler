import React, { useCallback } from 'react';
import { LineItem, MaintenanceStatus, MaintenanceCard, Equipment } from '../types';
import { generateOrderTitle, generateMaintenanceTitle, cleanInput } from '../lib/utils';

interface UseItemManagementProps {
  items: LineItem[];
  setItems: (items: LineItem[]) => void;
  setNombre: (nombre: string) => void;
  isNombreManual: boolean;
  setIsSaved: (isSaved: boolean) => void;
  setEditingMaintenanceCard: React.Dispatch<React.SetStateAction<MaintenanceCard | null>>;
}

export function useItemManagement({
  items,
  setItems,
  setNombre,
  isNombreManual,
  setIsSaved,
  setEditingMaintenanceCard
}: UseItemManagementProps) {
  const handleAddItem = useCallback(() => {
    setItems([...items, { 
      id: crypto.randomUUID(), 
      equipmentId: '',
      equipo: '', 
      cantidad: 1, 
      precio: 0 
    }]);
    setIsSaved(false);
  }, [items, setItems, setIsSaved]);

  const handleRemoveItem = useCallback((id: string) => {
    if (items.length > 1) {
      const newItems = items.filter(item => item.id !== id);
      setItems(newItems);
      if (!isNombreManual) {
        setNombre(generateOrderTitle(newItems));
      }
      setIsSaved(false);
    }
  }, [items, setItems, isNombreManual, setNombre, setIsSaved]);

  const handleItemChange = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(newItems);
    if (!isNombreManual) {
        setNombre(generateOrderTitle(newItems));
    }
    setIsSaved(false);
  }, [items, setItems, isNombreManual, setNombre, setIsSaved]);

  // Maintenance Item Handlers
  const handleUpdateMaintenanceItemProvider = useCallback((itemId: string, provider: string) => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: (prev.items || []).map(item => 
          item.id === itemId ? { ...item, proveedorMantenimiento: cleanInput(provider) } : item
        )
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleUpdateMaintenanceItemStatus = useCallback((itemId: string, status: MaintenanceStatus) => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: (prev.items || []).map(item => 
          item.id === itemId ? { ...item, estado: status } : item
        )
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleRemoveMaintenanceItem = useCallback((itemId: string) => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      const nextItems = (prev.items || []).filter(item => item.id !== itemId);
      return {
        ...prev,
        items: nextItems,
        nombre: prev.isManualTitle ? prev.nombre : generateMaintenanceTitle(nextItems, prev.cliente)
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleAddEmptyMaintenanceItem = useCallback(() => {
    const newItem = {
      id: crypto.randomUUID(),
      equipo: '',
      cantidad: 1,
      estado: 'SOLICITUD_REVISION' as MaintenanceStatus,
      cotProvMantEnviada: 'Sin Solicitar' as any
    };
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      const nextItems = [...(prev.items || []), newItem];
      return {
        ...prev,
        items: nextItems,
        nombre: prev.isManualTitle ? prev.nombre : generateMaintenanceTitle(nextItems, prev.cliente)
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleUpdateMaintenanceItemEquipo = useCallback((itemId: string, equipo: string) => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      const nextItems = (prev.items || []).map(item => 
        item.id === itemId ? { ...item, equipo: cleanInput(equipo) } : item
      );
      return {
        ...prev,
        items: nextItems,
        nombre: prev.isManualTitle ? prev.nombre : generateMaintenanceTitle(nextItems, prev.cliente)
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleUpdateMaintenanceItemIdEquipo = useCallback((itemId: string, idEquipo: string) => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: (prev.items || []).map(item => 
          item.id === itemId ? { ...item, idEquipo: cleanInput(idEquipo) } : item
        )
      };
    });
  }, [setEditingMaintenanceCard]);

  const handleUpdateMaintenanceItemCantidad = useCallback((itemId: string, cantidad: number | '') => {
    setEditingMaintenanceCard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: (prev.items || []).map(item => 
          item.id === itemId ? { ...item, cantidad } : item
        )
      };
    });
  }, [setEditingMaintenanceCard]);

  return {
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleUpdateMaintenanceItemProvider,
    handleUpdateMaintenanceItemStatus,
    handleRemoveMaintenanceItem,
    handleAddEmptyMaintenanceItem,
    handleUpdateMaintenanceItemEquipo,
    handleUpdateMaintenanceItemIdEquipo,
    handleUpdateMaintenanceItemCantidad,
  };
}

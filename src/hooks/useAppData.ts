import { useMemo } from 'react';
import { Company, ConstructionSite, Equipment, EquipmentCategory } from '../types';
import { normalizeText } from '../lib/textUtils';
import { EQUIPOS, TIPOS_VEHICULO, FALLBACK_SITES, FALLBACK_CLIENTS, FALLBACK_SUPPLIERS, FALLBACK_TRANSPORTERS } from '../constants/orders';

interface UseAppDataProps {
  realCompanies: Company[];
  realSites: ConstructionSite[];
  realEquipment: Equipment[];
  realCategories: EquipmentCategory[];
}

export const useAppData = ({
  realCompanies,
  realSites,
  realEquipment,
  realCategories
}: UseAppDataProps) => {
  const EQUIPMENT_LIST = useMemo(() => 
    Array.from(new Set(realEquipment.length > 0 ? realEquipment.map(e => e.name) : EQUIPOS)),
    [realEquipment]
  );

  const equipmentOptions = useMemo(() => 
    EQUIPMENT_LIST.map(eq => ({ value: eq, label: eq })).sort((a, b) => a.label.localeCompare(b.label)),
    [EQUIPMENT_LIST]
  );

  const vehicleOptions = useMemo(() => {
    const vehicleCategories = realCategories
      .filter(cat => normalizeText(cat.itemType || '') === 'vehiculos')
      .map(cat => cat.name);

    if (vehicleCategories.length === 0) {
      return TIPOS_VEHICULO.map(v => ({ value: v, label: v })).sort((a, b) => a.label.localeCompare(b.label));
    }

    const vehicleEquipmentNames = Array.from(new Set(
      realEquipment
        .filter(eq => vehicleCategories.includes(eq.category))
        .map(eq => eq.name)
    ));

    if (vehicleEquipmentNames.length === 0) {
      return TIPOS_VEHICULO.map(v => ({ value: v, label: v })).sort((a, b) => a.label.localeCompare(b.label));
    }

    return vehicleEquipmentNames.map(name => ({ value: name, label: name })).sort((a, b) => a.label.localeCompare(b.label));
  }, [realEquipment, realCategories]);

  const DESTINOS = useMemo(() => 
    Array.from(new Set(realSites.length > 0 ? realSites.filter(s => !s.isVirtualObra).map(s => s.name) : FALLBACK_SITES)).sort((a, b) => a.localeCompare(b)),
    [realSites]
  );

  const CLIENTES = useMemo(() => 
    Array.from(new Set(realCompanies.length > 0 
      ? realCompanies.filter(c => c.roles?.includes('Cliente')).map(c => c.name)
      : FALLBACK_CLIENTS)).sort((a, b) => a.localeCompare(b)),
    [realCompanies]
  );

  const PROVEEDORES = useMemo(() => 
    Array.from(new Set(realCompanies.length > 0
      ? realCompanies.filter(c => c.roles?.includes('Proveedor')).map(c => c.name)
      : FALLBACK_SUPPLIERS)).sort((a, b) => a.localeCompare(b)),
    [realCompanies]
  );

  const TRANSPORTISTAS = useMemo(() => 
    Array.from(new Set(realCompanies.length > 0
      ? realCompanies.filter(c => c.roles?.includes('Proveedor')).map(c => c.name)
      : FALLBACK_TRANSPORTERS)).sort((a, b) => a.localeCompare(b)),
    [realCompanies]
  );

  return {
    EQUIPMENT_LIST,
    equipmentOptions,
    vehicleOptions,
    DESTINOS,
    CLIENTES,
    PROVEEDORES,
    TRANSPORTISTAS
  };
};

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Company } from '../types';

export function useSupplierManagement(companies: Company[], setCompanies: Dispatch<SetStateAction<Company[]>>) {
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [newSupplierNit, setNewSupplierNit] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierServices, setNewSupplierServices] = useState<string[]>([]);

  const handleSaveSupplier = useCallback(() => {
    if (!newSupplierNit.trim() || !newSupplierName.trim()) return;
    
    if (editingSupplierId) {
      setCompanies(prev => prev.map(c => 
        c.id === editingSupplierId ? { ...c, name: newSupplierName, nit: newSupplierNit, services: newSupplierServices } : c
      ));
    } else {
      const newSupplier: Company = {
        id: crypto.randomUUID(),
        name: newSupplierName,
        roles: ['Proveedor'],
        taxId: newSupplierNit,
        services: newSupplierServices,
        legalName: newSupplierName,
        commercialName: newSupplierName,
        shortName: newSupplierName,
        entityType: 'Empresa',
        linkageStatus: 'Vinculado',
        contactPerson: '',
        phone: ''
      } as Company;
      setCompanies(prev => [...prev, newSupplier]);
    }
    
    setIsNewSupplierModalOpen(false);
    setEditingSupplierId(null);
    setNewSupplierNit('');
    setNewSupplierName('');
    setNewSupplierServices([]);
  }, [editingSupplierId, newSupplierNit, newSupplierName, newSupplierServices, setCompanies]);

  const handleEditSupplier = useCallback((supplier: any) => {
    setEditingSupplierId(supplier.id);
    setNewSupplierNit(supplier.taxId || supplier.nit || '');
    setNewSupplierName(supplier.name);
    setNewSupplierServices(supplier.services || []);
    setIsNewSupplierModalOpen(true);
  }, []);

  return {
    isNewSupplierModalOpen, setIsNewSupplierModalOpen,
    editingSupplierId, setEditingSupplierId,
    newSupplierNit, setNewSupplierNit,
    newSupplierName, setNewSupplierName,
    newSupplierServices, setNewSupplierServices,
    handleSaveSupplier,
    handleEditSupplier
  };
}

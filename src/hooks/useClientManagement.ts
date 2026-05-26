import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Company, ClientConfirmDialogState } from '../types';
import { normalizeText } from '../lib/textUtils';
import { isSimilarCompany } from '../lib/similarityUtils';

export function useClientManagement(companies: Company[], setCompanies: Dispatch<SetStateAction<Company[]>>) {
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newClientNit, setNewClientNit] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [clientDuplicateError, setClientDuplicateError] = useState<string | null>(null);
  const [clientConfirmDialog, setClientConfirmDialog] = useState<ClientConfirmDialogState>({isOpen: false, isSimilarName: false, isSimilarNit: false});
  const [verifiedClientName, setVerifiedClientName] = useState<string>('');
  const [verifiedClientNit, setVerifiedClientNit] = useState<string>('');

  const handleSaveClient = useCallback((skipSimilarCheck?: boolean) => {
    if (!newClientNit.trim() || !newClientName.trim()) return;

    const isNew = !editingClientId;
    const editingClient = editingClientId ? companies.find(c => c.id === editingClientId) : null;
    const isNameChanged = editingClient && normalizeText(editingClient.name || '') !== normalizeText(newClientName || '');
    const isNitChanged = editingClient && normalizeText(editingClient.taxId || '') !== normalizeText(newClientNit || '');

    const normName = normalizeText(newClientName || '');
    const normNit = normalizeText(newClientNit || '');

    if (isNew || isNameChanged) {
        const exactName = companies.find(c => normalizeText(c.name || '') === normName);
        if (exactName && exactName.id !== editingClientId) {
            setClientDuplicateError("No es posible guardar el registro porque ya existe una empresa con esta misma Razón Social.");
            return;
        }
    }

    if ((isNew || isNitChanged) && newClientNit.trim() !== '') {
        const exactNit = companies.find(c => normalizeText(c.taxId || '') === normNit);
        if (exactNit && exactNit.id !== editingClientId) {
            setClientDuplicateError("No es posible guardar el registro porque ya existe una empresa con este mismo NIT.");
            return;
        }
    }

    if (!skipSimilarCheck && (isNew || isNameChanged || isNitChanged)) {
        const similarNames = companies.filter(c => c.id !== editingClientId && isSimilarCompany(newClientName || '', c.name || ''));
        const similarNits = newClientNit.trim() !== '' ? companies.filter(c => c.id !== editingClientId && isSimilarCompany(newClientNit, c.taxId || '')) : [];

        if ((similarNames.length > 0 && verifiedClientName !== normName) || (similarNits.length > 0 && verifiedClientNit !== normNit)) {
            setClientConfirmDialog({
                isOpen: true,
                isSimilarName: similarNames.length > 0 && verifiedClientName !== normName,
                isSimilarNit: similarNits.length > 0 && verifiedClientNit !== normNit
            });
            return;
        }
    }
    
    if (editingClientId) {
      setCompanies(prev => prev.map(c => 
        c.id === editingClientId ? { ...c, name: newClientName, nit: newClientNit, taxId: newClientNit } : c
      ));
    } else {
      const newClient: Company = {
        id: crypto.randomUUID(),
        name: newClientName,
        roles: ['Cliente'],
        taxId: newClientNit,
        legalName: newClientName,
        commercialName: newClientName,
        shortName: newClientName,
        entityType: 'Empresa',
        linkageStatus: 'Vinculado',
        contactPerson: '',
        phone: ''
      } as Company;
      setCompanies(prev => [...prev, newClient]);
    }
    
    setIsNewClientModalOpen(false);
    setEditingClientId(null);
    setNewClientNit('');
    setNewClientName('');
    setClientConfirmDialog({isOpen: false, isSimilarName: false, isSimilarNit: false});
  }, [editingClientId, companies, newClientNit, newClientName, setCompanies, verifiedClientName, verifiedClientNit]);

  const handleEditClient = useCallback((client: any) => {
    setEditingClientId(client.id);
    setNewClientNit(client.taxId || client.nit || '');
    setNewClientName(client.name);
    setIsNewClientModalOpen(true);
  }, []);

  return {
    isNewClientModalOpen, setIsNewClientModalOpen,
    editingClientId, setEditingClientId,
    newClientNit, setNewClientNit,
    newClientName, setNewClientName,
    clientDuplicateError, setClientDuplicateError,
    clientConfirmDialog, setClientConfirmDialog,
    verifiedClientName, setVerifiedClientName,
    verifiedClientNit, setVerifiedClientNit,
    handleSaveClient,
    handleEditClient
  };
}

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { ConstructionSite } from '../types';

export function useWorkManagement(constructionSites: ConstructionSite[], setConstructionSites: Dispatch<SetStateAction<ConstructionSite[]>>) {
  const [isNewWorkModalOpen, setIsNewWorkModalOpen] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [newWorkName, setNewWorkName] = useState('');
  const [newWorkDepartamento, setNewWorkDepartamento] = useState('');
  const [newWorkMunicipio, setNewWorkMunicipio] = useState('');
  const [newWorkLocation, setNewWorkLocation] = useState('');
  const [newWorkClientId, setNewWorkClientId] = useState('');

  const handleSaveWork = useCallback((work?: Partial<ConstructionSite>) => {
    const finalName = work?.name || newWorkName;
    const finalClientId = work?.clientId || newWorkClientId;
    const finalLocation = work?.location || newWorkLocation;
    
    if (!finalName.trim() || !finalClientId) return;
    
    if (editingWorkId) {
      setConstructionSites(prev => prev.map(s => 
        s.id === editingWorkId ? { ...s, name: finalName, departamento: newWorkDepartamento, municipio: newWorkMunicipio, location: finalLocation, clientId: finalClientId } : s
      ));
    } else {
      const newWork: ConstructionSite = {
        id: crypto.randomUUID(),
        name: finalName,
        departamento: newWorkDepartamento,
        municipio: newWorkMunicipio,
        location: finalLocation || 'Ubicación por defecto',
        clientId: finalClientId,
        status: 'Activa'
      } as ConstructionSite;
      setConstructionSites(prev => [...prev, newWork]);
    }
    
    setIsNewWorkModalOpen(false);
    setEditingWorkId(null);
    setNewWorkName('');
    setNewWorkDepartamento('');
    setNewWorkMunicipio('');
    setNewWorkLocation('');
    setNewWorkClientId('');
  }, [editingWorkId, newWorkName, newWorkDepartamento, newWorkMunicipio, newWorkLocation, newWorkClientId, setConstructionSites]);

  const handleEditWork = useCallback((site: any) => {
    setEditingWorkId(site.id);
    setNewWorkName(site.name);
    setNewWorkDepartamento(site.departamento || '');
    setNewWorkMunicipio(site.municipio || '');
    setNewWorkLocation(site.location);
    setNewWorkClientId(site.clientId || site.companyId);
    setIsNewWorkModalOpen(true);
  }, []);

  return {
    isNewWorkModalOpen, setIsNewWorkModalOpen,
    editingWorkId, setEditingWorkId,
    newWorkName, setNewWorkName,
    newWorkDepartamento, setNewWorkDepartamento,
    newWorkMunicipio, setNewWorkMunicipio,
    newWorkLocation, setNewWorkLocation,
    newWorkClientId, setNewWorkClientId,
    handleSaveWork,
    handleEditWork
  };
}

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Company, ConstructionSite } from '../types';

interface UseExcelImportProps {
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  setConstructionSites: React.Dispatch<React.SetStateAction<ConstructionSite[]>>;
  companies: Company[];
}

export const useExcelImport = ({ setCompanies, setConstructionSites, companies }: UseExcelImportProps) => {
  const [importType, setImportType] = useState<'cliente' | 'proveedor' | 'obra' | null>(null);
  const [activeImportDropdown, setActiveImportDropdown] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: 'cliente' | 'proveedor' | 'obra') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'cliente' || type === 'proveedor') {
      data = [{ Nombre: 'Ejemplo Empresa', NIT: '123456789-0' }];
      filename = `Plantilla_${type === 'cliente' ? 'Clientes' : 'Proveedores'}.xlsx`;
    } else if (type === 'obra') {
      data = [{ Nombre: 'Obra Ejemplo', Cliente: 'Nombre del Cliente Existente', Ubicacion: 'Calle 123 #45-67' }];
      filename = 'Plantilla_Obras.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, filename);
    setActiveImportDropdown(null);
  };

  const triggerImport = (type: 'cliente' | 'proveedor' | 'obra') => {
    setImportType(type);
    setActiveImportDropdown(null);
    if (importFileRef.current) {
      importFileRef.current.click();
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importType) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (importType === 'cliente' || importType === 'proveedor') {
        const newCompanies: Company[] = data.map(row => ({
          id: crypto.randomUUID(),
          name: row.Nombre || row.nombre || row.NAME || '',
          taxId: row.NIT || row.nit || row.Nit || '',
          roles: importType === 'cliente' ? ['Cliente'] : ['Proveedor'],
          legalName: row.Nombre || row.nombre || row.NAME || '',
          commercialName: row.Nombre || row.nombre || row.NAME || '',
          shortName: row.Nombre || row.nombre || row.NAME || '',
          entityType: 'Empresa',
          linkageStatus: 'Vinculado',
          contactPerson: '',
          phone: ''
        } as Company)).filter(c => c.name);

        setCompanies(prev => [...prev, ...newCompanies]);
      } else if (importType === 'obra') {
        const newWorks: ConstructionSite[] = data.map(row => {
          const clientName = row.Cliente || row.cliente || row.CLIENT || '';
          const client = companies.find(c => 
            c.name.toLowerCase() === clientName.toLowerCase() && 
            (c.roles?.includes('Cliente') || (c as any).type === 'cliente')
          );
          
          return {
            id: crypto.randomUUID(),
            name: row.Nombre || row.nombre || row.NAME || '',
            location: row.Ubicacion || row.ubicacion || 'Ubicación importada',
            clientId: client?.id || '',
            status: 'Activa'
          } as ConstructionSite;
        }).filter(w => w.name);

        setConstructionSites(prev => [...prev, ...newWorks]);
      }

      if (importFileRef.current) importFileRef.current.value = '';
      setImportType(null);
    };
    reader.readAsBinaryString(file);
  };

  return {
    importType,
    setImportType,
    activeImportDropdown,
    setActiveImportDropdown,
    importFileRef,
    downloadTemplate,
    triggerImport,
    handleImportExcel
  };
};

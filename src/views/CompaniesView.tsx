import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, FilterX, Check, Briefcase, Truck, Users, FileSpreadsheet, FileDown, FileUp, ChevronDown, Loader2, UploadCloud, AlertCircle, AlertTriangle, LayoutGrid, List as ListIcon, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Company, Person, ContactDetail } from '../types';
import { saveItem, deleteItem, uploadFile } from '../services/firebaseService';
import { cleanInput, trimInput, formatTitleCase } from '../lib/utils';
import * as utils from 'xlsx';
import { writeFile } from 'xlsx';
import PersonModal from '../components/PersonModal';
import { WordCasingAdjuster } from '../components/WordCasingAdjuster';
import { normalizeText } from '../lib/textUtils';
import { isSimilarCompany } from '../lib/similarityUtils';
import { Can } from '../components/Can';

interface CompaniesViewProps {
  companies: Company[];
  people: Person[];
  onAddPerson: (person: Person) => void;
  isLoading?: boolean;
}

const CompaniesView: React.FC<CompaniesViewProps> = ({ companies, people, onAddPerson, isLoading }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  type SortKey = 'name' | 'roles' | 'contact' | 'phone' | 'status' | 'createdAt' | 'updatedAt';
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}[]>([]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      const existingSort = prev.find(s => s.key === key);
      const others = prev.filter(s => s.key !== key);
      let newDirection: 'asc' | 'desc' = 'asc';
      
      if (existingSort && prev[0]?.key === key) {
        newDirection = existingSort.direction === 'asc' ? 'desc' : 'asc';
      } else if (existingSort) {
        newDirection = existingSort.direction; 
      }

      return [{ key, direction: newDirection }, ...others].slice(0, 3);
    });
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
    const activeSort = sortConfig.find(s => s.key === sortKey);
    const priority = sortConfig.findIndex(s => s.key === sortKey);

    return (
      <th 
        className={`px-6 py-4 font-black uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none group ${activeSort ? 'text-indigo-600' : 'text-slate-500'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="flex flex-col">
             {!activeSort && <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />}
             {activeSort && activeSort.direction === 'asc' && <ArrowUp size={12} />}
             {activeSort && activeSort.direction === 'desc' && <ArrowDown size={12} />}
          </div>
          {activeSort && sortConfig.length > 1 && <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 rounded-full">{priority + 1}</span>}
        </div>
      </th>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const [filterRole, setFilterRole] = useState<'Todos' | 'Cliente' | 'Proveedor' | 'Ambos'>('Todos');
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isShortNameManual, setIsShortNameManual] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [companyConfirmDialog, setCompanyConfirmDialog] = useState<{isOpen: boolean, isSimilarName: boolean, isSimilarNit: boolean, companyData: Company | null}>({isOpen: false, isSimilarName: false, isSimilarNit: false, companyData: null});
  const [verifiedCompanyName, setVerifiedCompanyName] = useState<string>('');
  const [verifiedCompanyNit, setVerifiedCompanyNit] = useState<string>('');

  const [wizardConfig, setWizardConfig] = useState<{isOpen: boolean, field: 'name' | 'nit' | null, value: string}>({isOpen: false, field: null, value: ''});
  const [forceCreationConfirmDialog, setForceCreationConfirmDialog] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);
  
  const initialFormState: Partial<Company> = {
    name: '',
    legalName: '',
    commercialName: '',
    shortName: '',
    entityType: 'Empresa',
    roles: ['Cliente'],
    linkageStatus: 'Potencial',
    source: 'Gestión Comercial',
    taxId: '',
    contactPerson: '',
    phone: '',
    email: '',
    services: []
  };
  
  const [formData, setFormData] = useState<Partial<Company>>(initialFormState);

  // Auto-generate shortName based on commercialName if not in manual mode
  useEffect(() => {
    if (isModalOpen && !isShortNameManual) {
        const commercialName = formData.commercialName || '';
        const newShortName = commercialName.substring(0, 16);
        setFormData(prev => {
            if (prev.shortName !== newShortName) {
                return { ...prev, shortName: newShortName };
            }
            return prev;
        });
    }
  }, [formData.commercialName, isModalOpen, isShortNameManual]);

  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);

  const getAssignedPeople = () => {
    if (!formData.id) return [];
    return people.filter(p => p.entityId === formData.id);
  };

  const handleAddPersonToCompany = () => {
    setIsAddPersonModalOpen(true);
  };

  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = companies.filter(c => {
      const assignedPeople = people.filter(p => p.entityId === c.id);
      const peopleSearchText = assignedPeople.map(p => `${p.firstName} ${p.lastName} ${p.phones[0]?.value || ''}`).join(' ').toLowerCase();
      
      const matchesSearch = (c.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                            (c.taxId || '').includes(search) || 
                            peopleSearchText.includes(search.toLowerCase());
      
      let matchesRole = true;
      if (filterRole === 'Cliente') {
        matchesRole = c.roles?.includes('Cliente');
      } else if (filterRole === 'Proveedor') {
        matchesRole = c.roles?.includes('Proveedor');
      } else if (filterRole === 'Ambos') {
        matchesRole = c.roles?.includes('Cliente') && c.roles?.includes('Proveedor');
      }
      
      return matchesSearch && matchesRole;
    });

    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of sortConfig) {
          let valA: string = '';
          let valB: string = '';
          
          let mainContactA = '';
          let mainContactPhoneA = '';
          const companyPeopleA = people.filter(p => p.entityId === a.id);
          if(companyPeopleA.length > 0) {
            mainContactA = `${companyPeopleA[0].firstName} ${companyPeopleA[0].lastName}`;
            mainContactPhoneA = companyPeopleA[0].phones[0]?.value || '';
          }

          let mainContactB = '';
          let mainContactPhoneB = '';
          const companyPeopleB = people.filter(p => p.entityId === b.id);
          if(companyPeopleB.length > 0) {
            mainContactB = `${companyPeopleB[0].firstName} ${companyPeopleB[0].lastName}`;
            mainContactPhoneB = companyPeopleB[0].phones[0]?.value || '';
          }

          switch (sort.key) {
            case 'name':
              valA = (a.name || '').toLowerCase();
              valB = (b.name || '').toLowerCase();
              break;
            case 'roles':
              valA = (a.roles || []).join(',').toLowerCase();
              valB = (b.roles || []).join(',').toLowerCase();
              break;
            case 'contact':
              valA = mainContactA.toLowerCase();
              valB = mainContactB.toLowerCase();
              break;
            case 'phone':
              valA = mainContactPhoneA.toLowerCase();
              valB = mainContactPhoneB.toLowerCase();
              break;
            case 'status':
              valA = (a.linkageStatus || '').toLowerCase();
              valB = (b.linkageStatus || '').toLowerCase();
              break;
            case 'createdAt':
              valA = a.createdAt || '';
              valB = b.createdAt || '';
              break;
            case 'updatedAt':
              valA = a.updatedAt || '';
              valB = b.updatedAt || '';
              break;
          }

          if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [companies, search, filterRole, sortConfig, people]);

  const handleOpenNew = () => {
    setEditingCompany(null);
    setFormData({ ...initialFormState, id: `comp-${Date.now()}` });
    setIsShortNameManual(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData(company);
    
    // Detect if shortName was manual: if different from first 16 chars of commercialName
    const commercialName = company.commercialName || '';
    const autoShortName = commercialName.substring(0, 16);
    setIsShortNameManual(company.shortName !== autoShortName);
    
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setCompanyToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (companyToDelete) {
      await deleteItem('companies', companyToDelete);
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleToggleRole = (role: 'Cliente' | 'Proveedor') => {
    setFormData(prev => {
      const currentRoles = prev.roles || [];
      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) return prev;
        return { ...prev, roles: currentRoles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  const handleToggleService = (service: string) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      if (currentServices.includes(service)) {
        return { ...prev, services: currentServices.filter(s => s !== service) };
      } else {
        return { ...prev, services: [...currentServices, service] };
      }
    });
  };

  const handleToggleClientService = (service: string) => {
    setFormData(prev => {
      const currentServices = prev.clientServices || [];
      if (currentServices.includes(service)) {
        return { ...prev, clientServices: currentServices.filter(s => s !== service) };
      } else {
        return { ...prev, clientServices: [...currentServices, service] };
      }
    });
  };

  const handleSubmit = async (e?: React.FormEvent, skipSimilarCheck?: boolean) => {
    if (e) e.preventDefault();
    const isTaxIdRequired = formData.linkageStatus !== 'Potencial';
    if (!formData.name || (isTaxIdRequired && !formData.taxId) || !formData.roles || formData.roles.length === 0) {
      alert('Por favor completa los campos obligatorios y selecciona al menos un rol.');
      return;
    }

    const isNew = !editingCompany;
    const isNameChanged = editingCompany && normalizeText(editingCompany.name || '') !== normalizeText(formData.name || '');
    const isNitChanged = editingCompany && normalizeText(editingCompany.taxId || '') !== normalizeText(formData.taxId || '');

    const normName = normalizeText(formData.name || '');
    const normNit = normalizeText(formData.taxId || '');

    if (formData.propiedadDeLaEmpresa === 'Propia') {
        const existingPropia = companies.find(c => c.propiedadDeLaEmpresa === 'Propia');
        if (existingPropia && existingPropia.id !== formData.id) {
            alert('No es posible crear más de una empresa propia en el sistema. Ya existe la empresa "'+existingPropia.name+'" configurada como propia.');
            return;
        }
    }

    if (isNew || isNameChanged) {
        const exactName = companies.find(c => normalizeText(c.name || '') === normName);
        if (exactName && exactName.id !== formData.id) {
            setDuplicateError("No es posible guardar el registro porque ya existe una empresa con esta misma Razón Social.");
            return;
        }
    }

    if ((isNew || isNitChanged) && formData.taxId) {
        const exactNit = companies.find(c => normalizeText(c.taxId || '') === normNit);
        if (exactNit && exactNit.id !== formData.id) {
            if (isTaxIdRequired || exactNit.taxId !== '') { // Empty potentially could match if not careful, but normNit handles it if it's there
                 setDuplicateError("No es posible guardar el registro porque ya existe una empresa con este mismo NIT.");
                 return;
            }
        }
    }

    if (!skipSimilarCheck && (isNew || isNameChanged || isNitChanged)) {
        const similarNames = companies.filter(c => c.id !== formData.id && isSimilarCompany(formData.name || '', c.name || ''));
        const similarNits = formData.taxId ? companies.filter(c => c.id !== formData.id && isSimilarCompany(formData.taxId, c.taxId || '')) : [];

        if ((similarNames.length > 0 && verifiedCompanyName !== normName) || (similarNits.length > 0 && verifiedCompanyNit !== normNit)) {
            const now = new Date().toISOString();
            const companyId = editingCompany ? editingCompany.id : `comp-${Date.now()}`;
            const companyData: Company = {
                ...formData,
                id: companyId,
                createdAt: editingCompany ? editingCompany.createdAt : now,
                updatedAt: now
            } as Company;

            setCompanyConfirmDialog({
                isOpen: true,
                isSimilarName: similarNames.length > 0 && verifiedCompanyName !== normName,
                isSimilarNit: similarNits.length > 0 && verifiedCompanyNit !== normNit,
                companyData
            });
            return; 
        }
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const companyId = editingCompany ? editingCompany.id : `comp-${Date.now()}`;
      
      const companyData: Company = {
        ...formData,
        name: formData.name?.trim() || '',
        legalName: formData.legalName?.trim() || '',
        commercialName: formData.commercialName?.trim() || '',
        shortName: formData.shortName?.trim() || '',
        taxId: formData.taxId?.trim() || '',
        id: companyId,
        createdAt: editingCompany ? editingCompany.createdAt : now,
        updatedAt: now
      } as Company;

      await saveItem('companies', companyData);
      setIsModalOpen(false);
      setCompanyConfirmDialog({isOpen: false, isSimilarName: false, isSimilarNit: false, companyData: null});
    } catch (error: any) {
      console.error("Error guardando empresa:", error);
      alert("Error al guardar la empresa: " + (error?.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const dataToExport = [
      ['Razón Social', 'Nombre Comercial', 'Nombre Corto', 'NIT', 'Tipo Entidad', 'Roles', 'Estado Vinculación', 'Fuente', 'Persona de Contacto', 'Teléfono', 'Email Corporativo'],
      ['(Obligatorio)', '(Opcional)', '(Opcional)', '(Obligatorio)', 'Empresa / Persona Natural', 'Cliente / Proveedor / Ambos', 'Vinculado / Potencial', 'Gestión Comercial / Estrategia Digital', '(Opcional)', '(Opcional)', '(Opcional)'],
      ['Constructora Ejemplo SAS', 'ConstruEjemplo', 'CE', '900.123.456-7', 'Empresa', 'Ambos', 'Vinculado', 'Gestión Comercial', 'Juan Perez', '3001234567', 'juan@ejemplo.com']
    ];

    const ws = utils.utils.aoa_to_sheet(dataToExport);
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'] = [25, 20, 15, 20, 20, 20, 20, 25, 20, 15, 25].map(w => ({ wch: w }));

    const wb = utils.utils.book_new();
    utils.utils.book_append_sheet(wb, ws, "Plantilla Empresas");
    
    writeFile(wb, "plantilla_importacion_empresas.xlsx");
    setIsImportMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Company) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file, 'companies/documents');
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (error: any) {
      alert("Error al subir el archivo: " + (error?.message || "Revisa la consola"));
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('Cliente') && roles.includes('Proveedor')) {
      return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md border border-indigo-200 flex items-center gap-1 w-fit"><Building2 size={10}/> Cliente & Proveedor</span>;
    }
    if (roles.includes('Cliente')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-md border border-blue-200 flex items-center gap-1 w-fit"><Users size={10}/> Cliente</span>;
    }
    return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-200 flex items-center gap-1 w-fit"><Truck size={10}/> Proveedor</span>;
  };

  const getMainContact = (companyId: string) => {
    const companyPeople = people.filter(p => p.entityId === companyId);
    if (companyPeople.length === 0) return { name: 'Sin asignar', phone: 'N/A', count: 0 };
    const main = companyPeople[0];
    const phone = main.phones[0]?.value || 'N/A';
    return { name: `${main.firstName} ${main.lastName}`, phone, count: companyPeople.length };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Cargando directorio de empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Directorio de Empresas
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg border border-slate-200">{companies.length} Registros</span>
          </h1>
          <p className="text-slate-500 text-sm">Gestiona clientes, proveedores y empresas mixtas de forma unificada.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm hidden sm:flex">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><ListIcon size={18} /></button>
          </div>

          <Can permission="CREAR_EMPRESAS">
            <div className="relative" ref={importMenuRef}>
              <button 
                onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
                className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95"
              >
                <FileSpreadsheet size={18} />
                Importar
                <ChevronDown size={16} className={`transition-transform duration-200 ${isImportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isImportMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                    >
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <FileDown size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 text-sm">Descargar Plantilla</div>
                        <div className="text-xs text-slate-500">Formato requerido .xlsx</div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left mt-1"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <FileUp size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 text-sm">Subir Archivo</div>
                        <div className="text-xs text-slate-500">Importar datos masivos</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
            </div>

            <button onClick={handleOpenNew} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
              <Plus size={18} /> Nueva Empresa
            </button>
          </Can>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, NIT o contacto..." 
              value={search}
              onChange={(e) => setSearch(cleanInput(e.target.value))}
              onBlur={(e) => setSearch(trimInput(e.target.value))}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['Todos', 'Cliente', 'Proveedor', 'Ambos'] as const).map(role => (
              <button 
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {role === 'Ambos' ? 'Mixtos (Ambos)' : role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'list' && filteredCompanies.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold tracking-wider text-slate-500 uppercase">
                      <SortableHeader label="Empresa" sortKey="name" />
                      <SortableHeader label="Roles" sortKey="roles" />
                      <SortableHeader label="Contacto Principal" sortKey="contact" />
                      <SortableHeader label="Teléfono" sortKey="phone" />
                      <SortableHeader label="Estado" sortKey="status" />
                      <SortableHeader label="Creado" sortKey="createdAt" />
                      <SortableHeader label="Actualizado" sortKey="updatedAt" />
                      <th className="px-6 py-4 text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredCompanies.map(company => (
                      <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 font-bold text-xs">
                                  {(company.name || '??').substring(0, 2).toUpperCase()}
                               </div>
                               <div>
                                  <div className="font-bold text-slate-900">{company.name}</div>
                                  <div className="text-[10px] text-slate-500">NIT: {company.taxId}</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               {getRoleBadge(company.roles || [])}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <span className="font-medium text-slate-700">{getMainContact(company.id).name}</span>
                            {getMainContact(company.id).count > 1 && (
                              <span className="ml-1.5 bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">+{getMainContact(company.id).count - 1}</span>
                            )}
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-slate-600">{getMainContact(company.id).phone}</span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${company.linkageStatus === 'Vinculado' ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md' : 'text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-md'}`}>
                              {company.linkageStatus}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] text-slate-500">{formatDate(company.createdAt)}</span>
                         </td>
                         <td className="px-6 py-4">
                            <span className="text-[10px] text-slate-500">{formatDate(company.updatedAt)}</span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Can permission="EDITAR_EMPRESAS">
                                 <button onClick={() => handleOpenEdit(company)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                               </Can>
                               <Can permission="ELIMINAR_EMPRESAS">
                                 <button onClick={() => handleDelete(company.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                               </Can>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <div key={company.id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all group flex flex-col h-full relative">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Can permission="EDITAR_EMPRESAS">
                   <button onClick={() => handleOpenEdit(company)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                 </Can>
                 <Can permission="ELIMINAR_EMPRESAS">
                   <button onClick={() => handleDelete(company.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                 </Can>
              </div>

              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 font-bold text-lg">
                    {(company.name || '??').substring(0, 2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[200px]" title={company.name}>{company.name}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">NIT: {company.taxId}</div>
                 </div>
              </div>

              <div className="mb-4 space-y-2">
                {getRoleBadge(company.roles || [])}
                {company.roles?.includes('Proveedor') && company.services && company.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {company.services.map(service => (
                      <span key={service} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold uppercase rounded border border-slate-100">
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4 flex-1 text-sm">
                 <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                   <span className="text-slate-400 text-xs">Principal</span>
                   <div className="flex items-center gap-1.5 text-right">
                      <span className="font-medium text-slate-700">{getMainContact(company.id).name}</span>
                      {getMainContact(company.id).count > 1 && (
                        <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">+{getMainContact(company.id).count - 1}</span>
                      )}
                   </div>
                 </div>
                 <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                   <span className="text-slate-400 text-xs">Teléfono</span>
                   <span className="font-medium text-slate-700">{getMainContact(company.id).phone}</span>
                 </div>
                 <div className="flex items-center justify-between pb-2">
                   <span className="text-slate-400 text-xs">Estado</span>
                   <span className={`text-xs font-bold ${company.linkageStatus === 'Vinculado' ? 'text-emerald-600' : 'text-amber-600'}`}>{company.linkageStatus}</span>
                 </div>
              </div>
            </div>
          ))}
          
          {filteredCompanies.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 border border-slate-100">
                <Building2 size={32} />
              </div>
              <h3 className="text-slate-900 font-bold">No se encontraron empresas</h3>
              <p className="text-slate-500 text-sm mt-1">Intenta con otros términos de búsqueda o filtros.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-indigo-50/50">
                 <div>
                    <h2 className="text-xl font-bold text-indigo-900">{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
                    <p className="text-xs text-indigo-700/70 font-medium">Asigna múltiples roles si es necesario</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><FilterX size={20}/></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="company-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Propiedad de la Empresa */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">Propiedad de la empresa <span className="text-rose-500">*</span></label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.propiedadDeLaEmpresa === 'Propia' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors ${formData.propiedadDeLaEmpresa === 'Propia' ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {formData.propiedadDeLaEmpresa === 'Propia' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                        </div>
                        <input type="radio" name="propiedadDeLaEmpresa" className="hidden" checked={formData.propiedadDeLaEmpresa === 'Propia'} onChange={() => setFormData({...formData, propiedadDeLaEmpresa: 'Propia', roles: ['Proveedor']})} required />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Propia</div>
                        </div>
                      </label>
                      
                      <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.propiedadDeLaEmpresa === 'Tercero' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm transition-colors ${formData.propiedadDeLaEmpresa === 'Tercero' ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {formData.propiedadDeLaEmpresa === 'Tercero' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                        </div>
                        <input type="radio" name="propiedadDeLaEmpresa" className="hidden" checked={formData.propiedadDeLaEmpresa === 'Tercero'} onChange={() => setFormData({...formData, propiedadDeLaEmpresa: 'Tercero'})} required />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Tercero</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* SECCIÓN CLAVE: Selección de Roles */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">¿Qué rol cumple esta empresa? <span className="text-rose-500">*</span></label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.propiedadDeLaEmpresa === 'Propia' ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'cursor-pointer ' + (formData.roles?.includes('Cliente') ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-200')}`}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${formData.roles?.includes('Cliente') ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                          {formData.roles?.includes('Cliente') && <Check size={14} strokeWidth={3} />}
                        </div>
                        <input type="checkbox" className="hidden" disabled={formData.propiedadDeLaEmpresa === 'Propia'} checked={formData.roles?.includes('Cliente')} onChange={() => handleToggleRole('Cliente')} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Es Cliente</div>
                          <div className="text-[10px] text-slate-500">Le alquilamos equipos</div>
                        </div>
                      </label>
                      
                      <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.propiedadDeLaEmpresa === 'Propia' ? 'opacity-80 cursor-not-allowed border-amber-500 bg-amber-50/50' : 'cursor-pointer ' + (formData.roles?.includes('Proveedor') ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-amber-200')}`}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${formData.roles?.includes('Proveedor') ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300'}`}>
                          {formData.roles?.includes('Proveedor') && <Check size={14} strokeWidth={3} />}
                        </div>
                        <input type="checkbox" className="hidden" disabled={formData.propiedadDeLaEmpresa === 'Propia'} checked={formData.roles?.includes('Proveedor')} onChange={() => handleToggleRole('Proveedor')} />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Es Proveedor</div>
                          <div className="text-[10px] text-slate-500">Nos alquilan equipos a nosotros</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Información General */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Información General</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo de Entidad <span className="text-rose-500">*</span></label>
                            <select value={formData.entityType} onChange={(e) => setFormData({...formData, entityType: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-500">
                              <option value="Empresa">Empresa</option>
                              <option value="Persona Natural">Persona Natural</option>
                              <option value="Sin identificar">Sin identificar</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado de Vinculación <span className="text-rose-500">*</span></label>
                            <select value={formData.linkageStatus} onChange={(e) => setFormData({...formData, linkageStatus: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-500">
                              <option value="Potencial">Potencial</option>
                              <option value="Vinculado">Vinculado</option>
                            </select>
                        </div>
                        {(formData.roles?.includes('Cliente') || formData.roles?.includes('Proveedor')) && (
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fuente</label>
                              <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-500">
                                <option value="Gestión Comercial">Gestión Comercial</option>
                                <option value="Estrategia Digital">Estrategia Digital</option>
                              </select>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Razón Social <span className="text-rose-500">*</span></label>
                                <WordCasingAdjuster 
                                  value={formData.legalName} 
                                  onChange={(val) => setFormData(prev => ({...prev, legalName: val}))}
                                  label="Razón Social"
                                />
                            </div>
                            <input 
                                type="text" 
                                required 
                                readOnly 
                                onClick={() => setWizardConfig({ isOpen: true, field: 'name', value: formData.legalName || '' })}
                                value={formData.legalName} 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium hover:bg-slate-100 cursor-pointer transition-colors" 
                                placeholder="Clic para editar..."
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre Comercial</label>
                                <WordCasingAdjuster 
                                  value={formData.commercialName || ''} 
                                  onChange={(val) => setFormData(prev => ({...prev, commercialName: val}))}
                                  label="Nombre Comercial"
                                />
                            </div>
                            <input 
                              type="text" 
                              value={formData.commercialName || ''} 
                              onChange={(e) => setFormData(prev => ({...prev, commercialName: cleanInput(e.target.value)}))} 
                              onBlur={(e) => setFormData(prev => ({...prev, commercialName: formatTitleCase(trimInput(e.target.value))}))}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:border-indigo-500" 
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Corto</label>
                                    {isShortNameManual && (
                                        <WordCasingAdjuster 
                                            value={formData.shortName || ''} 
                                            onChange={(val) => setFormData(prev => ({...prev, shortName: val}))}
                                            label="Nombre Corto"
                                        />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsShortNameManual(!isShortNameManual)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                        !isShortNameManual 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {!isShortNameManual ? 'Automático' : 'Manual'}
                                </button>
                            </div>
                            <input 
                                type="text" 
                                maxLength={16} 
                                value={formData.shortName || ''} 
                                onChange={(e) => {
                                  const val = cleanInput(e.target.value);
                                  setIsShortNameManual(true);
                                  setFormData(prev => ({...prev, shortName: val}));
                                }} 
                                onBlur={(e) => setFormData(prev => ({...prev, shortName: formatTitleCase(trimInput(e.target.value))}))}
                                disabled={!isShortNameManual}
                                className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-medium transition-colors ${
                                    !isShortNameManual
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-indigo-500'
                                }`}
                                placeholder="Autocompletado (comercial)"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">NIT / Identificación {formData.linkageStatus !== 'Potencial' && <span className="text-rose-500">*</span>}</label>
                            <input 
                                type="text" 
                                required={formData.linkageStatus !== 'Potencial'} 
                                readOnly 
                                onClick={() => setWizardConfig({ isOpen: true, field: 'nit', value: formData.taxId || '' })}
                                value={formData.taxId} 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium hover:bg-slate-100 cursor-pointer transition-colors" 
                                placeholder="Clic para editar..."
                            />
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN PERSONAL ASIGNADO */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           <h3 className="text-sm font-bold text-slate-900">Contactos de la Empresa</h3>
                           <button 
                               type="button" 
                               onClick={handleAddPersonToCompany} 
                               className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                           >
                               <Users size={14} /> Agregar Contacto
                           </button>
                       </div>
                       <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-[100px]">
                           {getAssignedPeople().length === 0 ? (
                               <p className="text-center text-sm text-slate-400 italic py-6">No hay contactos asignados a esta empresa.</p>
                           ) : (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                   {getAssignedPeople().map(p => (
                                       <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                                           <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                               {p.firstName[0]}{p.lastName[0]}
                                           </div>
                                           <div className="flex-1 min-w-0">
                                               <p className="text-sm font-bold text-slate-800 truncate">{p.firstName} {p.lastName}</p>
                                               <p className="text-xs text-slate-500 mb-1">{p.roles[0]}</p>
                                               <div className="flex flex-col gap-1">
                                                 {p.phones[0] && <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block w-fit border border-slate-100 truncate max-w-full">📱 {p.phones[0].value}</div>}
                                                 {p.emails[0] && <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded inline-block w-fit border border-slate-100 truncate max-w-full">✉️ {p.emails[0].value}</div>}
                                               </div>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                    </div>

                    {/* Servicios Proveedor y Cliente (Ubicados al final) */}
                    {formData.roles?.includes('Proveedor') && (
                      <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-3 flex items-center gap-2">
                          <Briefcase size={14} /> Servicios que presta como proveedor
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['Alquiler', 'Transporte', 'Venta Equipos', 'Mantenimiento Equipos'].map(service => (
                            <label 
                              key={service}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.services?.includes(service) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200'}`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.services?.includes(service) ? 'bg-white text-amber-500 border-white' : 'bg-slate-50 border-slate-300'}`}>
                                {formData.services?.includes(service) && <Check size={10} strokeWidth={4} />}
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={formData.services?.includes(service)} 
                                onChange={() => handleToggleService(service)} 
                              />
                              <span className="text-[10px] font-bold">{service}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.roles?.includes('Cliente') && (
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-3 flex items-center gap-2">
                          <Briefcase size={14} /> Servicios que presta como cliente
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {['Construcción', 'Arquitectura', 'Gerencia', 'Instalaciones eléctricas', 'Instalaciones hidrosanitarias', 'Redes de aire acondicionado', 'Redes de gas', 'Contratista drywall', 'Alquiler'].map(service => (
                            <label 
                              key={service}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.clientServices?.includes(service) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.clientServices?.includes(service) ? 'bg-white text-blue-500 border-white' : 'bg-slate-50 border-slate-300'}`}>
                                {formData.clientServices?.includes(service) && <Check size={10} strokeWidth={4} />}
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={formData.clientServices?.includes(service)} 
                                onChange={() => handleToggleClientService(service)} 
                              />
                              <span className="text-[10px] font-bold">{service}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documentos (Solo si es Vinculado) */}
                    {formData.linkageStatus === 'Vinculado' && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">Documentos Requeridos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[
                             { label: 'RUT', field: 'rutFile' },
                             { label: 'Cámara de Comercio', field: 'chamberOfCommerceFile' },
                             { label: 'Cédula Rep. Legal', field: 'idCardFile' },
                             { label: 'Certificación Bancaria', field: 'bankCertificateFile' },
                             { label: 'Estudio de Crédito', field: 'creditStudyFile' }
                           ].map((doc) => (
                             <div key={doc.field} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-white">
                               <span className="text-xs font-medium text-slate-700">{doc.label}</span>
                               <div className="flex items-center gap-2">
                                 {formData[doc.field as keyof Company] && (
                                   <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                 )}
                                 <label className="cursor-pointer text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-100">
                                   {formData[doc.field as keyof Company] ? 'Actualizar' : 'Subir'}
                                   <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, doc.field as keyof Company)} />
                                 </label>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Cancelar</button>
                 <button type="submit" form="company-form" disabled={isSaving} className="flex-1 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                   {isSaving && <Loader2 className="animate-spin" size={18} />}
                   {editingCompany ? 'Actualizar Empresa' : 'Guardar Empresa'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Add Person to Company */}
      {/* Person Modal Reemplazado */}
      <PersonModal
        isOpen={isAddPersonModalOpen}
        onClose={() => setIsAddPersonModalOpen(false)}
        onSave={(newPerson) => {
           onAddPerson(newPerson);
           setIsAddPersonModalOpen(false);
        }}
        companies={companies}
        sites={[]}
        fixedEntityId={formData.id}
        fixedStakeholderType={formData.roles.includes('Cliente') ? 'Cliente' : 'Proveedor'}
      />

      {/* Modal Confirm Delete Company */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Empresa?</h3>
                 <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Esta acción no se puede deshacer.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => {
                          setIsDeleteModalOpen(false);
                          setCompanyToDelete(null);
                       }}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={confirmDelete}
                       className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-colors"
                    >
                       Eliminar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* Duplicate Error Modal */}
      {duplicateError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Empresa Duplicada</h3>
                 <p className="text-slate-500 mb-6 font-medium leading-relaxed">
                    {duplicateError}
                 </p>
                 <div className="flex">
                    <button 
                       onClick={() => setDuplicateError(null)}
                       className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-colors"
                    >
                       Entendido
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Field Wizard Modal */}
      {wizardConfig.isOpen && (() => {
        const fieldName = wizardConfig.field === 'name' ? 'Razón Social' : 'NIT / Identificación';
        const normVal = normalizeText(wizardConfig.value);
        let exactMatch: Company | undefined;
        let similarMatches: Company[] = [];

        if (wizardConfig.value.trim() !== '') {
            if (wizardConfig.field === 'name') {
                exactMatch = companies.find(c => normalizeText(c.name || '') === normVal && c.id !== formData.id);
                similarMatches = companies.filter(c => c.id !== formData.id && isSimilarCompany(wizardConfig.value, c.name || ''));
            } else {
                exactMatch = companies.find(c => normalizeText(c.taxId || '') === normVal && c.id !== formData.id);
                similarMatches = companies.filter(c => c.id !== formData.id && isSimilarCompany(wizardConfig.value, c.taxId || ''));
            }
        }
        
        const existsExact = wizardConfig.value.trim() !== '' && !!exactMatch;
        const existsSimilar = wizardConfig.value.trim() !== '' && !existsExact && similarMatches.length > 0;

        return (
          <div className="fixed inset-[0] z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className={`w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] transition-all bg-white border-4 ${
                 existsExact ? 'border-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.15)] shadow-2xl' : 
                 existsSimilar ? 'border-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.15)] shadow-2xl' : 
                 'border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.15)] shadow-2xl'
             }`}>
                <div className={`p-6 border-b flex items-start justify-between transition-colors ${existsExact ? 'bg-rose-50/50 border-rose-100' : existsSimilar ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                   <div className="flex gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors ${existsExact ? 'bg-rose-500 text-white' : existsSimilar ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          {existsExact ? <AlertTriangle size={24} /> : existsSimilar ? <AlertCircle size={24} /> : <Check size={24} />}
                       </div>
                       <div>
                          <h3 className={`text-lg font-bold transition-colors ${existsExact ? 'text-rose-900' : existsSimilar ? 'text-amber-900' : 'text-slate-900'}`}>
                              {existsExact ? `Ya existe el ${fieldName}` : existsSimilar ? 'Similitud Detectada' : `Ingresar ${fieldName}`}
                          </h3>
                          <p className={`text-xs font-medium transition-colors ${existsExact ? 'text-rose-600' : existsSimilar ? 'text-amber-700' : 'text-slate-500'}`}>
                              {existsExact ? `Coincidencia exacta encontrada` : 'Verifica que no exista antes de crearlo'}
                          </p>
                       </div>
                   </div>
                   <button onClick={() => setWizardConfig({...wizardConfig, isOpen: false})} className={`p-2 rounded-full transition-all ${existsExact ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : existsSimilar ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className={`text-[10px] font-bold uppercase tracking-wider block ml-1 transition-colors ${existsExact ? 'text-rose-500' : existsSimilar ? 'text-amber-600' : 'text-slate-400'}`}>Valor de {fieldName}</label>
                            {wizardConfig.field === 'name' && (
                                <WordCasingAdjuster 
                                  value={wizardConfig.value} 
                                  onChange={(val) => setWizardConfig({...wizardConfig, value: val})}
                                  label="Ajuste Siglas"
                                />
                            )}
                        </div>
                        <input 
                            type="text" 
                            name="wizardInputTemp" // avoid autocompletes
                            autoFocus
                            value={wizardConfig.value}
                            onChange={(e) => setWizardConfig({...wizardConfig, value: cleanInput(e.target.value)})}
                            onBlur={(e) => setWizardConfig({...wizardConfig, value: formatTitleCase(trimInput(e.target.value))})}
                            className={`w-full px-5 py-4 border-2 rounded-2xl outline-none text-base font-bold transition-all ${
                                existsExact 
                                ? 'bg-rose-50 border-rose-200 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 placeholder:text-rose-300' 
                                : existsSimilar
                                ? 'bg-amber-50 border-amber-200 text-amber-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-amber-300'
                                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400'
                            }`}
                        />
                    </div>

                    {wizardConfig.value.trim() !== '' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Empresas Similares Registradas</label>
                            {similarMatches.length > 0 ? (
                                <div className={`bg-slate-50 border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar transition-colors ${existsExact ? 'border-rose-100' : existsSimilar ? 'border-amber-100' : 'border-slate-200'}`}>
                                    {similarMatches.map(c => {
                                        const cVal = wizardConfig.field === 'name' ? c.name : c.taxId;
                                        const isThisExactMatch = normalizeText(cVal || '') === normVal;
                                        return (
                                        <div
                                            key={c.id}
                                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between mb-1 last:mb-0 transition-colors ${
                                                isThisExactMatch
                                                ? 'bg-rose-100/50 cursor-default'
                                                : 'bg-amber-100/50 cursor-pointer hover:bg-amber-200/50'
                                            }`}
                                        >
                                            <div className="flex-1 overflow-hidden">
                                                <div className={`font-bold truncate text-sm ${isThisExactMatch ? 'text-rose-900' : 'text-amber-900'}`}>
                                                    {c.name}
                                                </div>
                                                <div className={`text-xs mt-0.5 truncate ${isThisExactMatch ? 'text-rose-700/70' : 'text-amber-700/70'}`}>
                                                    NIT: {c.taxId || 'N/A'}
                                                </div>
                                            </div>
                                            {isThisExactMatch && (
                                                <div className="bg-rose-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md shrink-0 ml-3">
                                                    Exacto
                                                </div>
                                            )}
                                        </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                                        <Check className="text-emerald-500" size={24} />
                                    </div>
                                    <p className="text-emerald-700 font-bold text-sm">¡Excelente! Parece que este {fieldName.toLowerCase()} es totalmente nuevo.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t flex justify-end gap-2 transition-colors ${existsExact ? 'bg-rose-50/30 border-rose-100' : existsSimilar ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                   <button onClick={() => setWizardConfig({...wizardConfig, isOpen: false})} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors">Cancelar</button>
                   <button
                      disabled={!wizardConfig.value.trim() || existsExact}
                      onClick={() => {
                          if (existsExact) return;

                          if (existsSimilar) {
                              setForceCreationConfirmDialog(true);
                              return;
                          }

                          const finalVal = wizardConfig.value.trim();
                          if (wizardConfig.field === 'name') {
                              setFormData({...formData, legalName: finalVal, name: finalVal});
                              setVerifiedCompanyName(finalVal);
                          } else {
                              setFormData({...formData, taxId: finalVal});
                              setVerifiedCompanyNit(finalVal);
                          }
                          setWizardConfig({isOpen: false, field: null, value: ''});
                      }}
                      className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2 ${existsExact ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                   >
                      Confirmar
                   </button>
                </div>
             </div>
          </div>
        );
      })()}

      {/* Force Creation Confirm Dialog */}
      {forceCreationConfirmDialog && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Similitud Detectada</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                   Estás registrando un {wizardConfig.field === 'name' ? 'nombre' : 'NIT'} similar a uno que ya existe. ¿Deseas <span className="text-amber-600 font-bold">forzar el uso</span> de este valor?
                </p>
                <div className="flex flex-col gap-2">
                   <button 
                      onClick={() => {
                          const finalVal = wizardConfig.value.trim();
                          if (wizardConfig.field === 'name') {
                              setFormData({...formData, legalName: finalVal, name: finalVal});
                              setVerifiedCompanyName(finalVal);
                          } else {
                              setFormData({...formData, taxId: finalVal});
                              setVerifiedCompanyNit(finalVal);
                          }
                          setForceCreationConfirmDialog(false);
                          setWizardConfig({isOpen: false, field: null, value: ''});
                      }}
                      className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                   >
                       Sí, usar este valor
                   </button>
                   <button 
                      onClick={() => setForceCreationConfirmDialog(false)}
                      className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                   >
                       Cancelar
                   </button>
                </div>
             </div>
          </div>
      )}

      {/* Modal Confirm Similar Company */}
      {companyConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Empresa Similar</h3>
                 <p className="text-slate-500 mb-6 font-medium">
                    {companyConfirmDialog.isSimilarName && companyConfirmDialog.isSimilarNit 
                        ? "Ya existe una empresa con Razón Social y NIT similares. ¿Está seguro que desea crearla de todos modos?"
                        : companyConfirmDialog.isSimilarName 
                        ? "Ya existe una empresa con una Razón Social similar. ¿Está seguro que desea crearla de todos modos?"
                        : "Ya existe una empresa con un NIT similar. ¿Está seguro que desea crearla de todos modos?"}
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setCompanyConfirmDialog({isOpen: false, isSimilarName: false, isSimilarNit: false, companyData: null})}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                           const newName = formData.name || '';
                           const newNit = formData.taxId || '';
                           setVerifiedCompanyName(normalizeText(newName));
                           setVerifiedCompanyNit(normalizeText(newNit));
                           handleSubmit(undefined, true);
                       }}
                       className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-colors"
                    >
                       Guardar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesView;

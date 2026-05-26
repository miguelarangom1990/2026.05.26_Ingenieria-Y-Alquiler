import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  UserCircle, Plus, Search, FilterX, LayoutGrid, List as ListIcon, 
  Edit2, History, X, User, Briefcase, ChevronDown, Check, Building2,
  Users, HardHat, MapPin, Phone, Mail, Trash2, FileSpreadsheet, FileDown, FileUp, Layers,
  ArrowUp, ArrowDown, ArrowUpDown, Calendar, Clock, AlertCircle
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { Person, Company, ConstructionSite, ContactDetail } from '../types';
import { trimInput, formatTitleCase } from '../lib/utils';
import { Can } from '../components/Can';

interface PeopleViewProps {
  people: Person[];
  companies: Company[];
  sites: ConstructionSite[];
  onAddPerson: (person: Person) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void; // NUEVO
}

type SortKey = 'name' | 'entity' | 'contact' | 'location' | 'role' | 'createdAt' | 'updatedAt';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const cleanInput = (val: string) => {
  return val.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
};

// Componente Reutilizable de Filtro (Movido fuera para evitar pérdida de foco)
const SearchableFilter = ({ label, value, options, onChange, placeholder, activeFilterDropdown, setActiveFilterDropdown }: any) => {
  const isOpen = activeFilterDropdown === label;
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    if (!isOpen) setLocalSearch(value === 'Todos' ? '' : value);
  }, [value, isOpen]);

  const displayOptions = useMemo(() => {
    if (!options) return [];
    const term = isOpen ? localSearch : '';
    return options.filter((opt: string) => opt.toLowerCase().includes(term.toLowerCase()));
  }, [options, localSearch, isOpen]);
    
  return (
    <div className="flex flex-col gap-1.5 relative min-w-[160px] flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div 
        className={`
          flex items-center justify-between px-4 py-3 bg-white border-2 rounded-2xl transition-all cursor-text
          ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-sm' : 'border-slate-100 hover:border-slate-200'}
        `}
        onClick={() => setActiveFilterDropdown(label)}
      >
        <input 
          type="text"
          value={localSearch}
          onChange={(e) => { 
            const val = cleanInput(e.target.value);
            setLocalSearch(val);
            onChange(val);
            if (!isOpen) setActiveFilterDropdown(label); 
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            setLocalSearch(val);
            onChange(val);
          }}
          onFocus={() => setActiveFilterDropdown(label)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
        />
        <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </div>
      
      {isOpen && options && options.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[80] py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto no-scrollbar">
          {displayOptions.length > 0 ? (
            displayOptions.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setLocalSearch(opt === 'Todos' ? '' : opt);
                  setActiveFilterDropdown(null);
                }}
                className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-blue-50 transition-colors ${value === opt ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}
              >
                {opt}
              </button>
            ))
          ) : (
             <div className="px-5 py-3 text-xs text-slate-400 italic">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
};

import PersonModal from '../components/PersonModal';

const PeopleView: React.FC<PeopleViewProps> = ({ people, companies, sites, onAddPerson, onUpdatePerson, onDeletePerson }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // --- NUEVO: Estados para Selección Múltiple y Edición Masiva ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Estados para eliminación individual
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  // Estados para formulario de edición masiva
  const [bulkEditField, setBulkEditField] = useState<string>('');
  const [bulkEditValue, setBulkEditValue] = useState<string>('');

  // --- NUEVO: Estado de Ordenamiento ---
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);

  // Opciones de Configuración para Edición Masiva (Solo dropdowns simples)
  const BULK_EDIT_OPTIONS = [
    { field: 'stakeholderType', label: 'Tipo de Stakeholder', options: ['Cliente', 'Proveedor'] },
    { field: 'locationType', label: 'Ubicación', options: ['Oficina', 'Obra'] }
  ];

  // --- Filtros ---
  const [filters, setFilters] = useState({
    search: '',
    role: 'Todos',
    type: 'Todos'
  });
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // --- Estados para Importación ---
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Formulario ---
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    stakeholderType: 'Cliente' as 'Cliente' | 'Proveedor',
    roles: [] as string[],
    entityId: '',
    locationType: 'Oficina' as 'Oficina' | 'Obra',
    siteId: '',
    phones: [] as ContactDetail[],
    emails: [] as ContactDetail[],
    createdAt: '',
    updatedAt: ''
  });

  // Estados temporales para agregar contactos
  const [tempPhone, setTempPhone] = useState({ label: 'Móvil', value: '' });
  const [tempEmail, setTempEmail] = useState({ label: 'Trabajo', value: '' });
  
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);
  const siteDropdownRef = useRef<HTMLDivElement>(null);

  const availableRoles = [
    "Dueño / socio", "Gerente", "Director", "Almacenista", "Maestro de obra", "Siso", "Administrativo"
  ];

  // --- Click Outside Handlers ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) setActiveFilterDropdown(null);
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) setIsRoleDropdownOpen(false);
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(target)) setIsEntityDropdownOpen(false);
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(target)) setIsSiteDropdownOpen(false);
      if (importMenuRef.current && !importMenuRef.current.contains(target)) setIsImportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Helpers para obtener nombres (Movido arriba para uso en sort) ---
  const getEntityName = (person: Person) => {
    const entity = companies.find(c => c.id === person.entityId);
    return entity ? entity.name : 'Sin Asignar';
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return null;
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : null;
  };

  const getFullName = (person: Person) => {
    return `${person.firstName} ${person.middleName || ''} ${person.lastName} ${person.secondLastName || ''}`.replace(/\s+/g, ' ').trim();
  };

  // Helper para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  // --- Lógica de Filtrado y Ordenamiento ---
  const filteredPeople = useMemo(() => {
    // 1. Filtrar
    const filtered = people.filter(person => {
      const fullName = getFullName(person).toLowerCase();
      const matchSearch = filters.search === 'Todos' || filters.search === '' || fullName.includes(filters.search.toLowerCase());
      const matchType = filters.type === 'Todos' || person.stakeholderType === filters.type;
      const matchRole = filters.role === 'Todos' || person.roles.includes(filters.role);
      return matchSearch && matchType && matchRole;
    });

    // 2. Ordenar (Multi-criterio)
    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of sortConfig) {
          let valA: string = '';
          let valB: string = '';

          switch (sort.key) {
            case 'name':
              valA = getFullName(a).toLowerCase();
              valB = getFullName(b).toLowerCase();
              break;
            case 'entity':
              valA = getEntityName(a).toLowerCase();
              valB = getEntityName(b).toLowerCase();
              break;
            case 'contact':
              valA = a.phones[0]?.value || '';
              valB = b.phones[0]?.value || '';
              break;
            case 'location':
              valA = `${a.locationType} ${getSiteName(a.siteId) || ''}`.toLowerCase();
              valB = `${b.locationType} ${getSiteName(b.siteId) || ''}`.toLowerCase();
              break;
            case 'role':
              valA = a.roles.join(', ').toLowerCase();
              valB = b.roles.join(', ').toLowerCase();
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
  }, [people, filters, sortConfig, companies, sites]);

  // --- Manejador de Ordenamiento ---
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      // Remover la clave si ya existe para reinsertarla al principio (Stack behavior)
      const existingSort = prev.find(s => s.key === key);
      const others = prev.filter(s => s.key !== key);
      
      let newDirection: 'asc' | 'desc' = 'asc';
      
      // Si ya era el orden principal, invertir dirección
      if (existingSort && prev[0]?.key === key) {
        newDirection = existingSort.direction === 'asc' ? 'desc' : 'asc';
      } else if (existingSort) {
        // Si existía pero no era principal, mantener su dirección previa (o resetear a asc si se prefiere)
        newDirection = existingSort.direction; 
      }

      // Nuevo sort al inicio (Prioridad 1)
      return [{ key, direction: newDirection }, ...others].slice(0, 3); // Limitar a 3 niveles de profundidad
    });
  };

  // Helper visual para header de tabla
  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
    const activeSort = sortConfig.find(s => s.key === sortKey);
    const priority = sortConfig.findIndex(s => s.key === sortKey); // 0 es principal

    return (
      <th 
        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none group ${activeSort ? 'text-blue-600' : 'text-slate-400'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="flex flex-col">
             {!activeSort && <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50" />}
             {activeSort && activeSort.direction === 'asc' && <ArrowUp size={12} />}
             {activeSort && activeSort.direction === 'desc' && <ArrowDown size={12} />}
          </div>
          {activeSort && sortConfig.length > 1 && <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded-full">{priority + 1}</span>}
        </div>
      </th>
    );
  };

  // --- Opciones de Entidad (Cliente/Proveedor) para el Modal ---
  const entityOptions = useMemo(() => {
    let options: { id: string, name: string, status?: string }[] = [];
    if (formData.stakeholderType === 'Cliente') {
      options = companies.filter(c => c.roles.includes('Cliente')).map(c => ({ id: c.id, name: c.name, status: c.linkageStatus }));
    } else {
      options = companies.filter(c => c.roles.includes('Proveedor')).map(s => ({ id: s.id, name: s.name }));
    }
    return options.filter(opt => opt.name.toLowerCase().includes(entitySearch.toLowerCase()));
  }, [formData.stakeholderType, companies, entitySearch]);

  // --- Opciones de Obra para el Modal ---
  const siteOptions = useMemo(() => {
    if (formData.stakeholderType === 'Cliente' && formData.entityId) {
      // Si es cliente, solo mostrar sus obras
      return sites.filter(s => s.clientId === formData.entityId && s.status === 'Activa' && !s.isVirtualObra);
    } else {
      // Si es proveedor, mostrar todas las obras activas (pueden trabajar en cualquiera)
      return sites.filter(s => s.status === 'Activa' && !s.isVirtualObra);
    }
  }, [sites, formData.stakeholderType, formData.entityId]);

  // --- Lógica de Selección Múltiple ---
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
        newSelection.delete(id);
    } else {
        newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPeople.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(filteredPeople.map(item => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // --- Acciones Masivas ---
  const handleBulkDelete = () => {
    if (onDeletePerson) {
        selectedIds.forEach(id => onDeletePerson(id));
        setIsBulkDeleteConfirmOpen(false);
        clearSelection();
    }
  };

  const handleBulkEdit = () => {
    if (bulkEditField && bulkEditValue) {
        selectedIds.forEach(id => {
            const person = people.find(p => p.id === id);
            if (person) {
                // Clonar y actualizar el campo específico
                // Nota: Si cambiamos 'locationType' a 'Oficina', siteId debería ser null, pero la edición masiva simple solo cambia el campo.
                const updatedPerson = { ...person, [bulkEditField]: bulkEditValue, updatedAt: new Date().toISOString() };
                onUpdatePerson(updatedPerson);
            }
        });
        setIsBulkEditModalOpen(false);
        setBulkEditField('');
        setBulkEditValue('');
        clearSelection();
    }
  };

  // --- Acciones Individuales ---
  const confirmDeleteRequest = (person: Person) => {
    setPersonToDelete(person);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (personToDelete && onDeletePerson) {
      onDeletePerson(personToDelete.id);
      setIsDeleteModalOpen(false);
      setPersonToDelete(null);
    }
  };

  // --- Manejadores del Formulario ---
  const toggleRole = (role: string) => {
    setFormData(prev => {
      const exists = prev.roles.includes(role);
      if (exists) {
        return { ...prev, roles: prev.roles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...prev.roles, role] };
      }
    });
  };

  const handleAddPhone = () => {
    if (tempPhone.value.trim()) {
      setFormData(prev => ({ ...prev, phones: [...prev.phones, tempPhone] }));
      setTempPhone({ label: 'Móvil', value: '' });
    }
  };

  const handleRemovePhone = (index: number) => {
    setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
  };

  const handleAddEmail = () => {
    if (tempEmail.value.trim()) {
      setFormData(prev => ({ ...prev, emails: [...prev.emails, tempEmail] }));
      setTempEmail({ label: 'Trabajo', value: '' });
    }
  };

  const handleRemoveEmail = (index: number) => {
    setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
  };

  const handleOpenEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName,
      middleName: person.middleName || '',
      lastName: person.lastName,
      secondLastName: person.secondLastName || '',
      stakeholderType: person.stakeholderType,
      roles: person.roles,
      entityId: person.entityId || '',
      locationType: person.locationType || 'Oficina',
      siteId: person.siteId || '',
      phones: person.phones || [],
      emails: person.emails || [],
      createdAt: person.createdAt || '',
      updatedAt: person.updatedAt || ''
    });
    // Inicializar búsqueda de entidad con el nombre actual
    const entity = companies.find(c => c.id === person.entityId);
    setEntitySearch(entity?.name || '');
    setIsModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const dataToExport = [
      ['Nombre', 'Apellido', 'Tipo (Cliente/Proveedor)', 'ID Empresa (Opcional)', 'Roles (Separados por coma)', 'Teléfono', 'Email', 'Ubicación (Oficina/Obra)', 'ID Obra (Si aplica)'],
      ['(Obligatorio)', '(Obligatorio)', 'Cliente / Proveedor', 'ID Exacto de la entidad', 'Gerente, Siso', '(Opcional)', '(Opcional)', 'Oficina / Obra', 'ID de la obra (si es Obra)'],
      ['Juan', 'Perez', 'Cliente', 'c1', 'Gerente', '3001234567', 'juan@empresa.com', 'Oficina', '']
    ];

    const ws = utils.aoa_to_sheet(dataToExport);
    
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'] = [20, 20, 20, 25, 30, 20, 30, 20, 20].map(w => ({ wch: w }));

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Plantilla Contactos");
    
    writeFile(wb, "plantilla_importacion_contactos.xlsx");
    setIsImportMenuOpen(false);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert("Importación simulada para Contactos");
    setIsImportMenuOpen(false);
  };

  const resetForm = () => {
    setEditingPerson(null);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      secondLastName: '',
      stakeholderType: 'Cliente',
      roles: [],
      entityId: '',
      locationType: 'Oficina',
      siteId: '',
      phones: [],
      emails: [],
      createdAt: '',
      updatedAt: ''
    });
    setTempPhone({ label: 'Móvil', value: '' });
    setTempEmail({ label: 'Trabajo', value: '' });
    setEntitySearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || formData.roles.length === 0 || !formData.entityId) {
      alert("Por favor completa los campos obligatorios (Nombre, Apellido, Roles, Empresa).");
      return;
    }

    if (formData.locationType === 'Obra' && !formData.siteId) {
       alert("Si la persona es de Obra, debes seleccionar a qué obra pertenece.");
       return;
    }

    // Capturar datos pendientes en los inputs temporales si el usuario no dio click en "+"
    const finalPhones = [...formData.phones];
    if (tempPhone.value.trim()) {
        finalPhones.push(tempPhone);
    }

    const finalEmails = [...formData.emails];
    if (tempEmail.value.trim()) {
        finalEmails.push(tempEmail);
    }

    const now = new Date().toISOString();

    const personData: Person = {
      id: editingPerson ? editingPerson.id : `p-${Date.now()}`,
      ...formData,
      phones: finalPhones,
      emails: finalEmails,
      // Limpiar siteId si es oficina
      siteId: formData.locationType === 'Oficina' ? undefined : formData.siteId,
      createdAt: editingPerson ? formData.createdAt : now,
      updatedAt: now
    };

    if (editingPerson) {
      onUpdatePerson(personData);
    } else {
      onAddPerson(personData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  // Obtener status del cliente seleccionado para mostrar en el formulario
  const getSelectedClientStatus = () => {
    if (formData.stakeholderType !== 'Cliente' || !formData.entityId) return null;
    const client = companies.find(c => c.id === formData.entityId && c.roles.includes('Cliente'));
    return client?.linkageStatus === 'Vinculado' ? 'Cliente Actual' : 'Prospecto';
  };

  // Obtener status de la obra seleccionada para mostrar en el formulario
  const getSelectedSiteStatus = () => {
    if (formData.locationType !== 'Obra' || !formData.siteId) return null;
    const site = sites.find(s => s.id === formData.siteId);
    return site?.prospectStatus || null;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 relative pb-10">
      
      {/* BARRA FLOTANTE DE ACCIONES MASIVAS */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 pl-6 pr-2 rounded-2xl shadow-2xl z-[90] flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 bg-white text-slate-900 text-xs font-black rounded-full">
                    {selectedIds.size}
                </span>
                <span className="text-sm font-bold">Seleccionados</span>
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsBulkEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold"
                >
                    <Layers size={16} /> Edición Masiva
                </button>
                <button 
                    onClick={() => setIsBulkDeleteConfirmOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors text-xs font-bold shadow-lg shadow-rose-900/50"
                >
                    <Trash2 size={16} /> Eliminar
                </button>
                <button 
                    onClick={clearSelection}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white ml-2"
                    title="Cancelar selección"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Directorio de Contactos
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg border border-slate-200">{people.length} Registros</span>
          </h1>
          <p className="text-slate-500 text-sm">Gestiona los contactos clave de tus clientes y proveedores.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><ListIcon size={18} /></button>
            </div>
            
            <div className="relative" ref={importMenuRef}>
             <button 
               onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
               className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
             >
               <FileSpreadsheet size={18} /> 
               Importar
               <ChevronDown size={18} className={`transition-transform duration-200 ${isImportMenuOpen ? 'rotate-180' : ''}`} />
             </button>
             
             {isImportMenuOpen && (
               <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={handleDownloadTemplate} className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                     <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors border border-emerald-100">
                        <FileDown size={20} />
                     </div>
                     <div>
                        <span className="block text-sm font-bold text-slate-700">Descargar Plantilla</span>
                        <span className="block text-[10px] text-slate-400 font-medium">Formato requerido .xlsx</span>
                     </div>
                  </button>
                  <button onClick={() => { if(fileInputRef.current) fileInputRef.current.click(); }} className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                     <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors border border-blue-100">
                        <FileUp size={20} />
                     </div>
                     <div>
                        <span className="block text-sm font-bold text-slate-700">Subir Archivo</span>
                        <span className="block text-[10px] text-slate-400 font-medium">Importar datos masivos</span>
                     </div>
                  </button>
               </div>
             )}
           </div>
           
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={handleExcelUpload} 
           />

            <Can permission="CREAR_CONTACTOS">
              <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }} 
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
              >
                <Plus size={18} /> Nuevo Contacto
              </button>
            </Can>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4" ref={filterDropdownRef}>
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm"><Search size={18} className="text-blue-500" /> Buscador de Contactos</div>
            <button onClick={() => setFilters({ search: '', role: 'Todos', type: 'Todos' })} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-rose-500 transition-colors"><FilterX size={14} /> Limpiar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchableFilter 
                label="Nombre / Apellido" 
                value={filters.search} 
                options={['Todos', ...Array.from(new Set(people.map(p => getFullName(p))))]} 
                onChange={(v: string) => setFilters({...filters, search: v})} 
                placeholder="Buscar persona..."
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown} 
            />
            <SearchableFilter 
                label="Tipo Stakeholder" 
                value={filters.type} 
                options={['Todos', 'Cliente', 'Proveedor']} 
                onChange={(v: string) => setFilters({...filters, type: v})} 
                placeholder="Filtrar por tipo..."
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown} 
            />
            <SearchableFilter 
                label="Cargo / Rol" 
                value={filters.role} 
                options={['Todos', ...Array.from(new Set(people.flatMap(p => p.roles)))]} 
                onChange={(v: string) => setFilters({...filters, role: v})} 
                placeholder="Filtrar por cargo..."
                activeFilterDropdown={activeFilterDropdown}
                setActiveFilterDropdown={setActiveFilterDropdown} 
            />
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map(person => {
              const entityName = getEntityName(person);
              const siteName = getSiteName(person.siteId);
              const isSelected = selectedIds.has(person.id);
              const fullName = getFullName(person);
              return (
                <div 
                    key={person.id} 
                    className={`bg-white rounded-2xl p-6 border transition-all relative group ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md' : 'border-slate-100 hover:shadow-lg'}`}
                    onClick={() => toggleSelection(person.id)}
                >
                     {/* Checkbox de Selección */}
                     <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => toggleSelection(person.id)}>
                            {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                        </div>
                     </div>

                     <div className="absolute top-4 right-4 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        <Can permission="EDITAR_CONTACTOS">
                          <button onClick={() => handleOpenEdit(person)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                        </Can>
                        <Can permission="ELIMINAR_CONTACTOS">
                          <button onClick={() => confirmDeleteRequest(person)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </Can>
                     </div>

                     <div className="flex items-center gap-4 mb-4 pl-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${person.stakeholderType === 'Cliente' ? 'bg-blue-500 shadow-blue-200' : 'bg-amber-500 shadow-amber-200'}`}>
                            {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[200px]" title={fullName}>{fullName}</h3>
                            <div className="flex flex-col mt-1">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md w-fit ${person.stakeholderType === 'Cliente' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{person.stakeholderType}</span>
                              <span className="text-xs text-slate-500 font-bold mt-1 truncate max-w-[150px]" title={entityName}>{entityName}</span>
                            </div>
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-2 mb-4">
                        {/* Info Ubicación */}
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {person.locationType === 'Obra' ? <HardHat size={14} className="text-amber-600" /> : <Briefcase size={14} className="text-slate-500" />}
                          <span className="text-xs font-semibold text-slate-700">
                            {person.locationType} {siteName ? `- ${siteName}` : ''}
                          </span>
                        </div>
                        
                        {/* Info Contacto Rápido */}
                        {person.phones && person.phones.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
                             <Phone size={12} className="text-slate-400" />
                             <span className="truncate">{person.phones[0].value}</span>
                             {person.phones.length > 1 && <span className="text-[10px] bg-slate-100 rounded px-1 text-slate-500">+{person.phones.length - 1}</span>}
                          </div>
                        )}
                        {person.emails && person.emails.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 px-1">
                             <Mail size={12} className="text-slate-400" />
                             <span className="truncate max-w-[180px]">{person.emails[0].value}</span>
                          </div>
                        )}
                     </div>

                     <div className="flex flex-wrap gap-2 mb-4">
                        {person.roles.map(role => (
                            <span key={role} className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">{role}</span>
                        ))}
                     </div>

                     {/* Footer fechas */}
                     <div className="pt-3 border-t border-slate-50 flex justify-between text-[9px] text-slate-400">
                        <span title="Fecha de Creación">C: {formatDate(person.createdAt)}</span>
                        <span title="Última Actualización">A: {formatDate(person.updatedAt)}</span>
                     </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-6 py-4 w-12 text-center">
                                <div 
                                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.size === filteredPeople.length && filteredPeople.length > 0 ? 'bg-blue-50 border-blue-500' : 'border-slate-300 bg-white'}`} 
                                    onClick={toggleSelectAll}
                                >
                                    {selectedIds.size === filteredPeople.length && filteredPeople.length > 0 && <Check size={12} className="text-white" strokeWidth={4} />}
                                </div>
                            </th>
                            <SortableHeader label="Nombre Completo" sortKey="name" />
                            <SortableHeader label="Empresa / Entidad" sortKey="entity" />
                            <SortableHeader label="Contacto" sortKey="contact" />
                            <SortableHeader label="Ubicación" sortKey="location" />
                            <SortableHeader label="Cargos" sortKey="role" />
                            <SortableHeader label="F. Creación" sortKey="createdAt" />
                            <SortableHeader label="F. Actualización" sortKey="updatedAt" />
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPeople.map(person => {
                            const entityName = getEntityName(person);
                            const siteName = getSiteName(person.siteId);
                            const isSelected = selectedIds.has(person.id);
                            return (
                              <tr 
                                key={person.id} 
                                className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                                onClick={() => toggleSelection(person.id)}
                              >
                                  <td className="px-6 py-5 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all mx-auto ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => toggleSelection(person.id)}>
                                          {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${person.stakeholderType === 'Cliente' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                                              {person.firstName[0]}{person.lastName[0]}
                                          </div>
                                          <div>
                                            <span className="block text-xs font-bold text-slate-900">{getFullName(person)}</span>
                                            <span className="text-[10px] text-slate-500">{person.stakeholderType}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-slate-300" />
                                        <span className="text-xs font-bold text-slate-700">{entityName}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col gap-1">
                                         {person.phones && person.phones.length > 0 && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                              <Phone size={10} className="text-slate-400" /> {person.phones[0].value}
                                            </div>
                                         )}
                                         {person.emails && person.emails.length > 0 && (
                                            <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-[120px]">
                                              <Mail size={10} className="text-slate-400" /> {person.emails[0].value}
                                            </div>
                                         )}
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                     <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold uppercase w-fit px-1.5 rounded ${person.locationType === 'Obra' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{person.locationType}</span>
                                        {siteName && <span className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]" title={siteName}>{siteName}</span>}
                                     </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-wrap gap-1">
                                          {person.roles.map(role => (
                                              <span key={role} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{role}</span>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <span className="text-[10px] text-slate-500">{formatDate(person.createdAt)}</span>
                                  </td>
                                  <td className="px-6 py-5">
                                      <span className="text-[10px] text-slate-500">{formatDate(person.updatedAt)}</span>
                                  </td>
                                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-end gap-2">
                                          <Can permission="EDITAR_CONTACTOS">
                                            <button onClick={() => handleOpenEdit(person)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                          </Can>
                                          <Can permission="ELIMINAR_CONTACTOS">
                                            <button onClick={() => confirmDeleteRequest(person)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                          </Can>
                                      </div>
                                  </td>
                              </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* ... (Modales de eliminación y edición masiva se mantienen igual) ... */}
      
      {/* Modal Confirm Delete Individual */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Contacto?</h3>
                 <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Esta acción no se puede deshacer.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => {
                          setIsDeleteModalOpen(false);
                          setPersonToDelete(null);
                       }}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={handleDeleteConfirmed}
                       className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-colors"
                    >
                       Eliminar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal Confirm Delete Bulk */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar {selectedIds.size} contactos?</h3>
                 <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Esta acción no se puede deshacer.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setIsBulkDeleteConfirmOpen(false)}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={handleBulkDelete}
                       className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-colors"
                    >
                       Eliminar Todo
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSave={(personData) => {
          if (editingPerson) {
            onUpdatePerson(personData);
          } else {
            onAddPerson(personData);
          }
          setIsModalOpen(false);
          resetForm();
        }}
        editingPerson={editingPerson}
        companies={companies}
        sites={sites}
      />
    </div>
  );
};

// Helper simple para icono (CheckCircle2 no estaba importado en scope local)
const CheckCircle2 = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default PeopleView;
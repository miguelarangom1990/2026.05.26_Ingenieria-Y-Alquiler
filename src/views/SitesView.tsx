import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ConstructionSite, Company, Person, ContactDetail } from '../types';
import { 
  Search, Plus, X, MapPin, Building2, Calendar, 
  LayoutGrid, List as ListIcon, Edit2, Trash2, History, 
  Check, ChevronDown, FilterX, FileSpreadsheet, FileDown, 
  FileUp, Loader2, ArrowRight, Mail, AlertCircle, CheckCircle2,
  HardHat, User, UserPlus, Phone, AlignLeft, CreditCard, AlertTriangle,
  ArrowUp, ArrowDown, ArrowUpDown, Clock
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { cleanInput, trimInput, formatTitleCase } from '../lib/utils';
import PersonModal from '../components/PersonModal';
import { WordCasingAdjuster } from '../components/WordCasingAdjuster';
import { SearchableDropdown } from '../components/SearchableDropdown';
import { COLOMBIA_DATA } from '../data/colombia';
import { normalizeText, levenshteinDistance } from '../lib/textUtils';
import { isSimilarSite } from '../lib/similarityUtils';
import { Can } from '../components/Can';

// ------------------------------------------

// Reusable SearchableFilter component
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

// Reusable CustomFormSelect component to replace standard selects
const CustomFormSelect = ({ value, onChange, options, zIndex = 50 }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none text-sm font-bold text-slate-700 flex items-center justify-between transition-all ${isOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : 'border-slate-200'}`}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>

      {isOpen && (
        <div style={{ zIndex }} className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${value === opt.value ? 'bg-amber-50 text-amber-700' : ''}`}
            >
              <div className="font-bold text-slate-700 text-sm">{opt.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface SitesViewProps {
  sites: ConstructionSite[];
  companies: Company[];
  people: Person[];
  onAddSite: (site: ConstructionSite) => void;
  onUpdateSite: (site: ConstructionSite) => void;
  onDeleteSite: (id: string) => void;
  onAddPerson: (person: Person) => void;
}

type SortKey = 'workSite' | 'name' | 'client' | 'location' | 'status' | 'createdAt' | 'updatedAt';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const SitesView: React.FC<SitesViewProps> = ({ 
  sites, companies, people, onAddSite, onUpdateSite, onDeleteSite, onAddPerson 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<ConstructionSite | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<string | null>(null);
  
  const [isDeleteSitioModalOpen, setIsDeleteSitioModalOpen] = useState(false);
  const [sitioToDelete, setSitioToDelete] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'Todos',
    client: 'Todos'
  });
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);

  // Import State
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importData, setImportData] = useState<any[][]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  
  // New Error Handling State
  const [importErrors, setImportErrors] = useState<{row: number | string, error: string, fix: string}[]>([]);
  const [isImportErrorModalOpen, setIsImportErrorModalOpen] = useState(false);

  const importMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialFormState: Partial<ConstructionSite> = {
    name: '',
    departamento: '',
    municipio: '',
    location: '',
    workSite: '',
    status: 'Activa',
    clientId: '',
    billingPeriod: 'Mensual',
    icaRetainer: 'No',
    observation: '',
    email: '',
    billingEmail: '',
    prospectStatus: 'Obra Cliente',
    createdAt: '',
    updatedAt: ''
  };
  const [formData, setFormData] = useState<Partial<ConstructionSite>>(initialFormState);
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Estados para dropdown con búsqueda de Cliente en formulario
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [isSitioDropdownOpen, setIsSitioDropdownOpen] = useState(false);
  const [sitioSearch, setSitioSearch] = useState('');
  const sitioDropdownRef = useRef<HTMLDivElement>(null);

  const [isObraDropdownOpen, setIsObraDropdownOpen] = useState(false);
  const [obraSearch, setObraSearch] = useState('');
  const obraDropdownRef = useRef<HTMLDivElement>(null);

  // --- NUEVO: Estado para agregar persona desde la obra ---
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);

  // Nuevo estado para controlar si el displayName es manual (editable) o automático
  const [isDisplayNameManual, setIsDisplayNameManual] = useState(false);
  const [isSiteShortNameManual, setIsSiteShortNameManual] = useState(false);

  const [verifiedObraName, setVerifiedObraName] = useState<string | null>(null);
  const [verifiedSitioName, setVerifiedSitioName] = useState<string | null>(null);

  // Estado para saber si estamos creando desde la pestaña Sitios
  const [isCreatingSiteMode, setIsCreatingSiteMode] = useState(false);

  // Estados para renombrar sitio
  const [isRenameSiteModalOpen, setIsRenameSiteModalOpen] = useState(false);
  const [siteToRename, setSiteToRename] = useState('');
  const [newSiteName, setNewSiteName] = useState('');

  // Estados para el asistente de creacion de Nuevo Sitio
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);
  const [newSiteWizardName, setNewSiteWizardName] = useState('');
  const [isWizardFromObraModal, setIsWizardFromObraModal] = useState(false);
  const [siteConfirmDialog, setSiteConfirmDialog] = useState<{isOpen: boolean, isSimilar: boolean, action: 'quick' | 'continue' | null}>({isOpen: false, isSimilar: false, action: null});

  // Estados para el asistente de creacion de Nueva Obra (desde texto libre o lista difusa)
  const [isCreateObraWizardOpen, setIsCreateObraWizardOpen] = useState(false);
  const siteWizardRef = useRef(false);
  const obraWizardRef = useRef(false);
  
  useEffect(() => {
    siteWizardRef.current = isCreateSiteModalOpen;
  }, [isCreateSiteModalOpen]);
  
  useEffect(() => {
    obraWizardRef.current = isCreateObraWizardOpen;
  }, [isCreateObraWizardOpen]);
  const [newObraWizardName, setNewObraWizardName] = useState('');
  const [obraConfirmDialog, setObraConfirmDialog] = useState<{isOpen: boolean, isSimilar: boolean}>({isOpen: false, isSimilar: false});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) setActiveFilterDropdown(null);
      if (importMenuRef.current && !importMenuRef.current.contains(target)) setIsImportMenuOpen(false);
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(target)) setIsClientDropdownOpen(false);
      if (sitioDropdownRef.current && !sitioDropdownRef.current.contains(target)) setIsSitioDropdownOpen(false);
      if (obraDropdownRef.current && !obraDropdownRef.current.contains(target)) setIsObraDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeTab, setActiveTab] = useState<'obras' | 'sitios' | 'sin_asignar'>('obras');

  // Helper names
  const getClientName = (clientId: string) => {
    return companies.find(c => c.id === clientId)?.name || 'Cliente desconocido';
  };

  const currentSitios = useMemo(() => {
    const grouped: Record<string, ConstructionSite[]> = {};
    sites.forEach(s => {
      const isUnassigned = !s.workSite || s.workSite.trim() === '';
      if (!isUnassigned) {
          const key = s.workSite!.trim();
          if (!grouped[key]) grouped[key] = [];
          if (!s.isVirtualObra) {
              grouped[key].push(s);
          }
      }
    });
    return grouped;
  }, [sites]);

  const unassignedSites = useMemo(() => {
     return sites.filter(s => !s.isVirtualObra && (!s.workSite || s.workSite.trim() === ''));
  }, [sites]);

  const uniqueSitios = useMemo(() => {
     const sitios = new Set<string>();
     sites.forEach(s => {
         if (s.workSite && s.workSite.trim() !== '') {
             sitios.add(s.workSite.trim());
         }
     });
     return Array.from(sitios).sort();
  }, [sites]);

  const uniqueObrasNames = useMemo(() => {
     const obras = new Set<string>();
     sites.forEach(s => {
         if (!s.isVirtualObra && s.name && s.name.trim() !== '') {
             obras.add(s.name.trim());
         }
     });
     return Array.from(obras).sort();
  }, [sites]);

  const clientObrasNames = useMemo(() => {
      const obras = new Set<string>();
      if (!formData.clientId) return [];
      sites.forEach(s => {
          if (!s.isVirtualObra && s.clientId === formData.clientId && s.name && s.name.trim() !== '') {
              obras.add(s.name.trim());
          }
      });
      return Array.from(obras).sort();
  }, [sites, formData.clientId]);

  const filteredObrasForDropdown = useMemo(() => {
      if (!obraSearch.trim()) return [];
      return clientObrasNames.filter(nombre => isSimilarSite(obraSearch, nombre) && nombre.toLowerCase() !== obraSearch.trim().toLowerCase());
  }, [clientObrasNames, obraSearch]);

  const filteredSitiosForDropdown = useMemo(() => {
     return uniqueSitios.filter(s => isSimilarSite(sitioSearch, s));
  }, [uniqueSitios, sitioSearch]);

  const similarSites = useMemo(() => {
     if (!newSiteWizardName.trim()) return [];
     return uniqueSitios.filter(s => isSimilarSite(newSiteWizardName, s));
  }, [newSiteWizardName, uniqueSitios]);

  const similarObrasWizard = useMemo(() => {
     if (!newObraWizardName.trim()) return [];
     return clientObrasNames.filter(s => isSimilarSite(newObraWizardName, s));
  }, [newObraWizardName, clientObrasNames]);

  useEffect(() => {
    if (isModalOpen && !isDisplayNameManual) {
      const client = companies.find(c => c.id === formData.clientId);
      const clientShortName = client?.shortName || client?.name || '';
      const baseShortName = formData.shortName || '';
      
      let newDisplayName = '';
      if (baseShortName && clientShortName) {
        newDisplayName = `${baseShortName} - ${clientShortName}`;
      } else if (baseShortName) {
        newDisplayName = baseShortName;
      }
      
      setFormData(prev => {
        if (prev.displayName !== newDisplayName) {
          return { ...prev, displayName: newDisplayName };
        }
        return prev;
      });
    }
  }, [formData.shortName, formData.clientId, companies, isModalOpen, isDisplayNameManual]);

  // Auto-generate shortName based on name if not in manual mode
  useEffect(() => {
    if (isModalOpen && !isSiteShortNameManual) {
        const baseName = formData.name || '';
        const newShortName = baseName.substring(0, 16);
        setFormData(prev => {
            if (prev.shortName !== newShortName) {
                return { ...prev, shortName: newShortName };
            }
            return prev;
        });
    }
  }, [formData.name, isModalOpen, isSiteShortNameManual]);

  // Filtering and Sorting
  const filteredSites = useMemo(() => {
    const filtered = sites.filter(site => {
      if (site.isVirtualObra) return false;
      const matchSearch = site.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                          site.location.toLowerCase().includes(filters.search.toLowerCase());
      const matchStatus = filters.status === 'Todos' || site.status === filters.status;
      const clientName = companies.find(c => c.id === site.clientId)?.name || '';
      const matchClient = filters.client === 'Todos' || clientName === filters.client;
      
      return matchSearch && matchStatus && matchClient;
    });

    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of sortConfig) {
          let valA: string = '';
          let valB: string = '';

          switch (sort.key) {
            case 'workSite':
              valA = (a.workSite || '').toLowerCase();
              valB = (b.workSite || '').toLowerCase();
              break;
            case 'name':
              valA = a.name.toLowerCase();
              valB = b.name.toLowerCase();
              break;
            case 'client':
              valA = getClientName(a.clientId).toLowerCase();
              valB = getClientName(b.clientId).toLowerCase();
              break;
            case 'location':
              valA = a.location.toLowerCase();
              valB = b.location.toLowerCase();
              break;
            case 'status':
              valA = a.status.toLowerCase();
              valB = b.status.toLowerCase();
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
  }, [sites, companies, filters, sortConfig]);

  const filterOptions = useMemo(() => {
    const validSites = sites.filter(s => !s.isVirtualObra);
    // Collect all searchable terms: Site names and locations
    const searchOpts = Array.from(new Set([
        ...validSites.map(s => s.name),
        ...validSites.map(s => s.location)
    ])).filter(Boolean);

    return {
      searchOptions: searchOpts,
      statuses: ['Todos', 'Activa', 'Pausada', 'Completada', 'Pendiente de iniciar'],
      clients: ['Todos', ...Array.from(new Set(validSites.map(s => {
        const c = companies.find(client => client.id === s.clientId);
        return c ? c.name : '';
      }).filter(Boolean)))]
    };
  }, [sites, companies]);

  // Dropdown Filtering Logic
  const filteredClientsForDropdown = useMemo(() => {
    const clientsList = companies.filter(c => c.roles.includes('Cliente'));
    
    let filtered = clientsList;
    if (clientSearch) {
      const term = clientSearch.toLowerCase();
      filtered = clientsList.filter(c => c.name.toLowerCase().includes(term));
    }
    
    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [companies, clientSearch]);

  // Handle Sort
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

  // Helper para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  // CRUD Handlers
  const handleOpenEdit = (site: ConstructionSite) => {
    setEditingSite(site);
    setFormData(site);
    
    // Detect manual modes
    const baseName = site.name || '';
    const autoShortName = baseName.substring(0, 16);
    setIsSiteShortNameManual(site.shortName !== autoShortName);

    const client = companies.find(c => c.id === site.clientId);
    const clientShortName = client?.shortName || client?.name || '';
    let autoDisplayName = '';
    const siteShortName = site.shortName || '';
    if (siteShortName && clientShortName) {
      autoDisplayName = `${siteShortName} - ${clientShortName}`;
    } else if (siteShortName) {
      autoDisplayName = siteShortName;
    }
    setIsDisplayNameManual(site.displayName !== autoDisplayName);
    setIsCreatingSiteMode(false);
    
    // Inicializar búsqueda con el nombre del cliente actual
    setClientSearch(client ? client.name : '');
    setSitioSearch(site.workSite || '');
    setObraSearch(site.name || '');
    setVerifiedObraName(site.name || '');
    setVerifiedSitioName(site.workSite || '');
    
    setIsModalOpen(true);
  };

  const handleOpenNew = (isSiteMode: boolean = false, prefilledSite: string = '') => {
    setEditingSite(null);
    setFormData({ ...initialFormState, id: `site-${Date.now()}` });
    setClientSearch('');
    setSitioSearch(prefilledSite);
    setObraSearch('');
    setVerifiedObraName(null);
    setVerifiedSitioName(prefilledSite ? prefilledSite : null);
    setIsDisplayNameManual(false);
    setIsSiteShortNameManual(false);
    setIsCreatingSiteMode(isSiteMode);
    setIsModalOpen(true);
  };

  const handleSelectClient = (client: Company) => {
    const newFormData = { 
      ...formData, 
      clientId: client.id,
      workSite: '',
      name: '',
      shortName: '',
      displayName: ''
    };
    setFormData(newFormData);
    formDataRef.current = newFormData;
    setClientSearch(client.name);
    setSitioSearch('');
    setObraSearch('');
    setIsClientDropdownOpen(false);
  };

  const handleDelete = (id: string) => {
    setSiteToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSitio = (name: string) => {
      setSitioToDelete(name);
      setIsDeleteSitioModalOpen(true);
  };

  const handleConfirmDeleteSitio = () => {
      const obrasToDelete = sites.filter(s => s.workSite && s.workSite.trim() === sitioToDelete);
      obrasToDelete.forEach(obra => onDeleteSite(obra.id));
      setIsDeleteSitioModalOpen(false);
      setSitioToDelete('');
  };

  const handleQuickCreateSite = () => {
    if (!newSiteWizardName.trim()) return;
    
    // Buscar un cliente por defecto
    const defaultClient = companies.find(c => c.roles.includes('Cliente')) || companies[0];
    
    if (!defaultClient) {
        alert("No hay clientes registrados en el sistema para asociar la obra inicial del sitio.");
        return;
    }

    const now = new Date().toISOString();
    const newSite: ConstructionSite = {
        id: `site-init-${Date.now()}`,
        name: `__SITE_ONLY__${newSiteWizardName.trim()}`,
        isVirtualObra: true,
        workSite: newSiteWizardName.trim(),
        location: 'Ubicación por definir',
        status: 'Pendiente de iniciar',
        clientId: defaultClient.id,
        prospectStatus: 'Obra Prospecto',
        createdAt: now,
        updatedAt: now,
        billingPeriod: 'Mensual',
        icaRetainer: 'No'
    };
    
    onAddSite(newSite);
    setIsCreateSiteModalOpen(false);
    setNewSiteWizardName('');
    
    if (isWizardFromObraModal) {
        setIsModalOpen(false);
    }
  };

  const handleOpenRenameSite = (siteName: string) => {
      setSiteToRename(siteName);
      setNewSiteName(siteName);
      setIsRenameSiteModalOpen(true);
  };

  const handleRenameSite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSiteName.trim() || newSiteName.trim() === siteToRename) {
          setIsRenameSiteModalOpen(false);
          return;
      }
      
      const updatedSites = sites.map(site => {
          if (site.workSite && site.workSite.trim() === siteToRename) {
              return { ...site, workSite: newSiteName.trim() };
          }
          return site;
      });
      
      updatedSites.forEach(site => {
          if (site.workSite && site.workSite.trim() === newSiteName.trim()) {
              onUpdateSite(site);
          }
      });
      setIsRenameSiteModalOpen(false);
  };

  const confirmDelete = () => {
    if (siteToDelete) {
      onDeleteSite(siteToDelete);
      setIsDeleteModalOpen(false);
      setSiteToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId || !formData.location) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    if (isCreatingSiteMode && !sitioSearch.trim()) {
      alert("Por favor establece el nombre del Sitio.");
      return;
    }

    const isNewSite = !editingSite;
    const isEditingButRenamedObra = editingSite && normalizeText(editingSite.name) !== normalizeText(formData.name || '');

    if (isNewSite || isEditingButRenamedObra) {
        const normName = normalizeText(formData.name || '');
        const exactObraName = clientObrasNames.find(s => normalizeText(s) === normName);

        if (exactObraName) {
            setDuplicateError("No es posible guardar la obra porque ya existe otra con el mismo nombre para este cliente.");
            return;
        }

        const similarObras = clientObrasNames.filter(s => isSimilarSite(formData.name || '', s));
        if (verifiedObraName !== (formData.name || '').trim()) {
            setNewObraWizardName(formData.name || '');
            setIsCreateObraWizardOpen(true);
            return;
        }
    }

    const normSitioName = normalizeText(sitioSearch);
    if (sitioSearch.trim()) {
        const exactSitioName = uniqueSitios.find(s => normalizeText(s) === normSitioName);
        if (!exactSitioName) {
            if (verifiedSitioName !== sitioSearch.trim()) {
                setNewSiteWizardName(sitioSearch.trim());
                setIsWizardFromObraModal(true);
                setIsCreateSiteModalOpen(true);
                return;
            }
        }
    }

    const now = new Date().toISOString();

    // Limpieza final de espacios (trim) al guardar
    const siteData = {
      ...formData,
      name: formData.name?.trim(),
      workSite: sitioSearch.trim(),
      shortName: formData.shortName?.trim(),
      displayName: formData.displayName?.trim(),
      location: formData.location?.trim(),
      email: formData.email?.trim(),
      billingEmail: formData.billingEmail?.trim(),
      observation: formData.observation?.trim(),
      id: editingSite ? editingSite.id : (formData.id || `site-${Date.now()}`),
      createdAt: editingSite ? formData.createdAt : now,
      updatedAt: now
    } as ConstructionSite;

    if (editingSite) {
      onUpdateSite(siteData);
    } else {
      onAddSite(siteData);
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingSite(null);
  };

  const getAssignedPeople = () => {
    if (!formData.id) return [];
    return people.filter(p => p.siteId === formData.id);
  };

  const handleAddPersonToSite = () => {
    if (!formData.clientId) {
        alert("Primero selecciona un cliente para asociar el personal.");
        return;
    }
    setIsAddPersonModalOpen(true);
  };

  // Import Handlers
  const handleDownloadTemplate = () => {
    const dataToExport = [
      ['Sitio', 'Nombre Obra', 'Ubicación', 'ID Cliente', 'Estado Prospección', 'Estado Operativo', 'Facturación', 'Retenedor ICA', 'Correo Contacto', 'Correo Fact. Elect.', 'Observaciones'],
      ['(Opcional)', '(Obligatorio)', '(Obligatorio)', '(Obligatorio)', 'Obra Cliente/Obra Prospecto', 'Activa/Pausada', 'Mensual/Quincenal', 'No/Si', '(Opcional)', '(Opcional)', '(Opcional)'],
      ['C.C. El Edén', 'Torre Norte', 'Av. 80 # 30-20', 'c1', 'Obra Cliente', 'Activa', 'Mensual', 'No', 'ing@obra.com', 'facturas@obra.com', 'Entrada por calle 30']
    ];
    const ws = utils.aoa_to_sheet(dataToExport);
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'] = [25, 25, 30, 15, 20, 15, 15, 15, 25, 25, 30].map(w => ({ wch: w }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Plantilla Obras");
    writeFile(wb, "plantilla_importacion_obras.xlsx");
    setIsImportMenuOpen(false);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (rawData && rawData.length > 0) {
          const headers = rawData[0] as string[];
          const cleanRows = rawData.slice(1).filter((row: any) => Array.isArray(row) && row.some((cell: any) => cell));
          setImportHeaders(headers);
          setImportData(cleanRows);
          
          const newMapping: Record<number, string> = {};
          headers.forEach((header, index) => {
             const h = String(header).toLowerCase();
             if (h.includes('sitio')) newMapping[index] = 'workSite';
             else if (h.includes('nombre')) newMapping[index] = 'name';
             else if (h.includes('ubicación') || h.includes('direccion')) newMapping[index] = 'location';
             else if (h.includes('cliente')) newMapping[index] = 'clientId';
             else if (h.includes('estado') && h.includes('prospecc')) newMapping[index] = 'prospectStatus';
             else if (h.includes('estado') && !h.includes('prospecc')) newMapping[index] = 'status';
             else if (h.includes('facturación') || h.includes('periodo')) newMapping[index] = 'billingPeriod';
             else if (h.includes('ica')) newMapping[index] = 'icaRetainer';
             else if (h.includes('email') && h.includes('contacto')) newMapping[index] = 'email';
             else if (h.includes('email') && h.includes('factura')) newMapping[index] = 'billingEmail';
             else if (h.includes('observacion')) newMapping[index] = 'observation';
          });
          setColumnMapping(newMapping);
          setIsImportPreviewOpen(true);
        }
      } catch (error) {
        console.error("Error leyendo excel:", error);
        alert("Error al procesar el archivo.");
      }
      setIsImportMenuOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    setIsProcessingImport(true);
    setImportErrors([]);
    
    // 1. Validar que existan clientes en el sistema
    const clientsList = companies.filter(c => c.roles.includes('Cliente'));
    if (clientsList.length === 0) {
        setImportErrors([{ 
            row: "Sistema", 
            error: "No hay clientes registrados en la base de datos.", 
            fix: "Cree al menos un cliente en el módulo de Clientes antes de importar obras." 
        }]);
        setIsImportErrorModalOpen(true);
        setIsProcessingImport(false);
        return;
    }

    // 2. Validar que las columnas obligatorias estén mapeadas
    const mappedValues = Object.values(columnMapping);
    const requiredColumns = [
        { key: 'name', label: 'Nombre de la Obra' },
        { key: 'location', label: 'Ubicación' },
        { key: 'clientId', label: 'Cliente (ID)' }
    ];
    const missingColumns = requiredColumns.filter(col => !mappedValues.includes(col.key));

    if (missingColumns.length > 0) {
        setImportErrors([{ 
            row: "Configuración", 
            error: `Faltan columnas obligatorias por asignar: ${missingColumns.map(c => c.label).join(', ')}.`, 
            fix: "Utilice los selectores en la parte superior de la tabla para asignar estas columnas." 
        }]);
        setIsImportErrorModalOpen(true);
        setIsProcessingImport(false);
        return;
    }

    const errors: {row: number | string, error: string, fix: string}[] = [];
    const validSites: ConstructionSite[] = [];
    const now = new Date().toISOString();

    const mappedRows = importData.map((row, rowIndex) => {
        const item: any = {};
        Object.entries(columnMapping).forEach(([colIndex, fieldKey]) => {
          if (fieldKey && fieldKey !== 'ignore') {
             const index = parseInt(colIndex);
             if (!isNaN(index)) {
                 const val = (row as any)[index];
                 item[fieldKey as string] = val !== undefined ? String(val).trim() : '';
             }
          }
        });
        return { item, rowIndex: rowIndex + 2 }; // +2 considerando header y 0-index
    });

    mappedRows.forEach(({ item, rowIndex }) => {
        if (!item.name && !item.location && !item.clientId) return; // Skip empty rows

        let rowErrorReason = "";
        let rowFix = "";
        let hasError = false;

        if (!item.name) {
            rowErrorReason = "El campo 'Nombre de la Obra' está vacío.";
            rowFix = "Ingrese un nombre para la obra.";
            hasError = true;
        } else if (!item.location) {
            rowErrorReason = "El campo 'Ubicación' está vacío.";
            rowFix = "Ingrese una dirección o ubicación.";
            hasError = true;
        } else if (!item.clientId) {
            rowErrorReason = "El campo 'Cliente (ID)' está vacío.";
            rowFix = "Ingrese el ID del cliente al que pertenece la obra.";
            hasError = true;
        } else {
            const clientsList = companies.filter(c => c.roles.includes('Cliente'));
            const clientExists = clientsList.some(c => c.id.trim() === String(item.clientId).trim());
            if (!clientExists) {
                rowErrorReason = `El ID de Cliente '${item.clientId}' no existe en el sistema.`;
                rowFix = `Utilice un ID válido (Ej: ${clientsList[0]?.id || 'c1'}).`;
                hasError = true;
            }
        }

        if (hasError) {
            errors.push({ row: rowIndex, error: rowErrorReason, fix: rowFix });
        } else {
             validSites.push({
                 id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                 name: item.name,
                 departamento: item.departamento || '',
                 municipio: item.municipio || '',
                 location: item.location,
                 workSite: item.workSite || '',
                 status: (['Activa', 'Pausada', 'Completada', 'Pendiente de iniciar'].includes(item.status) ? item.status : 'Activa') as any,
                 clientId: item.clientId,
                 billingPeriod: (['Quincenal', 'Mensual'].includes(item.billingPeriod) ? item.billingPeriod : 'Mensual') as any,
                 icaRetainer: (['Si', 'No'].includes(item.icaRetainer) ? item.icaRetainer : 'No') as any,
                 prospectStatus: (['Obra Cliente', 'Obra Prospecto'].includes(item.prospectStatus) ? item.prospectStatus : 'Obra Cliente') as any,
                 observation: item.observation || '',
                 email: item.email || '',
                 billingEmail: item.billingEmail || '',
                 createdAt: now,
                 updatedAt: now
             });
        }
    });

    if (errors.length > 0) {
        setImportErrors(errors);
        setIsImportErrorModalOpen(true);
        setIsProcessingImport(false);
        return;
    }

    if (validSites.length === 0) {
        setImportErrors([{ 
            row: "Datos", 
            error: "No se encontraron filas válidas para importar.", 
            fix: "Verifique que el archivo Excel contenga información en las filas." 
        }]);
        setIsImportErrorModalOpen(true);
        setIsProcessingImport(false);
        return;
    }

    try {
        let importedCount = 0;
        for (const site of validSites) {
             onAddSite(site);
             importedCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        alert(`✅ Importación exitosa.\n\nSe han creado ${importedCount} obras correctamente.`);
        setIsImportPreviewOpen(false);
        setImportData([]);
        setImportHeaders([]);
        setColumnMapping({});
    } catch (error) {
        console.error("Error importando:", error);
        alert("Ocurrió un error inesperado al guardar los datos.");
    } finally {
        setIsProcessingImport(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Pausada': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Completada': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* ... (Header content same as before) ... */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Gestión de Obras
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg border border-slate-200">{sites.length} Proyectos</span>
          </h1>
          <p className="text-slate-500 text-sm">Administra los frentes de trabajo y proyectos activos.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
              onClick={() => setActiveTab('obras')}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'obras' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Obras
           </button>
           <button 
              onClick={() => setActiveTab('sitios')}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'sitios' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Sitios
           </button>
           <button 
              onClick={() => setActiveTab('sin_asignar')}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${activeTab === 'sin_asignar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Sin Asignar
           </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><ListIcon size={18} /></button>
          </div>

          <Can permission="CREAR_OBRAS">
            <div className="relative" ref={importMenuRef}>
               <button onClick={() => setIsImportMenuOpen(!isImportMenuOpen)} className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                  <FileSpreadsheet size={18} /> Importar
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isImportMenuOpen ? 'rotate-180' : ''}`} />
               </button>
               {isImportMenuOpen && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={handleDownloadTemplate} className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                       <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><FileDown size={20} /></div>
                       <div><span className="block text-sm font-bold text-slate-700">Descargar Plantilla</span><span className="block text-[10px] text-slate-400 font-medium">Formato .xlsx</span></div>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                       <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><FileUp size={20} /></div>
                       <div><span className="block text-sm font-bold text-slate-700">Subir Archivo</span><span className="block text-[10px] text-slate-400 font-medium">Cargar Excel</span></div>
                    </button>
                 </div>
               )}
               <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
            </div>

            <button 
                onClick={() => {
                    if (activeTab === 'sitios') {
                        setNewSiteWizardName('');
                        setIsWizardFromObraModal(false);
                        setIsCreateSiteModalOpen(true);
                    } else {
                        handleOpenNew(false);
                    }
                }} 
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              <Plus size={18} /> {activeTab === 'sitios' ? 'Nuevo Sitio' : 'Nueva Obra'}
            </button>
          </Can>
        </div>
      </div>

      {/* ... (Filters and Grid/List view same as before) ... */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4" ref={filterDropdownRef}>
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm"><Search size={18} className="text-amber-500" /> Filtros Avanzados</div>
            <button onClick={() => setFilters({ search: '', status: 'Todos', client: 'Todos' })} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-rose-500 transition-colors"><FilterX size={14} /> Limpiar</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SearchableFilter 
                label="Buscar Obra / Ubicación" 
                value={filters.search} 
                options={filterOptions.searchOptions} 
                onChange={(v: string) => setFilters({...filters, search: v})} 
                placeholder="Escribe para buscar..." 
                activeFilterDropdown={activeFilterDropdown} 
                setActiveFilterDropdown={setActiveFilterDropdown} 
            />
            <SearchableFilter label="Estado del Proyecto" value={filters.status} options={filterOptions.statuses} onChange={(v: string) => setFilters({...filters, status: v})} placeholder="Seleccionar estado..." activeFilterDropdown={activeFilterDropdown} setActiveFilterDropdown={setActiveFilterDropdown} />
            <SearchableFilter label="Cliente Asignado" value={filters.client} options={filterOptions.clients} onChange={(v: string) => setFilters({...filters, client: v})} placeholder="Filtrar por cliente..." activeFilterDropdown={activeFilterDropdown} setActiveFilterDropdown={setActiveFilterDropdown} />
        </div>
      </div>

      {activeTab === 'obras' ? (
        <>
          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSites.map(site => (
                <div key={site.id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all group flex flex-col h-full relative">
                  {/* ... (Grid Item Content) ... */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Can permission="EDITAR_OBRAS">
                       <button onClick={() => handleOpenEdit(site)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                     </Can>
                     <Can permission="ELIMINAR_OBRAS">
                       <button onClick={() => handleDelete(site.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                     </Can>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                        <HardHat size={24} />
                     </div>
                     <div className="flex-1 w-0">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate" title={site.displayName || site.name}>{site.displayName || site.name}</h3>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                           <Building2 size={10} /> {getClientName(site.clientId)}
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-4 flex-1">
                     <div className="flex items-start gap-2 text-xs text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>{site.location}</span>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wide ${getStatusColor(site.status)}`}>{site.status}</span>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wide bg-slate-50 text-slate-500 border-slate-100`}>{site.billingPeriod}</span>
                        {site.prospectStatus === 'Obra Prospecto' && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wide bg-amber-50 text-amber-600 border-amber-100">Prospecto</span>}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400">
                     <div className="flex items-center gap-1" title="Fecha Creación"><Calendar size={10}/> {formatDate(site.createdAt)}</div>
                     <div className="flex items-center gap-1" title="Última Actualización"><Clock size={10}/> {formatDate(site.updatedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                         <SortableHeader label="Sitio" sortKey="workSite" />
                         <SortableHeader label="Obra" sortKey="name" />
                         <SortableHeader label="Cliente" sortKey="client" />
                         <SortableHeader label="Ubicación" sortKey="location" />
                         <SortableHeader label="Estado" sortKey="status" />
                         <SortableHeader label="Creado" sortKey="createdAt" />
                         <SortableHeader label="Actualizado" sortKey="updatedAt" />
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredSites.map(site => (
                        <tr key={site.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                  <LayoutGrid size={14} className="text-slate-300" />
                                  <span className="text-xs font-bold text-slate-700">{site.workSite || '-'}</span>
                               </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs"><HardHat size={14}/></div>
                                 <div>
                                    <span className="block text-xs font-bold text-slate-900">{site.displayName || site.name}</span>
                                    {site.prospectStatus === 'Obra Prospecto' && <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">Prospecto</span>}
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 <Building2 size={14} className="text-slate-300" />
                                 <span className="text-xs font-bold text-slate-700">{getClientName(site.clientId)}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                 <MapPin size={14} className="text-slate-400" />
                                 {site.location}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border tracking-tighter ${getStatusColor(site.status)}`}>{site.status}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[10px] text-slate-500">{formatDate(site.createdAt)}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[10px] text-slate-500">{formatDate(site.updatedAt)}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <Can permission="EDITAR_OBRAS">
                                   <button onClick={() => handleOpenEdit(site)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16}/></button>
                                 </Can>
                                 <Can permission="ELIMINAR_OBRAS">
                                   <button onClick={() => handleDelete(site.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                 </Can>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'sitios' ? (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
            {Object.entries(currentSitios).map(([sitioName, obrasDelSitio]: [string, ConstructionSite[]]) => (
                <div key={sitioName} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <LayoutGrid size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900">{sitioName}</h2>
                                <button onClick={() => handleOpenRenameSite(sitioName)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar nombre del sitio">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteSitio(sitioName)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar sitio">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                {obrasDelSitio.length} {obrasDelSitio.length === 1 ? 'Contrato/Obra' : 'Contratos/Obras'} registrados en este sitio
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {obrasDelSitio.map(obra => (
                            <div key={obra.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-slate-800 text-sm">{obra.displayName || obra.name}</h3>
                                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-tighter ${getStatusColor(obra.status)}`}>{obra.status}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                    <Building2 size={12} className="text-slate-400" />
                                    {getClientName(obra.clientId)}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <MapPin size={10} /> {obra.location}
                                    </div>
                                    <button onClick={() => handleOpenEdit(obra)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors">Ver Gesti&oacute;n</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {Object.keys(currentSitios).length === 0 && (
                <div className="text-center py-20 text-slate-400 text-sm font-medium">No se encontraron sitios.</div>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 border-dashed">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Sin Sitio Asignado</h2>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            {unassignedSites.length} {unassignedSites.length === 1 ? 'Contrato/Obra' : 'Contratos/Obras'} sin un sitio asociado
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unassignedSites.map(obra => (
                        <div key={obra.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2 relative group overflow-hidden">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-slate-800 text-sm">{obra.displayName || obra.name}</h3>
                                <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border tracking-tighter ${getStatusColor(obra.status)}`}>{obra.status}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                <Building2 size={12} className="text-slate-400" />
                                {getClientName(obra.clientId)}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin size={10} /> {obra.location}
                                </div>
                                <button onClick={() => handleOpenEdit(obra)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors">Ver Gesti&oacute;n</button>
                            </div>
                            
                            <div className="absolute inset-0 bg-blue-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <button onClick={() => handleOpenEdit(obra)} className="bg-white shadow-lg text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:text-blue-600 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-200">
                                    <Edit2 size={14} /> Asignar Sitio
                                </button>
                            </div>
                        </div>
                    ))}
                    {unassignedSites.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400 text-sm font-medium">No hay obras sin asignar.</div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Modal Add/Edit (Same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* ... (Modal Header) ... */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">{editingSite ? 'Editar Obra' : isCreatingSiteMode ? 'Nuevo Sitio y Obra' : 'Nueva Obra'}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                        {editingSite ? `Actualizando datos de ${editingSite.name}` : isCreatingSiteMode ? 'Crea un sitio configurando su primera obra' : 'Completa los detalles del proyecto'}
                    </p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 {/* ... (Form Fields) ... */}

                 {/* Cliente y Estado Prospección */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 relative" ref={clientDropdownRef}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Cliente <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar cliente..."
                                value={clientSearch}
                                onFocus={() => setIsClientDropdownOpen(true)}
                                onBlur={() => {
                                    setTimeout(() => {
                                        const selectedClient = companies.find(c => c.id === formDataRef.current.clientId);
                                        if (selectedClient) {
                                            setClientSearch(selectedClient.name);
                                        } else {
                                            setClientSearch('');
                                        }
                                    }, 200);
                                }}
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setClientSearch(val);
                                    
                                    setFormData(prev => ({
                                        ...prev, 
                                        clientId: '',
                                        workSite: '',
                                        name: '',
                                        shortName: '',
                                        displayName: ''
                                    }));
                                    setSitioSearch('');
                                    setObraSearch('');
                                    setIsClientDropdownOpen(true);
                                }}
                                className={`w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700 transition-all ${isClientDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : ''}`}
                            />
                            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isClientDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                            
                            {isClientDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                                    {filteredClientsForDropdown.length > 0 ? (
                                        filteredClientsForDropdown.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleSelectClient(c)}
                                                className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                                                <div className="text-[10px] font-medium text-slate-500 uppercase">{c.linkageStatus || 'Sin estado'}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-xs text-slate-400 italic text-center">
                                            No se encontraron clientes.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Estado Prospección</label>
                       <CustomFormSelect
                          value={formData.prospectStatus}
                          onChange={(val: any) => setFormData({...formData, prospectStatus: val})}
                          options={[
                            { value: 'Obra Cliente', label: 'Obra Cliente' },
                            { value: 'Obra Prospecto', label: 'Obra Prospecto' }
                          ]}
                          zIndex={140}
                       />
                    </div>
                 </div>

                 {/* Nombre y Ubicación */}
                 <div className="space-y-4">
                    <div className="space-y-2 relative" ref={sitioDropdownRef}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Sitio {isCreatingSiteMode && <span className="text-red-500">*</span>}</label>
                        <div className="relative group">
                            <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                            <input 
                                type="text" 
                                required={isCreatingSiteMode}
                                value={sitioSearch} 
                                disabled={!formData.clientId}
                                onFocus={() => formData.clientId && setIsSitioDropdownOpen(true)}
                                onBlur={() => {
                                    setTimeout(() => {
                                        if (siteWizardRef.current) return;
                                        if (formDataRef.current.workSite) {
                                            setSitioSearch(formDataRef.current.workSite);
                                        } else {
                                            setSitioSearch('');
                                        }
                                    }, 200);
                                }}
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setSitioSearch(val);
                                    
                                    setFormData(prev => ({
                                        ...prev, 
                                        workSite: '',
                                        name: '',
                                        shortName: '',
                                        displayName: ''
                                    }));
                                    setObraSearch('');
                                    
                                    setIsSitioDropdownOpen(true);
                                }}
                                className={`w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700 transition-all ${isSitioDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : ''} ${!formData.clientId ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                placeholder={formData.clientId ? "Ej. Centro Comercial El Edén" : "Seleccione un cliente primero..."}
                            />
                            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isSitioDropdownOpen ? 'rotate-180' : ''}`} size={16} />

                            {isSitioDropdownOpen && (filteredSitiosForDropdown.length > 0 || (sitioSearch.trim() !== '' && !filteredSitiosForDropdown.some(s => s.toLowerCase() === sitioSearch.trim().toLowerCase()))) && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 flex flex-col">
                                    {filteredSitiosForDropdown.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                setSitioSearch(s);
                                                let newFormData;
                                                if (!editingSite) {
                                                    setObraSearch(s);
                                                    newFormData = {...formData, workSite: s, name: s};
                                                    // Abrir automáticamente el validador de duplicidad (Work Wizard)
                                                    setNewObraWizardName(s);
                                                    setIsCreateObraWizardOpen(true);
                                                    obraWizardRef.current = true;
                                                } else {
                                                    newFormData = {...formData, workSite: s};
                                                }
                                                setFormData(newFormData);
                                                formDataRef.current = newFormData;
                                                setVerifiedSitioName(s);
                                                setIsSitioDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-700 text-sm">{s}</div>
                                        </button>
                                    ))}
                                    
                                    {sitioSearch.trim() !== '' && !filteredSitiosForDropdown.some(s => s.toLowerCase() === sitioSearch.trim().toLowerCase()) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewSiteWizardName(sitioSearch.trim());
                                                setIsWizardFromObraModal(true);
                                                setIsCreateSiteModalOpen(true);
                                                siteWizardRef.current = true;
                                                setIsSitioDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group bg-slate-50/50"
                                        >
                                            <div>
                                                <div className="font-bold text-emerald-600 text-sm flex items-center gap-2">
                                                    <Plus size={14} /> Crear "{sitioSearch.trim()}"
                                                </div>
                                                <div className="text-[10px] text-emerald-500 font-medium">Asignar como nuevo sitio</div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2" ref={obraDropdownRef}>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Nombre de la Obra</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required 
                                value={obraSearch} 
                                disabled={!formData.workSite}
                                onBlur={() => {
                                    setTimeout(() => {
                                        if (obraWizardRef.current) return;
                                        if (formDataRef.current.name) {
                                            setObraSearch(formDataRef.current.name);
                                        } else {
                                            setObraSearch('');
                                        }
                                    }, 200);
                                }}
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setObraSearch(val);
                                    setFormData(prev => ({...prev, name: '', shortName: '', displayName: ''}));
                                    setIsObraDropdownOpen(true);
                                }}
                                onClick={() => {
                                    if (formData.workSite) {
                                        setIsObraDropdownOpen(true);
                                    }
                                }}
                                className={`w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700 transition-all ${isObraDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : ''} ${!formData.workSite ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`} 
                                placeholder={formData.workSite ? "Ej. Torre Residencial Horizon" : "Seleccione o cree un sitio primero..."}
                            />
                            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isObraDropdownOpen ? 'rotate-180' : ''}`} size={16} />

                            {isObraDropdownOpen && (filteredObrasForDropdown.length > 0 || (obraSearch.trim() !== '' && !filteredObrasForDropdown.some(s => s.toLowerCase() === obraSearch.trim().toLowerCase()))) && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 flex flex-col">
                                    {filteredObrasForDropdown.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                setObraSearch(s);
                                                const newFormData = {...formData, name: s};
                                                setFormData(newFormData);
                                                formDataRef.current = newFormData;
                                                setVerifiedObraName(s);
                                                setIsObraDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-700 text-sm">{s}</div>
                                        </button>
                                    ))}
                                    
                                    {obraSearch.trim() !== '' && !filteredObrasForDropdown.some(s => s.toLowerCase() === obraSearch.trim().toLowerCase()) && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setNewObraWizardName(obraSearch.trim());
                                                setIsCreateObraWizardOpen(true);
                                                obraWizardRef.current = true;
                                                setIsObraDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group bg-slate-50/50"
                                        >
                                            <div>
                                                <div className="font-bold text-emerald-600 text-sm flex items-center gap-2">
                                                    <Plus size={14} /> Crear "{obraSearch.trim()}"
                                                </div>
                                                <div className="text-[10px] text-emerald-500 font-medium">Usar este nombre para la nueva obra</div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1 mb-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Obra Corto</label>
                                {isSiteShortNameManual && (
                                    <WordCasingAdjuster 
                                        value={formData.shortName || ''} 
                                        onChange={(val) => setFormData(prev => ({...prev, shortName: val}))}
                                        label="Nombre Corto"
                                    />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSiteShortNameManual(!isSiteShortNameManual)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                    !isSiteShortNameManual 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {!isSiteShortNameManual ? 'Automático' : 'Manual'}
                            </button>
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                maxLength={16}
                                value={formData.shortName || ''} 
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setIsSiteShortNameManual(true);
                                    setFormData(prev => ({...prev, shortName: val}));
                                }}
                                onBlur={(e) => setFormData(prev => ({...prev, shortName: formatTitleCase(trimInput(e.target.value))}))}
                                disabled={!isSiteShortNameManual}
                                className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-colors ${
                                    !isSiteShortNameManual 
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                                        : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-amber-500'
                                }`}
                                placeholder="Autocompletado (obra)"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1 mb-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre a Visualizar</label>
                            <button
                                type="button"
                                onClick={() => setIsDisplayNameManual(!isDisplayNameManual)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                                    !isDisplayNameManual 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                                {!isDisplayNameManual ? 'Automático' : 'Manual'}
                            </button>
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.displayName || ''} 
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setIsDisplayNameManual(true);
                                    setFormData(prev => ({...prev, displayName: val}));
                                }}
                                onBlur={(e) => setFormData(prev => ({...prev, displayName: formatTitleCase(trimInput(e.target.value))}))}
                                disabled={!isDisplayNameManual}
                                className={`w-full px-4 py-3 border rounded-xl outline-none text-sm font-bold transition-colors ${
                                    !isDisplayNameManual 
                                        ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                                        : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-amber-500'
                                }`}
                                placeholder="Autocompletado (obra - cliente)"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Departamento</label>
                            <SearchableDropdown
                                value={formData.departamento || ''}
                                onChange={(val) => {
                                    setFormData(prev => ({
                                        ...prev, 
                                        departamento: val,
                                        municipio: '' // Reset municipio when departamento changes
                                    }));
                                }}
                                options={COLOMBIA_DATA.map(d => ({ value: d.departamento, label: d.departamento })).sort((a, b) => a.label.localeCompare(b.label))}
                                placeholder="Buscar departamento..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Municipio</label>
                            <SearchableDropdown
                                value={formData.municipio || ''}
                                onChange={(val) => setFormData(prev => ({...prev, municipio: val}))}
                                options={
                                    (COLOMBIA_DATA.find(d => d.departamento === formData.departamento)?.ciudades || []).map(c => ({ value: c, label: c })).sort((a, b) => a.label.localeCompare(b.label))
                                }
                                placeholder="Buscar municipio..."
                                disabled={!formData.departamento}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Ubicación / Dirección</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required 
                                value={formData.location} 
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setFormData(prev => ({...prev, location: val}));
                                }}
                                onBlur={(e) => setFormData(prev => ({...prev, location: formatTitleCase(trimInput(e.target.value))}))}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700"
                                placeholder="Ej. Av. Libertador 4500"
                            />
                        </div>
                    </div>
                 </div>

                 {/* SECCIÓN PERSONAL ASIGNADO (Solo Visualización y Botón) */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">PERSONAL ASIGNADO</label>
                        <button 
                            type="button" 
                            onClick={handleAddPersonToSite} 
                            className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                        >
                            <UserPlus size={12} /> Agregar Contacto
                        </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 min-h-[80px]">
                        {getAssignedPeople().length === 0 ? (
                            <p className="text-center text-xs text-slate-400 italic py-4">No hay personas asignadas a esta obra.</p>
                        ) : (
                            <div className="space-y-2">
                                {getAssignedPeople().map(p => (
                                    <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {p.firstName[0]}{p.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                                            <p className="text-[10px] text-slate-500">{p.roles[0]}</p>
                                        </div>
                                        <div className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {p.phones[0]?.value || 'Sin tel'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Detalles Operativos Grid */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Estado Operativo</label>
                       <CustomFormSelect
                          value={formData.status}
                          onChange={(val: any) => setFormData({...formData, status: val})}
                          options={[
                            { value: 'Activa', label: 'Activa' },
                            { value: 'Completada', label: 'Completada' },
                            { value: 'Pausada', label: 'Pausada' },
                            { value: 'Pendiente de iniciar', label: 'Pendiente de iniciar' }
                          ]}
                          zIndex={130}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Facturación</label>
                       <CustomFormSelect
                          value={formData.billingPeriod}
                          onChange={(val: any) => setFormData({...formData, billingPeriod: val})}
                          options={[
                            { value: 'Mensual', label: 'Mensual' },
                            { value: 'Por hitos', label: 'Por hitos' },
                            { value: 'Quincenal', label: 'Quincenal' },
                            { value: 'Semanal', label: 'Semanal' }
                          ]}
                          zIndex={120}
                       />
                    </div>
                    {/* ... other fields ... */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Retenedor ICA</label>
                       <CustomFormSelect
                          value={formData.icaRetainer}
                          onChange={(val: any) => setFormData({...formData, icaRetainer: val})}
                          options={[
                            { value: 'No', label: 'No' },
                            { value: 'Si', label: 'Si' }
                          ]}
                          zIndex={110}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Correo Contacto</label>
                       <div className="relative">
                           <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                           <input 
                                type="email" 
                                placeholder="contacto@obra.com" 
                                value={formData.email} 
                                onChange={(e) => {
                                    const val = cleanInput(e.target.value);
                                    setFormData(prev => ({...prev, email: val}));
                                }}
                                onBlur={(e) => setFormData(prev => ({...prev, email: trimInput(e.target.value)}))}
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700" 
                           />
                       </div>
                    </div>
                 </div>

                 {/* Email Facturación */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Correo Fact. Elect.</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="email" 
                            placeholder="facturacion@obra.com" 
                            value={formData.billingEmail} 
                            onChange={(e) => {
                                const val = cleanInput(e.target.value);
                                setFormData(prev => ({...prev, billingEmail: val}));
                            }}
                            onBlur={(e) => setFormData(prev => ({...prev, billingEmail: trimInput(e.target.value)}))}
                            className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-slate-700" 
                        />
                    </div>
                 </div>

                 {/* Observaciones */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Observaciones</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 text-slate-400" size={16} />
                        <textarea 
                            rows={3}
                            placeholder="Detalles adicionales, restricciones de acceso, etc." 
                            value={formData.observation} 
                            onChange={(e) => {
                                const val = cleanInput(e.target.value);
                                setFormData(prev => ({...prev, observation: val}));
                            }}
                            onBlur={(e) => setFormData(prev => ({...prev, observation: trimInput(e.target.value)}))}
                            className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-sm font-medium text-slate-700 resize-none" 
                        />
                    </div>
                 </div>

                 {/* Read-Only Dates */}
                 {editingSite && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fecha Creación</label>
                            <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-500 flex items-center gap-2 cursor-not-allowed">
                                <Calendar size={14} />
                                {formatDate(formData.createdAt)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Última Actualización</label>
                            <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-500 flex items-center gap-2 cursor-not-allowed">
                                <Clock size={14} />
                                {formatDate(formData.updatedAt)}
                            </div>
                        </div>
                    </div>
                 )}

                 <div className="flex gap-3 pt-2">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                    >
                        {editingSite ? 'Actualizar Cambios' : 'Guardar Obra'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal Add Person to Site (NUEVO) */}
      <PersonModal
        isOpen={isAddPersonModalOpen}
        onClose={() => setIsAddPersonModalOpen(false)}
        onSave={(newPerson) => {
           onAddPerson(newPerson);
           setIsAddPersonModalOpen(false);
        }}
        companies={companies}
        sites={sites}
        fixedLocationType="Obra"
        fixedSiteId={formData.id}
        fixedEntityId={formData.clientId}
        fixedStakeholderType="Cliente"
      />

      {/* Modal Confirm Delete Site */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Obra?</h3>
                 <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Esta acción no se puede deshacer.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => {
                          setIsDeleteModalOpen(false);
                          setSiteToDelete(null);
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

      {/* Import Preview Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-[90vw] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* ... (Import Modal Content) ... */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                       <FileSpreadsheet className="text-emerald-500" /> Verificar Importación
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Se detectaron {importData.length} registros.</p>
                 </div>
                 <button onClick={() => { setIsImportPreviewOpen(false); setImportData([]); }} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden p-6 bg-slate-50/50 flex flex-col">
                 <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                     <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-max text-left border-collapse whitespace-nowrap">
                            <thead className="sticky top-0 z-20 shadow-sm">
                            <tr className="bg-slate-100 border-b border-slate-200">
                                {importHeaders.map((header, index) => (
                                    <th key={index} className="p-3 min-w-[200px] border-r border-slate-200 bg-slate-100">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block px-1 truncate">{header}</span>
                                        <select 
                                            className={`w-full text-xs font-bold border rounded-lg px-2 py-2 outline-none ${columnMapping[index] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                            value={columnMapping[index] || ''}
                                            onChange={(e) => setColumnMapping({...columnMapping, [index]: e.target.value})}
                                        >
                                            <option value="">Ignorar</option>
                                            <option value="name">Nombre de la Obra</option>
                                            <option value="departamento">Departamento</option>
                                            <option value="municipio">Municipio</option>
                                            <option value="location">Ubicación / Dirección</option>
                                            <option value="clientId">Cliente (ID)</option>
                                            <option value="prospectStatus">Estado Prospección</option>
                                            <option value="status">Estado Operativo</option>
                                            <option value="billingPeriod">Facturación</option>
                                            <option value="icaRetainer">Retenedor ICA</option>
                                            <option value="email">Correo Contacto</option>
                                            <option value="billingEmail">Correo Fact. Elect.</option>
                                            <option value="observation">Observaciones</option>
                                        </select>
                                    </div>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {importData.slice(0, 50).map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-slate-50">
                                    {importHeaders.map((_, colIndex) => (
                                        <td key={colIndex} className="p-3 text-xs text-slate-600 border-r border-slate-100 truncate max-w-[300px]">{row[colIndex]}</td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                     </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                 <button onClick={() => { setIsImportPreviewOpen(false); setImportData([]); }} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                 <button onClick={handleProcessImport} disabled={isProcessingImport} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center gap-2 disabled:opacity-70">
                    {isProcessingImport ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : <><ArrowRight size={18} /> Confirmar Importación</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* IMPORT ERROR MODAL */}
      {isImportErrorModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-rose-100 bg-rose-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-rose-700">Errores de Importación</h2>
                        <p className="text-xs text-rose-600 font-medium">Se encontraron problemas que impiden continuar</p>
                    </div>
                 </div>
                 <button onClick={() => setIsImportErrorModalOpen(false)} className="p-2 text-rose-400 hover:bg-rose-100 rounded-full transition-all"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                  <div className="space-y-3">
                      {importErrors.map((err, idx) => (
                          <div key={idx} className="flex gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                              <div className="shrink-0 pt-0.5">
                                  <span className="block w-6 h-6 rounded bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center">
                                      {typeof err.row === 'number' ? err.row + 1 : '!'}
                                  </span>
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-800 mb-1">{err.error}</p>
                                  <p className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 inline-block">
                                      💡 Solución: {err.fix}
                                  </p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button onClick={() => setIsImportErrorModalOpen(false)} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                      Entendido, voy a corregirlo
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Nuevo Sitio Wizard Modal */}
      {isCreateSiteModalOpen && (() => {
          const normWizardName = normalizeText(newSiteWizardName);
          const exactSiteName = uniqueSitios.find(s => normalizeText(s) === normWizardName);
          const existsExactWizard = newSiteWizardName.trim() !== '' && !!exactSiteName;
          const existsSimilarWizard = newSiteWizardName.trim() !== '' && !existsExactWizard && similarSites.length > 0;

          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className={`w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all bg-white border-4 ${
                   existsExactWizard ? 'border-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.15)] shadow-2xl' : 
                   existsSimilarWizard ? 'border-amber-400 shadow-[0_0_0_4px_rgba(245,158,11,0.15)] shadow-2xl' : 
                   'border-transparent shadow-2xl'
               }`}>
                  <div className={`p-6 flex items-center justify-between shrink-0 transition-colors ${
                      existsExactWizard ? 'bg-rose-50/80 border-b border-rose-100' :
                      existsSimilarWizard ? 'bg-amber-50/80 border-b border-amber-100' :
                      'bg-emerald-50/30 border-b border-slate-100'
                  }`}>
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                             existsExactWizard ? 'bg-rose-100 text-rose-600' :
                             existsSimilarWizard ? 'bg-amber-100 text-amber-600' :
                             'bg-emerald-100 text-emerald-600'
                         }`}>
                            {existsExactWizard ? <AlertTriangle size={18} /> : existsSimilarWizard ? <AlertCircle size={18} /> : <LayoutGrid size={18} />}
                         </div>
                         <div>
                            <h2 className={`text-xl font-bold transition-colors ${existsExactWizard ? 'text-rose-900' : existsSimilarWizard ? 'text-amber-900' : 'text-slate-900'}`}>
                                {existsExactWizard ? 'Sitio Duplicado' : existsSimilarWizard ? 'Similitud Detectada' : 'Crear un Nuevo Sitio'}
                            </h2>
                            <p className={`text-xs font-medium transition-colors ${existsExactWizard ? 'text-rose-600' : existsSimilarWizard ? 'text-amber-700' : 'text-slate-500'}`}>
                                {existsExactWizard ? 'Ya existe un sitio con nombre exacto' : 'Verifica que no exista antes de crearlo'}
                            </p>
                         </div>
                     </div>
                     <button 
                        onClick={() => {
                            setIsCreateSiteModalOpen(false);
                            if (isWizardFromObraModal && !formDataRef.current.workSite) {
                                setSitioSearch('');
                                setObraSearch('');
                            }
                        }} 
                        className={`p-2 rounded-full transition-all ${existsExactWizard ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : existsSimilarWizard ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><X size={20} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                      <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-wider block ml-1 transition-colors ${existsExactWizard ? 'text-rose-500' : existsSimilarWizard ? 'text-amber-600' : 'text-slate-400'}`}>Nombre del Sitio</label>
                          <input
                              type="text"
                              value={newSiteWizardName}
                              onChange={(e) => setNewSiteWizardName(cleanInput(e.target.value))}
                              onBlur={(e) => setNewSiteWizardName(formatTitleCase(trimInput(e.target.value)))}
                              className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all border-2 ${
                                  existsExactWizard ? 'border-rose-300 focus:border-rose-500 focus:bg-white' :
                                  existsSimilarWizard ? 'border-amber-300 focus:border-amber-500 focus:bg-white' :
                                  'border-slate-200 focus:border-emerald-500 focus:bg-white'
                              }`}
                              placeholder="Escribe el nombre del sitio..."
                              autoFocus
                          />
                      </div>

                      {newSiteWizardName.trim() !== '' && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Sitios Similares Registrados</label>
                              {similarSites.length > 0 ? (
                                  <div className={`bg-slate-50 border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar transition-colors ${existsExactWizard ? 'border-rose-100' : existsSimilarWizard ? 'border-amber-100' : 'border-slate-200'}`}>
                                      {similarSites.map(s => {
                                          const isThisExactMatch = normalizeText(s) === normWizardName;
                                          return (
                                          <button
                                              key={s}
                                              onClick={() => {
                                                  setNewSiteWizardName(s);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-lg border border-transparent transition-all flex flex-col gap-1 ${isThisExactMatch ? 'hover:border-rose-200 bg-white shadow-sm border-rose-100' : 'hover:border-slate-200'}`}
                                          >
                                              {s}
                                              {isThisExactMatch && (
                                                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={10} /> Coincidencia exacta.</span>
                                              )}
                                          </button>
                                      )})}
                                  </div>
                              ) : (
                                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl p-4 text-sm font-medium flex flex-col gap-2 items-center justify-center text-center">
                                      <CheckCircle2 size={24} className="mb-1 opacity-80" />
                                      ¡Excelente! Parece que este nombre es totalmente nuevo.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className={`p-4 border-t flex justify-end gap-2 transition-colors ${existsExactWizard ? 'bg-rose-50/30 border-rose-100' : existsSimilarWizard ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                     <button 
                        onClick={() => {
                            setIsCreateSiteModalOpen(false);
                            if (isWizardFromObraModal && !formDataRef.current.workSite) {
                                setSitioSearch('');
                                setObraSearch('');
                            }
                        }} 
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        disabled={!newSiteWizardName.trim() || existsExactWizard}
                        onClick={() => {
                            if (existsExactWizard) return;
                            setSiteConfirmDialog({
                                isOpen: true,
                                isSimilar: existsSimilarWizard,
                                action: 'quick'
                            });
                        }}
                        className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 ${existsExactWizard || isWizardFromObraModal ? 'hidden' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}
                     >
                        Guardar y Salir
                     </button>
                     <button
                        disabled={!newSiteWizardName.trim() || existsExactWizard}
                        onClick={() => {
                            if (existsExactWizard) return;
                            setSiteConfirmDialog({
                                isOpen: true,
                                isSimilar: existsSimilarWizard,
                                action: 'continue'
                            });
                        }}
                        className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2 ${existsExactWizard ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                     >
                        {existsExactWizard ? 'Nombre Inválido' : (isWizardFromObraModal ? 'Usar este Sitio' : 'Continuar a Obra')} {existsExactWizard ? <AlertTriangle size={16} /> : (isWizardFromObraModal ? <Check size={16} /> : <ArrowRight size={16} />)}
                     </button>
                  </div>
               </div>
            </div>
          );
      })()}

      {/* Nueva Obra Wizard Modal */}
      {isCreateObraWizardOpen && (() => {
          const normWizardName = normalizeText(newObraWizardName);
          const exactObraName = clientObrasNames.find(s => normalizeText(s) === normWizardName);
          const existsExactWizard = newObraWizardName.trim() !== '' && !!exactObraName;
          const existsSimilarWizard = newObraWizardName.trim() !== '' && !existsExactWizard && similarObrasWizard.length > 0;

          return (
            <div className="fixed inset-[0] z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className={`w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-all bg-white border-4 ${
                   existsExactWizard ? 'border-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.15)] shadow-2xl' : 
                   existsSimilarWizard ? 'border-amber-400 shadow-[0_0_0_4px_rgba(245,158,11,0.15)] shadow-2xl' : 
                   'border-transparent shadow-2xl'
               }`}>
                  <div className={`p-6 flex items-center justify-between shrink-0 transition-colors ${
                      existsExactWizard ? 'bg-rose-50/80 border-b border-rose-100' :
                      existsSimilarWizard ? 'bg-amber-50/80 border-b border-amber-100' :
                      'bg-emerald-50/30 border-b border-slate-100'
                  }`}>
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                             existsExactWizard ? 'bg-rose-100 text-rose-600' :
                             existsSimilarWizard ? 'bg-amber-100 text-amber-600' :
                             'bg-emerald-100 text-emerald-600'
                         }`}>
                            {existsExactWizard ? <AlertTriangle size={18} /> : existsSimilarWizard ? <AlertCircle size={18} /> : <Building2 size={18} />}
                         </div>
                         <div>
                            <h2 className={`text-xl font-bold transition-colors ${existsExactWizard ? 'text-rose-900' : existsSimilarWizard ? 'text-amber-900' : 'text-slate-900'}`}>
                                {existsExactWizard ? 'Obra Duplicada' : existsSimilarWizard ? 'Similitud Detectada' : 'Crear nueva Obra'}
                            </h2>
                            <p className={`text-xs font-medium transition-colors ${existsExactWizard ? 'text-rose-600' : existsSimilarWizard ? 'text-amber-700' : 'text-slate-500'}`}>
                                {existsExactWizard ? 'Ya existe una obra con nombre exacto' : 'Verifica que no exista antes de crearlo'}
                            </p>
                         </div>
                     </div>
                     <button 
                        onClick={() => {
                            setIsCreateObraWizardOpen(false);
                            if (!formDataRef.current.name) {
                                setObraSearch('');
                            }
                        }} 
                        className={`p-2 rounded-full transition-all ${existsExactWizard ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : existsSimilarWizard ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><X size={20} /></button>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                      <div className="space-y-2">
                          <label className={`text-[10px] font-bold uppercase tracking-wider block ml-1 transition-colors ${existsExactWizard ? 'text-rose-500' : existsSimilarWizard ? 'text-amber-600' : 'text-slate-400'}`}>Nombre de la Obra</label>
                          <input
                              type="text"
                              value={newObraWizardName}
                              onChange={(e) => setNewObraWizardName(cleanInput(e.target.value))}
                              onBlur={(e) => setNewObraWizardName(formatTitleCase(trimInput(e.target.value)))}
                              className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all border-2 ${
                                  existsExactWizard ? 'border-rose-300 focus:border-rose-500 focus:bg-white' :
                                  existsSimilarWizard ? 'border-amber-300 focus:border-amber-500 focus:bg-white' :
                                  'border-slate-200 focus:border-emerald-500 focus:bg-white'
                              }`}
                              placeholder="Escribe el nombre de la obra..."
                              autoFocus
                          />
                      </div>

                      {newObraWizardName.trim() !== '' && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Obras Similares Registradas</label>
                              {similarObrasWizard.length > 0 ? (
                                  <div className={`bg-slate-50 border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar transition-colors ${existsExactWizard ? 'border-rose-100' : existsSimilarWizard ? 'border-amber-100' : 'border-slate-200'}`}>
                                      {similarObrasWizard.map(s => {
                                          const isThisExactMatch = normalizeText(s) === normWizardName;
                                          return (
                                          <button
                                              key={s}
                                              onClick={() => {
                                                  setNewObraWizardName(s);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-lg border border-transparent transition-all flex flex-col gap-1 ${isThisExactMatch ? 'hover:border-rose-200 bg-white shadow-sm border-rose-100' : 'hover:border-slate-200'}`}
                                          >
                                              {s}
                                              {isThisExactMatch && (
                                                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={10} /> Coincidencia exacta.</span>
                                              )}
                                          </button>
                                      )})}
                                  </div>
                              ) : (
                                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl p-4 text-sm font-medium flex flex-col gap-2 items-center justify-center text-center">
                                      <CheckCircle2 size={24} className="mb-1 opacity-80" />
                                      ¡Excelente! Parece que este nombre es totalmente nuevo.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className={`p-4 border-t flex justify-end gap-2 transition-colors ${existsExactWizard ? 'bg-rose-50/30 border-rose-100' : existsSimilarWizard ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                     <button 
                        onClick={() => {
                            setIsCreateObraWizardOpen(false);
                            if (!formDataRef.current.name) {
                                setObraSearch('');
                            }
                        }} 
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors"
                     >
                        Cancelar
                     </button>
                     <button
                        disabled={!newObraWizardName.trim() || existsExactWizard}
                        onClick={() => {
                            if (existsExactWizard) return;

                            if (existsSimilarWizard) {
                                setObraConfirmDialog({
                                    isOpen: true,
                                    isSimilar: true
                                });
                                return;
                            }

                            // Use exact
                            const finalVal = newObraWizardName.trim();
                            setIsCreateObraWizardOpen(false);
                            setObraSearch(finalVal);
                            setFormData({...formData, name: finalVal});
                            setVerifiedObraName(finalVal);
                        }}
                        className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center gap-2 ${existsExactWizard ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                     >
                        {existsExactWizard ? 'Nombre Inválido' : 'Utilizar este Nombre'} {existsExactWizard ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                     </button>
                  </div>
               </div>
            </div>
          );
      })()}

      {/* Modal Confirm New Obra */}
      {obraConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Nombre</h3>
                 <p className="text-slate-500 mb-6 font-medium">
                    {obraConfirmDialog.isSimilar 
                        ? "Ya existe una obra con nombre similar, ¿está seguro que desea utilizar este nombre nuevo?"
                        : "¿Está seguro que desea utilizar este nuevo nombre?"}
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setObraConfirmDialog({isOpen: false, isSimilar: false})}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                           const finalVal = newObraWizardName.trim();
                           setIsCreateObraWizardOpen(false);
                           setObraSearch(finalVal);
                           const newFormData = {...formData, name: finalVal};
                           setFormData(newFormData);
                           formDataRef.current = newFormData;
                           setVerifiedObraName(finalVal);
                           setObraConfirmDialog({isOpen: false, isSimilar: false});
                       }}
                       className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-colors"
                    >
                       Aplicar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Rename Site Modal */}
      {isRenameSiteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <form onSubmit={handleRenameSite} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-blue-50/30">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Edit2 size={18} className="ml-0.5" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">Renombrar Sitio</h2>
                    <p className="text-xs font-medium text-slate-500">Editando "{siteToRename}"</p>
                 </div>
              </div>
              
              <div className="p-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Nuevo Nombre del Sitio</label>
                      <input 
                          type="text" 
                          required 
                          value={newSiteName} 
                          onChange={(e) => setNewSiteName(cleanInput(e.target.value))} 
                          onBlur={(e) => setNewSiteName(formatTitleCase(trimInput(e.target.value)))} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" 
                          placeholder="Escribe el nuevo nombre..."
                          autoFocus
                      />
                  </div>
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 mt-4 leading-relaxed font-medium">
                      ⚠️ Este cambio actualizará el nombre del sitio en <strong>todas las {sites.filter(s => s.workSite?.trim() === siteToRename).length} obras</strong> asociadas a esta ubicación.
                  </p>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                 <button type="button" onClick={() => setIsRenameSiteModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors">Cancelar</button>
                 <button type="submit" disabled={!newSiteName.trim() || newSiteName.trim() === siteToRename} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none">Renombrar</button>
              </div>
           </form>
        </div>
      )}

      {/* Modal Confirm New Site */}
      {siteConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Sitio</h3>
                 <p className="text-slate-500 mb-6 font-medium">
                    {siteConfirmDialog.isSimilar 
                        ? "Ya existe un sitio con nombre similar, ¿está seguro que desea guardar este sitio?"
                        : "¿Está seguro que desea guardar este nuevo sitio?"}
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setSiteConfirmDialog({isOpen: false, isSimilar: false, action: null})}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                           if (siteConfirmDialog.action === 'quick') {
                               handleQuickCreateSite();
                           } else if (siteConfirmDialog.action === 'continue') {
                               const finalVal = newSiteWizardName.trim();
                               setIsCreateSiteModalOpen(false);
                               if (isWizardFromObraModal) {
                                   setSitioSearch(finalVal);
                                   const newFormData = {...formData, workSite: finalVal, name: finalVal};
                                   setFormData(newFormData);
                                   formDataRef.current = newFormData;
                                   setVerifiedSitioName(finalVal);
                                   
                                   // También abrir automáticamente el validador de duplicidad (Work Wizard)
                                   setNewObraWizardName(finalVal);
                                   setObraSearch(finalVal);
                                   setIsCreateObraWizardOpen(true);
                                   obraWizardRef.current = true;
                               } else {
                                   handleOpenNew(true, finalVal);
                               }
                           }
                           setSiteConfirmDialog({isOpen: false, isSimilar: false, action: null});
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

      {/* Modal Confirm Delete Sitio */}
      {isDeleteSitioModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar sitio "{sitioToDelete}"?</h3>
                 <p className="text-slate-500 mb-6 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Se eliminarán todas las obras asociadas. Esta acción no se puede deshacer.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setIsDeleteSitioModalOpen(false)}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={handleConfirmDeleteSitio}
                       className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-colors"
                    >
                       Eliminar Sitio
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
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Obra Duplicada</h3>
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

    </div>
  );
};

export default SitesView;
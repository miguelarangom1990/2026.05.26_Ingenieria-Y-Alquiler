import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Equipment, EquipmentStatus, EquipmentCategory, Company, Order, MaintenanceCard } from '../types';
import { 
  Search, Filter, MoreHorizontal, Plus, X, Building2, 
  DollarSign, Image as ImageIcon, LayoutGrid, List as ListIcon,
  Hash, Truck, Edit2, History, FilterX, ChevronDown, Trash2, BookA,
  Upload, Loader2, Crop, Check, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle,
  Sparkles
} from 'lucide-react';
import { uploadFile, saveItem, propagateEquipmentNameChange } from '../services/firebaseService';
import { db } from '../services/firebaseConfig';
import { suggestSynonyms } from '../services/geminiService';
import { isSimilarCategory, dynamicCategorySynonyms } from './EquipmentCategories';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection } from 'firebase/firestore';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { formatTitleCase, cleanInput } from '../lib/utils';
import { WordCasingAdjuster } from '../components/WordCasingAdjuster';
import { getBaseNormalized, levenshteinDistance, normalizeText as commonNormalizeText } from '../lib/textUtils';
import { Can } from '../components/Can';

interface EquipmentListProps {
  itemTypes?: any[];
  equipment: Equipment[];
  categories: EquipmentCategory[];
  companies: Company[];
  onAddEquipment: (item: Equipment) => void;
  onUpdateEquipment: (item: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
}

// --- Buscador Avanzado Helper Functions ---
export let dynamicSynonyms: Record<string, string> = {};

export const setDynamicSynonyms = (data: Record<string, string>) => {
    dynamicSynonyms = data;
};

const updateGlobalSynonyms = async (newSynonyms: Record<string, string>) => {
    dynamicSynonyms = newSynonyms;
    try {
        const docRef = doc(db, 'settings', 'equipmentDictionary');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { synonyms: newSynonyms });
        } else {
            await setDoc(docRef, { synonyms: newSynonyms });
        }
    } catch (e) {
        console.error("Error saving synonyms:", e);
    }
};

const normalizeText = (text: string) => {
    let normalized = getBaseNormalized(text);

    // Reemplazar sinónimos ordenados por longitud (para frases primero)
    const sortedKeys = Object.keys(dynamicSynonyms).filter(k => k).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Reemplazar palabra completa
        normalized = normalized.replace(new RegExp(`\\b${escapedKey}\\b`, 'g'), dynamicSynonyms[key]);
    }
    return normalized;
};

export const isSimilarEquipment = (searchQuery: string, targetEntity: string) => {
    const search = normalizeText(searchQuery);
    const target = normalizeText(targetEntity);
    
    if (!search || !target) return false;
    
    // Si contiene la frase exacta
    if (target.includes(search) || search.includes(target)) return true;

    const searchWords = search.split(" ");
    const targetWords = target.split(" ");
    
    let matchedWords = 0;
    for (const searchWord of searchWords) {
        const word = searchWord.replace(/[.,-]/g, "");
        if (!word) continue;
        
        let hasMatch = false;
        for (const targetWord of targetWords) {
            // Abreviaturas inicio de palabra
            if (word.length <= 3 && targetWord.startsWith(word)) {
                hasMatch = true;
                break;
            }
            
            // Levenshtein con tolerancia controlada por longitud de la palabra
            const distance = levenshteinDistance(word, targetWord);
            const maxDistance = targetWord.length >= 6 ? 2 : (targetWord.length > 3 ? 1 : 0);
            
            const wordInTarget = targetWord.includes(word) && word.length > 2;
            const targetInWord = word.includes(targetWord) && targetWord.length > 2;
            
            if (distance <= maxDistance || wordInTarget || targetInWord || word === targetWord) {
                hasMatch = true;
                break;
            }
        }
        if (hasMatch) matchedWords++;
    }
    
    const relevantSearchWords = searchWords.filter(w => w.replace(/[.,-]/g, "").length > 0);
    const threshold = relevantSearchWords.length <= 2 ? relevantSearchWords.length : Math.ceil(relevantSearchWords.length * 0.6);
    
    const globalDistance = levenshteinDistance(search, target);
    const maxGlobalTypos = target.length <= 3 ? 0 : (target.length < 8 ? 1 : Math.floor(target.length * 0.25));
    const isGlobalSimilar = globalDistance <= maxGlobalTypos;

    return (matchedWords >= threshold && relevantSearchWords.length > 0) || isGlobalSimilar;
};

// --- Componente Reutilizable SearchableFilter (Movido fuera) ---
const SearchableFilter = ({ label, value, options, onChange, placeholder, activeFilterDropdown, setActiveFilterDropdown, searchMatcher }: any) => {
  const isOpen = activeFilterDropdown === label;
  const [localInput, setLocalInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setLocalInput(value === 'Todos' ? '' : value);
    }
  }, [value, isOpen]);

  const displayOptions = useMemo(() => {
    if (!options) return [];
    const term = isOpen ? localInput : '';
    if (searchMatcher && term) {
      return options.filter((opt: any) => searchMatcher(opt, term));
    }
    return options.filter((opt: any) => 
      String(opt).toLowerCase().includes(term.toLowerCase())
    );
  }, [options, localInput, isOpen, searchMatcher]);

  return (
    <div className="flex flex-col gap-1.5 relative min-w-[180px] flex-1">
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
          value={localInput}
          onChange={(e) => { 
            const val = cleanInput(e.target.value);
            setLocalInput(val);
            onChange(val);
            if (!isOpen) setActiveFilterDropdown(label); 
          }}
          onBlur={(e) => {
            const val = e.target.value.trim();
            setLocalInput(val);
            onChange(val);
          }}
          onFocus={() => setActiveFilterDropdown(label)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal"
        />
        {options && options.length > 0 && (
          <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        )}
      </div>
      
      {isOpen && options && options.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[80] py-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto no-scrollbar">
          {displayOptions.length > 0 ? (
            displayOptions.map((opt: string) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setLocalInput(opt === 'Todos' ? '' : opt);
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

const EquipmentList: React.FC<EquipmentListProps> = ({ equipment, categories, companies, onAddEquipment, onUpdateEquipment, onDeleteEquipment }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'pendientes'>('catalogo');
  const [orders, setOrders] = useState<Order[]>([]);
  const [maintenanceCards, setMaintenanceCards] = useState<MaintenanceCard[]>([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
    const unsubMaintenance = onSnapshot(collection(db, 'maintenanceCards'), (snapshot) => {
      setMaintenanceCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceCard)));
    });
    return () => {
      unsubOrders();
      unsubMaintenance();
    };
  }, []);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dictionary Modal State
  const [isDictionaryModalOpen, setIsDictionaryModalOpen] = useState(false);
  const [synonymsState, setSynonymsState] = useState<Record<string, string>>(dynamicSynonyms);
  const [newSynonymKey, setNewSynonymKey] = useState('');
  const [newSynonymValue, setNewSynonymValue] = useState('');
  
  type DictSortKey = 'synonym' | 'meaning' | 'equipment';
  const [dictSortConfig, setDictSortConfig] = useState<{key: DictSortKey, direction: 'asc'|'desc'}[]>([{key: 'synonym', direction: 'asc'}]);

  const getAssociatedEquipment = (val: string) => {
    const valNormalized = getBaseNormalized(val);
    const exactEquip = equipment.find(e => getBaseNormalized(e.name) === valNormalized);
    if (exactEquip) return exactEquip.name;
    const similarEquip = equipment.find(e => {
        const n = getBaseNormalized(e.name);
        return n.includes(valNormalized) || valNormalized.includes(n);
    });
    return similarEquip ? similarEquip.name : '-';
  };

  const handleDictSort = (key: DictSortKey) => {
    setDictSortConfig(prev => {
      const existing = prev.find(p => p.key === key);
      const others = prev.filter(p => p.key !== key);
      if (existing) {
        if (existing.direction === 'asc') {
          return [{key, direction: 'desc'}, ...others];
        } else {
          return others;
        }
      }
      return [{key, direction: 'asc'}, ...others];
    });
  };

  const sortedDictionary = useMemo(() => {
     let entries = Object.entries(synonymsState).map(([key, valueRaw]) => {
       const value = valueRaw as string;
       return {
         synonym: key,
         meaning: value,
         equipment: getAssociatedEquipment(value)
       };
     });

     if (dictSortConfig.length === 0) {
        return entries.sort((a, b) => a.synonym.localeCompare(b.synonym));
     }

     return entries.sort((a, b) => {
        for (const sort of dictSortConfig) {
           const aVal = a[sort.key];
           const bVal = b[sort.key];
           if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
           if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
     });
  }, [synonymsState, equipment, dictSortConfig]);

  // Sincronización del diccionario con Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'equipmentDictionary'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().synonyms || {};
        dynamicSynonyms = data;
        setSynonymsState(data);
      }
    });

    const unsub2 = onSnapshot(doc(db, 'settings', 'categoryDictionary'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().synonyms || {};
        for (const k in dynamicCategorySynonyms) delete dynamicCategorySynonyms[k];
        Object.assign(dynamicCategorySynonyms, data);
      }
    });

    return () => {
      unsub();
      unsub2();
    };
  }, []);

  const [equipmentForSynonyms, setEquipmentForSynonyms] = useState<Equipment | null>(null);
  const [specificSynonymKey, setSpecificSynonymKey] = useState('');
  const [specificSynonymValue, setSpecificSynonymValue] = useState('');
  const [sessionBases, setSessionBases] = useState<string[]>([]);
  const [isSuggestingSynonyms, setIsSuggestingSynonyms] = useState(false);
  const [suggestedSynonyms, setSuggestedSynonyms] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (equipmentForSynonyms) {
      setSpecificSynonymValue(getBaseNormalized(equipmentForSynonyms.name));
      setSessionBases([getBaseNormalized(equipmentForSynonyms.name)]);
    }
  }, [equipmentForSynonyms]);

  // Wizard para validación de duplicados
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardName, setWizardName] = useState("");
  const [equipmentConfirmDialog, setEquipmentConfirmDialog] = useState<{isOpen: boolean, isSimilar?: boolean}>({isOpen: false});

  const [isEquipmentNameDropdownOpen, setIsEquipmentNameDropdownOpen] = useState(false);

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryInputRef = useRef<HTMLDivElement>(null);
  const equipmentNameInputRef = useRef<HTMLDivElement>(null);

  // --- Estado de Filtros Avanzados ---
  const [filters, setFilters] = useState({
    name: '',
    category: '',
    supplierId: '',
    status: 'Todos'
  });

  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Cropper State ---
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // --- Opciones Dinámicas para los Filtros ---
  const filterOptions = useMemo(() => {
    const getUnique = (key: keyof Equipment) => Array.from(new Set(equipment.map(item => String(item[key] || '')).filter(Boolean))).sort((a: any, b: any) => a.localeCompare(b));
    const suppliers = companies.filter(c => c.roles.includes('Proveedor'));
    
    return {
      names: getUnique('name'),
      categories: Array.from(new Set(categories.map(c => c.name))).sort((a: any, b: any) => a.localeCompare(b)),
      suppliers: Array.from(new Set(suppliers.map(s => s.name))).sort((a: any, b: any) => a.localeCompare(b)),
      statuses: ['Todos', ...Object.values(EquipmentStatus)]
    };
  }, [equipment, categories, companies]);

  // --- Semantic Search Matcher ---
  const equipmentSearchMatcher = useCallback((opt: string, term: string) => {
    if (!term) return true;
    const optLower = String(opt).toLowerCase();
    const termLower = term.toLowerCase();
    if (optLower.includes(termLower)) return true;
    
    if (isSimilarEquipment(term, opt)) return true;
    
    const normTerm = getBaseNormalized(termLower);
    const normOpt = getBaseNormalized(opt);
    
    for (const [synonymKey, baseName] of Object.entries(synonymsState) as [string, string][]) {
      if (!synonymKey || !baseName || synonymKey.length <= 2 || baseName.length <= 2) continue;
      if (normTerm.length > 2 && synonymKey.includes(normTerm) && normOpt.includes(baseName)) {
        return true;
      }
      if (normTerm.length > 2 && baseName.includes(normTerm) && normOpt.includes(synonymKey)) {
        return true;
      }
    }

    return false;
  }, [synonymsState]);

  // --- Lógica de Filtrado ---
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const matchName = equipmentSearchMatcher(item.name || '', filters.name);
      const matchCategory = !filters.category || isSimilarCategory(filters.category, item.category || '');
      
      // Buscar el nombre del proveedor si el filtro de proveedor tiene valor
      let matchSupplier = true;
      if (filters.supplierId) {
        const supplier = companies.find(c => c.id === item.supplierId);
        const supplierName = supplier ? supplier.name : item.supplierId;
        matchSupplier = supplierName.toLowerCase().includes(filters.supplierId.toLowerCase());
      }
      
      const matchStatus = filters.status === 'Todos' || item.status === filters.status;

      return matchName && matchCategory && matchSupplier && matchStatus;
    });
  }, [equipment, filters, companies, equipmentSearchMatcher]);

  type SortKey = 'name' | 'category' | 'supplier' | 'hourlyRate' | 'status' | 'createdAt' | 'updatedAt';
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}[]>([]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sortedEquipment = useMemo(() => {
    let sortable = [...filteredEquipment];

    if (sortConfig.length > 0) {
      sortable.sort((a, b) => {
        for (const sort of sortConfig) {
          let valA: any = '';
          let valB: any = '';

          if (sort.key === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
          } else if (sort.key === 'category') {
            valA = (a.category || '').toLowerCase();
            valB = (b.category || '').toLowerCase();
          } else if (sort.key === 'supplier') {
            const getSupplierName = (id?: string) => companies.find(c => c.id === id)?.name || id || '';
            valA = getSupplierName(a.supplierId).toLowerCase();
            valB = getSupplierName(b.supplierId).toLowerCase();
          } else if (sort.key === 'hourlyRate') {
            valA = a.hourlyRate || 0;
            valB = b.hourlyRate || 0;
          } else if (sort.key === 'status') {
            valA = a.status.toLowerCase();
            valB = b.status.toLowerCase();
          } else if (sort.key === 'createdAt') {
            valA = a.createdAt || '';
            valB = b.createdAt || '';
          } else if (sort.key === 'updatedAt') {
            valA = a.updatedAt || '';
            valB = b.updatedAt || '';
          }

          if (valA < valB) {
            return sort.direction === 'asc' ? -1 : 1;
          }
          if (valA > valB) {
            return sort.direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }

    return sortable;
  }, [filteredEquipment, sortConfig, companies]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => {
      const existingSort = prev.find(s => s.key === key);
      const others = prev.filter(s => s.key !== key);
      
      let newDirection: 'asc' | 'desc' = 'asc';
      if (existingSort && existingSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (existingSort && existingSort.direction === 'desc') {
        return others; // Remove from sort if currently 'desc'
      }
      
      return [{ key, direction: newDirection }, ...others].slice(0, 3);
    });
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: 'left' | 'center' | 'right' }) => {
    const activeSort = sortConfig.find(s => s.key === sortKey);
    const priority = sortConfig.findIndex(s => s.key === sortKey);

    return (
      <th 
        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors select-none group ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${activeSort ? 'text-blue-600' : 'text-slate-400'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
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


  // Refs para mantener valores actualizados en handleClickOutside sin re-renderizar listener
  const equipmentRef = useRef(equipment);
  const editingEquipmentRef = useRef(editingEquipment);

  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);

  useEffect(() => {
    editingEquipmentRef.current = editingEquipment;
  }, [editingEquipment]);

  // --- Click Outside para cerrar dropdowns ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setActiveFilterDropdown(null);
      }
      if (categoryInputRef.current && !categoryInputRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (equipmentNameInputRef.current && !equipmentNameInputRef.current.contains(event.target as Node)) {
        setIsEquipmentNameDropdownOpen(prevOpen => {
          if (prevOpen) {
            setNewEquipment(prev => {
              const equipmentList = equipmentRef.current;
              const isVerifiedName = equipmentList.some(e => normalizeText(e.name) === normalizeText(prev.name));
              if (!isVerifiedName && !editingEquipmentRef.current && prev.name.trim() !== '') {
                return { ...prev, name: '' };
              }
              return prev;
            });
          }
          return false;
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetFilters = () => {
    setFilters({ name: '', category: '', supplierId: '', status: 'Todos' });
  };

  const [newEquipment, setNewEquipment] = useState({
    name: '',
    category: '',
    hourlyRate: 0,
    image: 'https://picsum.photos/seed/new/400/300',
    status: EquipmentStatus.AVAILABLE
  });

  const filteredEquipmentForDropdown = useMemo(() => {
     if (!newEquipment.name.trim()) return [];
     return equipment.filter(e => isSimilarEquipment(newEquipment.name, e.name) && normalizeText(e.name) !== normalizeText(newEquipment.name));
  }, [equipment, newEquipment.name]);

  const getStatusStyle = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.AVAILABLE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case EquipmentStatus.RENTED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case EquipmentStatus.MAINTENANCE: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedName = normalizeText(newEquipment.name);
    
    if (!normalizedName) {
        alert("Por favor establece el nombre del Equipo.");
        return;
    }

    if (!editingEquipment) {
        const isDuplicate = equipment.some(e => normalizeText(e.name) === normalizedName);
        if (isDuplicate) {
            setDuplicateError(`No es posible guardar el equipo porque ya existe otro con el nombre "${newEquipment.name.trim()}".`);
            return;
        }
        if (isEquipmentNameDropdownOpen) {
            // Must go through wizard or select an item
            alert("Por favor selecciona un equipo del listado o usa la opción de crear nuevo.");
            return;
        }
    } else {
        const isDuplicate = equipment.some(e => normalizeText(e.name) === normalizedName && e.id !== editingEquipment.id);
        if (isDuplicate) {
            setDuplicateError(`No es posible actualizar el equipo porque ya existe otro con el nombre "${newEquipment.name.trim()}".`);
            return;
        }
    }

    if (editingEquipment) {
      onUpdateEquipment({
        ...editingEquipment,
        ...newEquipment
      });
    } else {
      const itemToAdd: Equipment = {
        id: `eq-${Date.now()}`,
        supplierId: 's1', // Default por simplicidad
        ...newEquipment
      };
      onAddEquipment(itemToAdd);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingEquipment(null);
    setNewEquipment({
      name: '',
      category: '',
      hourlyRate: 0,
      image: 'https://picsum.photos/seed/new/400/300',
      status: EquipmentStatus.AVAILABLE
    });
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setNewEquipment({
      name: item.name,
      category: item.category,
      hourlyRate: item.hourlyRate,
      image: item.image || 'https://picsum.photos/seed/new/400/300',
      status: item.status
    });
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (item: Equipment) => {
    setEquipmentToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (equipmentToDelete) {
      onDeleteEquipment(equipmentToDelete.id);
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const handleAddSynonym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynonymKey.trim() || !newSynonymValue.trim()) return;
    
    // key = word, value = it's synonym (or maps to base word)
    const key = newSynonymKey.trim().toLowerCase();
    const value = newSynonymValue.trim().toLowerCase();
    
    const updated = { ...synonymsState, [key]: value };
    setSynonymsState(updated);
    updateGlobalSynonyms(updated);
    setNewSynonymKey('');
    setNewSynonymValue('');
  };

  const handleAddSpecificSynonym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specificSynonymKey.trim() || !specificSynonymValue.trim()) return;
    
    const keys = specificSynonymKey.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    const value = specificSynonymValue.trim().toLowerCase();
    
    setSessionBases(prev => Array.from(new Set([...prev, value])));

    const updated = { ...synonymsState };
    keys.forEach(key => {
      updated[key] = value;
    });
    setSynonymsState(updated);
    updateGlobalSynonyms(updated);
    setSpecificSynonymKey('');
    setSpecificSynonymValue('');
  };

  const [synonymGroupToDelete, setSynonymGroupToDelete] = useState<string | null>(null);

  const handleSuggestSynonyms = async () => {
    if (!equipmentForSynonyms) return;
    setIsSuggestingSynonyms(true);
    setSuggestedSynonyms([]);
    setSelectedSuggestions([]);
    
    const suggestions = await suggestSynonyms(equipmentForSynonyms.name);
    const eqName = getBaseNormalized(equipmentForSynonyms.name);
    
    const existingKeys = Object.keys(synonymsState).filter(key => synonymsState[key] === eqName);
    const filteredSuggestions = suggestions.filter(s => !existingKeys.includes(s));
    
    setSuggestedSynonyms(filteredSuggestions);
    setIsSuggestingSynonyms(false);
  };

  const handleToggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleAddSelectedSuggestions = () => {
    if (!equipmentForSynonyms || selectedSuggestions.length === 0) return;
    
    const value = getBaseNormalized(equipmentForSynonyms.name);
    const updated = { ...synonymsState };
    
    selectedSuggestions.forEach(key => {
      updated[key] = value;
    });
    
    setSynonymsState(updated);
    updateGlobalSynonyms(updated);
    setSuggestedSynonyms([]);
    setSelectedSuggestions([]);
  };

  const handleRemoveSynonym = (key: string) => {
    const updated = { ...synonymsState };
    delete updated[key];
    setSynonymsState(updated);
    updateGlobalSynonyms(updated);
  };

  const executeRemoveSynonymGroup = () => {
    if(!synonymGroupToDelete) return;
    const baseWord = synonymGroupToDelete;
    const updated = { ...synonymsState };
    Object.keys(updated).forEach(k => {
       if(updated[k] === baseWord) {
           delete updated[k];
       }
    });
    setSessionBases(prev => prev.filter(b => b !== baseWord));
    setSynonymsState(updated);
    updateGlobalSynonyms(updated);
    setSynonymGroupToDelete(null);
  };

  const handleRemoveSynonymGroup = (baseWord: string) => {
    setSynonymGroupToDelete(baseWord);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
    
    // Reset file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Could not crop image");

      const file = new File([croppedImageBlob], "cropped-image.png", { type: "image/png" });
      const downloadURL = await uploadFile(file, 'equipment_inventory');
      setNewEquipment(prev => ({ ...prev, image: downloadURL }));
      setImageToCrop(null); // Close cropper
    } catch (error: any) {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  };

  const pendingEquipment = useMemo(() => {
    const counts: Record<string, { count: number, sources: { type: string, id: string, title: string }[] }> = {};
    const exactNames = new Set(equipment.map(e => e.name));
    const normalizedNames = new Set(equipment.map(e => getBaseNormalized(e.name)));
    const dictionaryEntries = Object.keys(synonymsState).map(k => getBaseNormalized(k));

    const checkAndAdd = (name: string | undefined, source: { type: string, id: string, title: string }) => {
      if (!name) return;
      const trimName = name.trim();
      const norm = getBaseNormalized(trimName);
      if (!trimName) return;
      
      // If exactly matches standard, ignore
      if (exactNames.has(trimName)) return;
      // If normalizes to an existing standard name or dictionary synonym, ignore
      if (normalizedNames.has(norm) || dictionaryEntries.includes(norm)) return;
      
      if (!counts[trimName]) {
         counts[trimName] = { count: 0, sources: [] };
      }
      counts[trimName].count += 1;
      if (!counts[trimName].sources.some(s => s.id === source.id && s.type === source.type)) {
         counts[trimName].sources.push(source);
      }
    };

    orders.forEach(o => {
      o.items?.forEach(i => checkAndAdd(i.equipo, { 
        type: 'order', id: o.id, 
        title: o.nombre ? o.nombre : `Pedido ${o.id.substring(0, 8)}` 
      }));
    });
    maintenanceCards.forEach(m => {
      m.items?.forEach(i => checkAndAdd(i.equipo, { 
        type: 'maintenance', id: m.id, 
        title: `Mantenimiento ${m.id.substring(0, 8)}` 
      }));
    });

    return Object.entries(counts).map(([name, data]) => ({ 
      name, 
      count: data.count, 
      sources: data.sources 
    })).sort((a, b) => b.count - a.count);
  }, [orders, maintenanceCards, equipment, synonymsState]);

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTargetName, setMergeTargetName] = useState<string>('');
  const [mergeDestinationId, setMergeDestinationId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);

  const handleOpenMerge = (pendingName: string) => {
    setMergeTargetName(pendingName);
    setMergeDestinationId('');
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async () => {
    if (!mergeDestinationId) return;
    const destEq = equipment.find(e => e.id === mergeDestinationId);
    if (!destEq) return;

    setIsMerging(true);
    try {
      await propagateEquipmentNameChange(mergeTargetName, destEq.name);
      
      const valNormalized = getBaseNormalized(mergeTargetName);
      if (valNormalized && valNormalized !== getBaseNormalized(destEq.name) && !synonymsState[valNormalized]) {
         const updatedSynonyms = { ...synonymsState, [valNormalized]: getBaseNormalized(destEq.name) };
         await updateGlobalSynonyms(updatedSynonyms);
         setSynonymsState(updatedSynonyms);
      }
      
      setMergeModalOpen(false);
      alert(`Todos los pedidos con '${mergeTargetName}' han sido actualizados a '${destEq.name}'.`);
    } catch (e) {
      console.error(e);
      alert('Error combinando el equipo.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex border-b border-slate-200 mt-2">
        <button 
          onClick={() => setActiveTab('catalogo')}
          className={`px-6 py-3 font-bold border-b-2 text-sm transition-colors ${activeTab === 'catalogo' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          Catálogo de Equipos
        </button>
        <button 
          onClick={() => setActiveTab('pendientes')}
          className={`px-6 py-3 font-bold border-b-2 text-sm flex items-center gap-2 transition-colors ${activeTab === 'pendientes' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          Equipos Provisionales
          {pendingEquipment.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingEquipment.length}</span>}
        </button>
      </div>

      {activeTab === 'catalogo' ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Inventario de Equipos
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg border border-slate-200">{equipment.length} Maquinas</span>
              </h1>
              <p className="text-slate-500 text-sm">Gestiona y monitorea toda tu maquinaria disponible.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
              title="Vista Lista"
            >
              <ListIcon size={18} />
            </button>
          </div>
          <button 
            onClick={async () => {
                const defaults = [
                  { name: "Retro Excavadora", category: "Excavadoras" },
                  { name: "Mini Cargador De Oruga", category: "Minicargadores" },
                  { name: "Planta Electrica 100Kva", category: "Generadores de energia" },
                  { name: "Rodillo compactador monocilíndrico (en tripulado)", category: "Vibrocompactadores" },
                  { name: "Demoledor de muro liviano", category: "Demoledores" },
                  { name: "Concretadora 2 sacos", category: "Concretadoras" },
                  { name: "Demoledor de piso", category: "Demoledores" },
                  { name: "Andamio tijera marco: 1.5mx1.5m", category: "Andamios de tijera" },
                  { name: "Andamio tijera marco: 1.2mx1.5m", category: "Andamios de tijera" },
                  { name: "Compactador tipo rana", category: "Vibrocompactadores" },
                  { name: "Compactador tipo canguro", category: "Vibrocompactadores" },
                  { name: "Automovil", category: "Vehículos" },
                  { name: "Cama Baja", category: "Vehículos" },
                  { name: "Camion Grua", category: "Vehículos" },
                  { name: "Camioneta De Estacas", category: "Vehículos" },
                  { name: "Furgon", category: "Vehículos" },
                  { name: "Camioneta De Volco", category: "Vehículos" }
                ];
                let supplierIdGlobal = companies.find(c => c.name === "Maquinaria Global S.A.")?.id || '';
                for (const eq of defaults) {
                  const exists = equipment.find(e => e.name === eq.name);
                  if (!exists) {
                    await onAddEquipment({
                      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                      name: eq.name,
                      category: eq.category,
                      itemType: categories.find(c => c.name === eq.category)?.itemType || 'Equipos',
                      status: 'Disponible',
                      hourlyRate: 0,
                      image: '',
                      supplierId: supplierIdGlobal
                    });
                  }
                }
             }}
             className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
          >
            Añadir Equipos Faltantes
          </button>
          <button 
            onClick={() => setIsDictionaryModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
            title="Diccionario de Sinónimos"
          >
            <BookA size={18} />
            Diccionario
          </button>
          <Can permission="CREAR_EQUIPOS">
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-200 transition-all active:scale-95"
            >
              <Plus size={18} />
              Nuevo Equipo
            </button>
          </Can>
        </div>
      </div>

      {/* --- PANEL DE FILTROS --- */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4" ref={filterDropdownRef}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Search size={18} className="text-amber-500" />
            Buscador de Maquinaria
          </div>
          <button onClick={resetFilters} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-rose-500 transition-colors">
            <FilterX size={14} /> Limpiar Filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchableFilter 
            label="Equipo / Modelo" 
            value={filters.name} 
            options={filterOptions.names} 
            onChange={(v: any) => setFilters({...filters, name: v})} 
            placeholder="Buscar modelo..." 
            activeFilterDropdown={activeFilterDropdown}
            setActiveFilterDropdown={setActiveFilterDropdown}
            searchMatcher={equipmentSearchMatcher}
          />
          <SearchableFilter 
            label="Categoría" 
            value={filters.category} 
            options={filterOptions.categories} 
            onChange={(v: any) => setFilters({...filters, category: v})} 
            placeholder="Tipo..." 
            activeFilterDropdown={activeFilterDropdown}
            setActiveFilterDropdown={setActiveFilterDropdown}
            searchMatcher={(opt: string, term: string) => isSimilarCategory(term, opt)}
          />
           <SearchableFilter 
            label="Proveedor ID" 
            value={filters.supplierId} 
            options={filterOptions.suppliers} 
            onChange={(v: any) => setFilters({...filters, supplierId: v})} 
            placeholder="Buscar ID..." 
            activeFilterDropdown={activeFilterDropdown}
            setActiveFilterDropdown={setActiveFilterDropdown}
          />
          <SearchableFilter 
            label="Estado Actual" 
            value={filters.status} 
            options={filterOptions.statuses} 
            onChange={(v: any) => setFilters({...filters, status: v})} 
            placeholder="Filtrar estado..." 
            activeFilterDropdown={activeFilterDropdown}
            setActiveFilterDropdown={setActiveFilterDropdown}
          />
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white py-20 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Search size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No se encontraron equipos</h3>
          <p className="text-slate-400 text-sm">Intenta ajustar los filtros de búsqueda.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedEquipment.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all group">
              <div className="relative h-48 overflow-hidden bg-white">
                <img src={item.image || undefined} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getStatusStyle(item.status)} shadow-sm`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{item.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEquipmentForSynonyms(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Ver sinónimos">
                      <BookA size={18} />
                    </button>
                    <Can permission="EDITAR_EQUIPOS">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                    </Can>
                    <Can permission="ELIMINAR_EQUIPOS">
                      <button onClick={() => handleDeleteRequest(item)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </Can>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Costo/Hora</p>
                    <p className="text-sm font-bold text-slate-900">${item.hourlyRate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Proveedor</p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {companies.find(c => c.id === item.supplierId)?.name || item.supplierId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span title="Fecha de Creación">C: {formatDate(item.createdAt)}</span>
                  <span title="Última Actualización">A: {formatDate(item.updatedAt)}</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button className="flex-1 bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                    Ver Detalles
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:border-amber-500 hover:text-amber-500 transition-all">
                    <Filter size={18} />
                  </button>
                </div>
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
                  <SortableHeader label="Equipo" sortKey="name" />
                  <SortableHeader label="Categoría" sortKey="category" />
                  <SortableHeader label="Proveedor" sortKey="supplier" />
                  <SortableHeader label="Tarifa / Hora" sortKey="hourlyRate" />
                  <SortableHeader label="Estado" sortKey="status" />
                  <SortableHeader label="Creación" sortKey="createdAt" />
                  <SortableHeader label="Actualización" sortKey="updatedAt" />
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0">
                          <img src={item.image || undefined} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Hash size={10} /> {item.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Truck size={14} className="text-slate-400" />
                        {companies.find(c => c.id === item.supplierId)?.name || item.supplierId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                        <span className="text-xs text-slate-400 font-bold">$</span>
                        {item.hourlyRate}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">/hr</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border tracking-tighter ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(item.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(item.updatedAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEquipmentForSynonyms(item)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all" title="Ver sinónimos">
                          <BookA size={16} />
                        </button>
                        <Can permission="EDITAR_EQUIPOS">
                          <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                            <Edit2 size={16} />
                          </button>
                        </Can>
                        <Can permission="ELIMINAR_EQUIPOS">
                          <button onClick={() => handleDeleteRequest(item)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-bold text-slate-900 mb-2 mt-2">Equipos Provisionales</h2>
          <p className="text-sm text-slate-500 mb-6">Estos equipos se han registrado manualmente en pedidos o mantenimientos y no existen en el catálogo.</p>
          
          {pendingEquipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Check className="w-12 h-12 mb-4 text-emerald-400 opacity-50" />
              <p className="font-medium text-slate-600">No hay equipos provisionales pendientes</p>
              <p className="text-sm mt-1">Todos los nombres coinciden con el catálogo o el diccionario.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 relative">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Ingresado</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Apariciones</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarjetas Asociadas</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingEquipment.map((eq, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700">{eq.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-600">
                          {eq.count} {eq.count === 1 ? 'vez' : 'veces'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {eq.sources.map((src, idx) => (
                            <Link
                              key={idx}
                              to={src.type === 'order' ? `/pedidos?orderId=${src.id}` : `/mantenimiento?maintenanceId=${src.id}`}
                              state={{ backgroundLocation: location }}
                              className={`text-xs font-bold hover:underline px-2 py-1 rounded-md transition-colors ${
                                src.type === 'order' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                              }`}
                              title={`Ir a ${src.type === 'order' ? 'Pedidos' : 'Mantenimientos'}`}
                            >
                              {src.title}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="text-xs bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition px-3 py-1.5 rounded-lg flex items-center gap-1"
                            onClick={() => handleOpenMerge(eq.name)}
                          >
                            <ArrowUpDown size={14} />
                            Fusionar a Existente
                          </button>
                          <button 
                            className="text-xs bg-emerald-50 font-bold text-emerald-700 hover:bg-emerald-100 transition px-3 py-1.5 rounded-lg flex items-center gap-1"
                            onClick={() => {
                              resetForm();
                              setNewEquipment(prev => ({ ...prev, name: eq.name }));
                              setIsModalOpen(true);
                            }}
                          >
                            <Plus size={14} />
                            Crear en Catálogo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS START HERE */}

      {isWizardOpen && (() => {
        const normWizardName = normalizeText(wizardName);
        const exactEquipment = equipment.find(e => normalizeText(e.name) === normWizardName && (!editingEquipment || e.id !== editingEquipment.id));
        const existsExactWizard = wizardName.trim() !== '' && !!exactEquipment;
        
        const similarEquipmentWizard = wizardName.trim() !== '' 
            ? equipment.filter(e => e.name !== exactEquipment?.name && (!editingEquipment || e.id !== editingEquipment.id) && isSimilarEquipment(wizardName, e.name))
            : [];
            
        const existsSimilarWizard = wizardName.trim() !== '' && !existsExactWizard && similarEquipmentWizard.length > 0;

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                <div className={`p-6 border-b flex justify-between items-start transition-colors ${existsExactWizard ? 'bg-rose-50/50 border-rose-100' : existsSimilarWizard ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
                   <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                           existsExactWizard ? 'bg-rose-100 text-rose-600' :
                           existsSimilarWizard ? 'bg-amber-100 text-amber-600' :
                           'bg-emerald-100 text-emerald-600'
                       }`}>
                          {existsExactWizard ? <AlertTriangle size={18} /> : existsSimilarWizard ? <AlertTriangle size={18} /> : <Plus size={18} />}
                       </div>
                       <div>
                          <h2 className={`text-xl font-bold transition-colors ${existsExactWizard ? 'text-rose-900' : existsSimilarWizard ? 'text-amber-900' : 'text-slate-900'}`}>
                              {existsExactWizard ? 'Equipo Duplicado' : existsSimilarWizard ? 'Similitud Detectada' : (editingEquipment ? 'Editar Equipo' : 'Crear un Nuevo Equipo')}
                          </h2>
                          <p className={`text-xs font-medium transition-colors ${existsExactWizard ? 'text-rose-600' : existsSimilarWizard ? 'text-amber-700' : 'text-slate-500'}`}>
                              {existsExactWizard ? 'Ya existe un equipo con nombre exacto' : 'Verifica que no exista antes de crearlo'}
                          </p>
                       </div>
                   </div>
                   <button onClick={() => setIsWizardOpen(false)} className={`p-2 rounded-full transition-all ${existsExactWizard ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : existsSimilarWizard ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ml-1 transition-colors ${existsExactWizard ? 'text-rose-500' : existsSimilarWizard ? 'text-amber-600' : 'text-slate-400'}`}>Nombre del Equipo</label>
                        <input
                            type="text"
                            value={wizardName}
                            onChange={(e) => setWizardName(cleanInput(e.target.value))}
                            onBlur={(e) => setWizardName(formatTitleCase(e.target.value.trim()))}
                            className={`w-full px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all border-2 ${
                                existsExactWizard ? 'border-rose-300 focus:border-rose-500 focus:bg-white' :
                                existsSimilarWizard ? 'border-amber-300 focus:border-amber-500 focus:bg-white' :
                                'border-slate-200 focus:border-emerald-500 focus:bg-white'
                            }`}
                            placeholder="Escribe el nombre del equipo..."
                            autoFocus
                        />
                    </div>

                    {wizardName.trim() !== '' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Equipos Similares Registrados</label>
                            {similarEquipmentWizard.length > 0 ? (
                                <div className={`bg-slate-50 border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar transition-colors ${existsExactWizard ? 'border-rose-100' : existsSimilarWizard ? 'border-amber-100' : 'border-slate-200'}`}>
                                    {similarEquipmentWizard.map(s => {
                                        return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setWizardName(s.name);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-lg border border-transparent transition-all flex flex-col gap-1 hover:border-slate-200`}
                                        >
                                            <div className="flex justify-between items-center">
                                              <span>{s.name}</span>
                                              <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">{s.category}</span>
                                            </div>
                                        </button>
                                    )})}
                                </div>
                            ) : (
                                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl p-4 text-sm font-medium flex flex-col gap-2 items-center justify-center text-center">
                                    <Check size={24} className="mb-1 opacity-80" />
                                    ¡Excelente! Parece que este nombre es totalmente nuevo.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t flex justify-end gap-2 transition-colors ${existsExactWizard ? 'bg-rose-50/30 border-rose-100' : existsSimilarWizard ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                   <button onClick={() => setIsWizardOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors">Cancelar</button>
                   <button
                      disabled={!wizardName.trim() || existsExactWizard}
                      onClick={() => {
                          if (existsExactWizard) return;
                          
                          if (existsSimilarWizard) {
                              setEquipmentConfirmDialog({ isOpen: true, isSimilar: true });
                              return;
                          }
                          
                          setNewEquipment({...newEquipment, name: wizardName.trim()});
                          setIsWizardOpen(false);
                      }}
                      className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                          existsExactWizard
                          ? 'bg-rose-100 text-rose-400 shadow-none cursor-not-allowed'
                          : existsSimilarWizard
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 hover:shadow-amber-300'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 hover:shadow-emerald-300'
                      }`}
                   >
                      {existsSimilarWizard ? 'Usar este nombre' : (editingEquipment ? 'Confirmar y Actualizar' : 'Continuar y Llenar Datos')}
                   </button>
                </div>
            </div>
          </div>
        );
      })()}

      {/* Merge Modal */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <ArrowUpDown className="text-amber-500" />
                Fusionar Equipo
              </h3>
              <button onClick={() => setMergeModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800">
                  El nombre <strong>"{mergeTargetName}"</strong> será reemplazado en todos los pedidos y mantenimientos por el nombre del equipo que selecciones a continuación.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Equipo de Destino (Oficial)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  value={mergeDestinationId}
                  onChange={e => setMergeDestinationId(e.target.value)}
                >
                  <option value="">Selecciona un equipo de catálogo...</option>
                  {equipment.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setMergeModalOpen(false)}
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmMerge}
                disabled={!mergeDestinationId || isMerging}
                className="flex-1 py-2.5 font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isMerging ? <Loader2 className="animate-spin w-4 h-4" /> : 'Confirmar Fusión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingEquipment ? 'Editar Equipo' : 'Registrar Equipo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="relative" ref={equipmentNameInputRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Equipo</label>
                  <WordCasingAdjuster 
                    value={newEquipment.name} 
                    onChange={(val) => setNewEquipment(prev => ({...prev, name: val}))}
                    label="Equipo"
                  />
                </div>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors ${isEquipmentNameDropdownOpen ? 'text-amber-500' : ''}`} size={18} />
                  <input 
                    required 
                    readOnly={!!editingEquipment}
                    value={newEquipment.name} 
                    onChange={e => {
                      if (!editingEquipment) {
                        const val = cleanInput(e.target.value);
                        setNewEquipment({...newEquipment, name: val});
                        setIsEquipmentNameDropdownOpen(true);
                      }
                    }} 
                    onBlur={(e) => {
                      if (!editingEquipment) {
                        setNewEquipment(prev => ({...prev, name: formatTitleCase(e.target.value.trim())}));
                      }
                    }}
                    onClick={() => {
                      if (editingEquipment) {
                        setWizardName(newEquipment.name);
                        setIsWizardOpen(true);
                      }
                    }}
                    onFocus={() => {
                        if (!editingEquipment) setIsEquipmentNameDropdownOpen(true);
                    }}
                    type="text" 
                    placeholder="Ej. Caterpillar 320" 
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all ${isEquipmentNameDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : 'focus:ring-2 focus:ring-amber-500/20'} ${editingEquipment ? 'cursor-pointer hover:bg-slate-100' : ''}`} 
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isEquipmentNameDropdownOpen ? 'rotate-180' : ''} ${editingEquipment ? 'hidden' : ''}`} size={16} />
                  {editingEquipment && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md pointer-events-none">Editar</span>}
                </div>
                {isEquipmentNameDropdownOpen && (filteredEquipmentForDropdown.length > 0 || (newEquipment.name.trim() !== '' && !filteredEquipmentForDropdown.some(s => normalizeText(s.name) === normalizeText(newEquipment.name)))) && !editingEquipment && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 flex flex-col">
                      {filteredEquipmentForDropdown.map(e => (
                          <button
                              key={e.id}
                              type="button"
                              onClick={() => {
                                  // As it's duplicate protection, they shouldn't just pick it. 
                                  // But let's fill it so the duplicate error can trigger naturally if they try to save
                                  setNewEquipment({...newEquipment, name: e.name});
                                  setIsEquipmentNameDropdownOpen(false);
                              }}
                              className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group"
                          >
                              <div className="font-bold text-slate-700 text-sm">{e.name}</div>
                              <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">{e.category}</span>
                          </button>
                      ))}
                      
                      {newEquipment.name.trim() !== '' && !filteredEquipmentForDropdown.some(e => normalizeText(e.name) === normalizeText(newEquipment.name)) && (
                          <button
                              type="button"
                              onClick={() => {
                                  setWizardName(newEquipment.name.trim());
                                  setIsWizardOpen(true);
                                  setIsEquipmentNameDropdownOpen(false);
                              }}
                              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 flex items-center justify-between group bg-slate-50/50"
                          >
                              <div>
                                  <div className="font-bold text-emerald-600 text-sm flex items-center gap-2">
                                      <Plus size={14} /> Crear "{newEquipment.name.trim()}"
                                  </div>
                                  <div className="text-[10px] text-emerald-500 font-medium">Asignar como nuevo equipo</div>
                              </div>
                          </button>
                      )}
                  </div>
                )}
              </div>
              <div className="relative" ref={categoryInputRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Categoría</label>
                <input 
                  required 
                  value={newEquipment.category} 
                  onChange={e => {
                    const val = cleanInput(e.target.value);
                    setNewEquipment({...newEquipment, category: val});
                    setIsCategoryDropdownOpen(true);
                  }} 
                  onBlur={() => {
                    setTimeout(() => {
                      setNewEquipment(prev => {
                        const val = prev.category.trim();
                        const existingCat = filterOptions.categories.find((cat: any) => String(cat).toLowerCase() === val.toLowerCase());
                        if (existingCat) {
                          return { ...prev, category: String(existingCat) };
                        } else if (val !== '') {
                          return { ...prev, category: '' };
                        }
                        return { ...prev, category: val };
                      });
                    }, 200);
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  type="text" 
                  placeholder="Ej. Maquinaria Pesada" 
                  className="w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none" 
                />
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-[110] py-2 max-h-48 overflow-y-auto">
                    {filterOptions.categories.filter((cat: any) => String(cat).toLowerCase().includes(newEquipment.category.toLowerCase())).map((cat: any) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setNewEquipment({...newEquipment, category: String(cat)});
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                    {filterOptions.categories.filter((cat: any) => String(cat).toLowerCase().includes(newEquipment.category.toLowerCase())).length === 0 && newEquipment.category && (
                      <div className="px-4 py-2 text-sm text-slate-400 italic">"{newEquipment.category}" no existe en las categorías</div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Costo por Hora (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="number" value={newEquipment.hourlyRate ?? ''} onChange={e => setNewEquipment({...newEquipment, hourlyRate: Number(e.target.value)})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Imagen del Equipo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
                      {newEquipment.image ? (
                        <>
                          <img src={newEquipment.image || undefined} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button 
                              type="button"
                              onClick={() => setImageToCrop(newEquipment.image)}
                              className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                            >
                              <Crop size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setNewEquipment(prev => ({ ...prev, image: '' }))}
                              className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon size={24} />
                          <span className="text-[10px] font-bold mt-1">Sin imagen</span>
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                          <Loader2 size={24} className="text-amber-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button 
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:border-amber-500 hover:text-amber-600 transition-all disabled:opacity-50"
                      >
                        <Upload size={18} />
                        {isUploading ? 'Subiendo...' : 'Cargar desde PC'}
                      </button>
                      <p className="text-[10px] text-slate-400">Formatos: JPG, PNG, WEBP. Máx 5MB.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Estado</label>
                <select value={newEquipment.status} onChange={e => setNewEquipment({...newEquipment, status: e.target.value as EquipmentStatus})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none">
                  {Object.values(EquipmentStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all">{editingEquipment ? 'Actualizar Equipo' : 'Guardar Equipo'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */ }
      {equipmentConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Equipo</h3>
                 <p className="text-slate-500 mb-6 font-medium">
                    {equipmentConfirmDialog.isSimilar 
                        ? "Ya existe un equipo con nombre similar, ¿está seguro que desea guardar este equipo?"
                        : "¿Está seguro que desea guardar este nuevo equipo?"}
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setEquipmentConfirmDialog({isOpen: false, isSimilar: false})}
                       className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                       Cancelar
                    </button>
                    <button 
                       onClick={() => {
                           setNewEquipment({...newEquipment, name: wizardName.trim()});
                           setEquipmentConfirmDialog({isOpen: false, isSimilar: false});
                           setIsWizardOpen(false);
                       }}
                       className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors"
                    >
                       Guardar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Specific Equipment Dictionary Modal */}
      {equipmentForSynonyms && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <BookA size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sinónimos</h2>
                  <p className="text-sm text-slate-500">Agrega palabras equivalentes para {equipmentForSynonyms.name}.</p>
                </div>
              </div>
              <button onClick={() => setEquipmentForSynonyms(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleAddSpecificSynonym} className="flex gap-2 mb-6">
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={specificSynonymKey}
                    onChange={(e) => setSpecificSynonymKey(cleanInput(e.target.value))}
                    onBlur={(e) => setSpecificSynonymKey(e.target.value.trim())}
                    placeholder={`Sinónimo (ej. apisonador)`}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all min-w-0"
                  />
                  <span className="hidden sm:flex items-center text-slate-300"><ArrowUpDown size={16} className="rotate-90" /></span>
                  <input
                    type="text"
                    value={specificSynonymValue}
                    onChange={(e) => setSpecificSynonymValue(cleanInput(e.target.value))}
                    onBlur={(e) => setSpecificSynonymValue(e.target.value.trim())}
                    placeholder={`Significado (ej. compactador)`}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all min-w-0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!specificSynonymKey.trim() || !specificSynonymValue.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all sm:self-auto self-start"
                >
                  <Plus size={20} />
                </button>
              </form>

              <div className="flex items-center justify-between mb-4 mt-6">
                <h3 className="text-sm font-bold text-slate-700">Sinónimos Sugeridos (IA)</h3>
                <button
                  type="button"
                  onClick={handleSuggestSynonyms}
                  disabled={isSuggestingSynonyms}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {isSuggestingSynonyms ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Sugerir
                </button>
              </div>

              {suggestedSynonyms.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedSynonyms.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => handleToggleSuggestion(suggestion)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedSuggestions.includes(suggestion)
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {selectedSuggestions.includes(suggestion) && <Check size={14} />}
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  {selectedSuggestions.length > 0 && (
                    <button
                      onClick={handleAddSelectedSuggestions}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors animate-in fade-in"
                    >
                      Agregar Seleccionados ({selectedSuggestions.length})
                    </button>
                  )}
                </div>
              )}

              <h3 className="text-sm font-bold text-slate-700 mb-4 mt-2">Sinónimos Actuales</h3>
              <div className="space-y-4">
                {(() => {
                  const eqName = getBaseNormalized(equipmentForSynonyms.name);
                  const eqWords = eqName.split(' ').filter(w => w.length > 2);
                  
                  const relevantBaseWords = new Set<string>(sessionBases);
                  
                  Object.entries(synonymsState).forEach(([key, valueRaw]) => {
                    const value = valueRaw as string;
                    if (
                      value === eqName || 
                      key === eqName || 
                      eqWords.some(w => value === w || key === w) || 
                      eqName.includes(value) || 
                      eqName.includes(key)
                    ) {
                      relevantBaseWords.add(value);
                    }
                  });

                  const relevantSynonyms = Object.entries(synonymsState).filter(([key, valueRaw]) => {
                    const value = valueRaw as string;
                    return relevantBaseWords.has(value);
                  });

                  if (relevantSynonyms.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400">
                        <BookA size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No hay sinónimos específicos registrados para este equipo.</p>
                      </div>
                    );
                  }

                  // Group by canonical value
                  const groupedSynonyms = relevantSynonyms.reduce((acc, [key, valueRaw]) => {
                    const value = valueRaw as string;
                    if (!acc[value]) acc[value] = [];
                    acc[value].push(key);
                    return acc;
                  }, {} as Record<string, string[]>);

                  const sortedGroups = Object.entries(groupedSynonyms).sort((a, b) => a[0].localeCompare(b[0]));

                  return sortedGroups.map(([baseWord, synonyms]) => (
                    <div key={baseWord} className="bg-slate-50 border border-slate-100 rounded-xl p-4 group/groupbox">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-slate-700 uppercase tracking-wider text-xs">{baseWord}</div>
                        <button 
                           onClick={() => handleRemoveSynonymGroup(baseWord)}
                           className="opacity-0 group-hover/groupbox:opacity-100 p-1 bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-all"
                           title="Eliminar grupo completo"
                        >
                           <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {[...synonyms].sort((a, b) => a.localeCompare(b)).map(key => (
                          <div key={key} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg group hover:border-slate-200 transition-colors">
                            <input 
                              defaultValue={key}
                              onBlur={(e) => {
                                const newKey = e.target.value.trim().toLowerCase();
                                if (newKey && newKey !== key) {
                                  const updated = { ...synonymsState };
                                  delete updated[key];
                                  updated[newKey] = baseWord;
                                  setSynonymsState(updated);
                                  updateGlobalSynonyms(updated);
                                } else if (!newKey) {
                                  e.target.value = key;
                                }
                              }}
                              className="font-medium text-slate-600 w-full min-w-0 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-none transition-colors px-1 text-sm" 
                              title="Editar sinónimo"
                            />
                            <button
                              onClick={() => handleRemoveSynonym(key)}
                              className="p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Eliminar sinónimo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                           <input
                             type="text"
                             placeholder={`Añadir otro sinónimo para ${baseWord}...`}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 const target = e.target as HTMLInputElement;
                                 const val = target.value.trim().toLowerCase();
                                 if (val) {
                                   const keys = val.split(',').map(k => k.trim()).filter(k => k);
                                   const updated = { ...synonymsState };
                                   keys.forEach(k => { updated[k] = baseWord; });
                                   setSessionBases(prev => Array.from(new Set([...prev, baseWord])));
                                   setSynonymsState(updated);
                                   updateGlobalSynonyms(updated);
                                   target.value = '';
                                 }
                               }
                             }}
                             className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all"
                           />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setEquipmentForSynonyms(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Modal */}
      {isDictionaryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <BookA size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Diccionario de Sinónimos</h2>
                  <p className="text-sm text-slate-500">Agrega palabras equivalentes para mejorar las búsquedas.</p>
                </div>
              </div>
              <button onClick={() => setIsDictionaryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleAddSynonym} className="flex gap-2 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newSynonymKey}
                    onChange={(e) => setNewSynonymKey(cleanInput(e.target.value))}
                    onBlur={(e) => setNewSynonymKey(e.target.value.trim())}
                    placeholder="Palabra original (ej. pulidora)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all"
                  />
                </div>
                <div className="flex items-center text-slate-400">
                  <ArrowUpDown size={16} className="rotate-90" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newSynonymValue}
                    onChange={(e) => setNewSynonymValue(cleanInput(e.target.value))}
                    onBlur={(e) => setNewSynonymValue(e.target.value.trim())}
                    placeholder="Sinónimo (ej. esmeriladora)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newSynonymKey.trim() || !newSynonymValue.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all"
                >
                  <Plus size={20} />
                </button>
              </form>

              {Object.keys(synonymsState).length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                         <th className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleDictSort('synonym')}>
                            <div className="flex items-center gap-1">
                               Sinónimo
                               {dictSortConfig.find(s => s.key === 'synonym') && (
                                  dictSortConfig.find(s => s.key === 'synonym')?.direction === 'asc' ? <ArrowUp size={12} className="text-amber-500" /> : <ArrowDown size={12} className="text-amber-500" />
                               )}
                            </div>
                         </th>
                         <th className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleDictSort('meaning')}>
                            <div className="flex items-center gap-1">
                               Significado
                               {dictSortConfig.find(s => s.key === 'meaning') && (
                                  dictSortConfig.find(s => s.key === 'meaning')?.direction === 'asc' ? <ArrowUp size={12} className="text-amber-500" /> : <ArrowDown size={12} className="text-amber-500" />
                               )}
                            </div>
                         </th>
                         <th className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleDictSort('equipment')}>
                            <div className="flex items-center gap-1">
                               Equipo Asociado
                               {dictSortConfig.find(s => s.key === 'equipment') && (
                                  dictSortConfig.find(s => s.key === 'equipment')?.direction === 'asc' ? <ArrowUp size={12} className="text-amber-500" /> : <ArrowDown size={12} className="text-amber-500" />
                               )}
                            </div>
                         </th>
                         <th className="p-3 border-b border-slate-200 w-16"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {sortedDictionary.map((item) => (
                           <tr key={item.synonym} className="hover:bg-slate-50 group transition-colors">
                              <td className="p-3">
                                 <span className="font-bold text-slate-700">{item.synonym}</span>
                              </td>
                              <td className="p-3">
                                 <span className="font-medium text-slate-500">{item.meaning}</span>
                              </td>
                              <td className="p-3">
                                 <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded-md">
                                     {item.equipment}
                                 </span>
                              </td>
                              <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleRemoveSynonym(item.synonym)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Eliminar sinónimo"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                              </td>
                           </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                  <div className="text-center py-8 text-slate-400">
                    <BookA size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No hay sinónimos registrados.</p>
                  </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsDictionaryModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && equipmentToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Equipo?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Estás a punto de eliminar el equipo <span className="font-bold text-slate-700">{equipmentToDelete.name}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setEquipmentToDelete(null); }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[80vh] max-h-[600px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Crop size={20} className="text-amber-500" />
                Ajustar Miniatura
              </h2>
              <button 
                onClick={() => setImageToCrop(null)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative flex-1 bg-white w-full h-full overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
                minZoom={0.1}
                restrictPosition={false}
                style={{ containerStyle: { backgroundColor: 'white' }, mediaStyle: { backgroundColor: 'transparent' } }}
              />
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={0.1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => {
                      setZoom(Number(e.target.value))
                    }}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setImageToCrop(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCropConfirm}
                    disabled={isUploading}
                    className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Confirmar y Subir
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {duplicateError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Equipo Duplicado</h3>
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

      {synonymGroupToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar grupo de sinónimos?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Estás a punto de eliminar todos los sinónimos asociados a <span className="font-bold text-slate-700">{synonymGroupToDelete}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setSynonymGroupToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeRemoveSynonymGroup}
                className="flex-1 py-3 px-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentList;
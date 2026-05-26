import React, { useState, useRef, useMemo, useEffect } from 'react';
import { EquipmentCategory, Equipment, ItemType } from '../types';
import { Search, Plus, Edit2, Trash2, X, Tags, Hash, Image as ImageIcon, Upload, Loader2, ChevronDown, ChevronUp, Package, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Check, BookA, Layers } from 'lucide-react';
import { uploadFile } from '../services/firebaseService';
import { formatTitleCase, cleanInput } from '../lib/utils';
import { WordCasingAdjuster } from '../components/WordCasingAdjuster';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { suggestSynonyms } from '../services/geminiService';
import { getBaseNormalized, levenshteinDistance } from '../lib/textUtils';

export let dynamicCategorySynonyms: Record<string, string> = {};
let localEquipmentSynonyms: Record<string, string> = {};

export const updateGlobalCategorySynonyms = async (newSynonyms: Record<string, string>) => {
    dynamicCategorySynonyms = newSynonyms;
    try {
        const docRef = doc(db, 'settings', 'categoryDictionary');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            await updateDoc(docRef, { synonyms: newSynonyms });
        } else {
            await setDoc(docRef, { synonyms: newSynonyms });
        }
    } catch (e) {
        console.error("Error saving category synonyms:", e);
    }
};

export const normalizeCategoryText = (text: string) => {
    let normalized = getBaseNormalized(text);

    // Reemplazar sinónimos ordenados por longitud (para frases primero)
    const sortedKeys = Object.keys(dynamicCategorySynonyms).filter(k => k).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
        if (regex.test(normalized)) {
            normalized = normalized.replace(regex, dynamicCategorySynonyms[key]);
        }
    }
    return normalized;
};

export const isSimilarCategory = (searchQuery: string, targetEntity: string) => {
    const search = normalizeCategoryText(searchQuery);
    const target = normalizeCategoryText(targetEntity);
    
    if (!search || !target) return false;
    
    // Si contiene la frase exacta
    if (target.includes(search) || search.includes(target)) return true;
    
    const normSearch = getBaseNormalized(searchQuery);
    const normTarget = getBaseNormalized(targetEntity);
    
    for (const [synonymKey, baseName] of Object.entries(dynamicCategorySynonyms)) {
      if (!synonymKey || !baseName || synonymKey.length <= 2 || baseName.length <= 2) continue;
      if (normSearch.length > 2 && synonymKey.includes(normSearch) && normTarget.includes(baseName)) {
        return true;
      }
      if (normSearch.length > 2 && baseName.includes(normSearch) && normTarget.includes(synonymKey)) {
        return true;
      }
    }

    for (const [synonymKey, baseName] of Object.entries(localEquipmentSynonyms)) {
      if (!synonymKey || !baseName || synonymKey.length <= 2 || baseName.length <= 2) continue;
      if (normSearch.length > 2 && synonymKey.includes(normSearch) && normTarget.includes(baseName)) {
        return true;
      }
      if (normSearch.length > 2 && baseName.includes(normSearch) && normTarget.includes(synonymKey)) {
        return true;
      }
    }
    
    // Si alguna palabra importante coincide o tiene distancia Levenshtein corta
    const searchWords = search.split(' ').filter(w => w.length > 2); // ignorar "de", "el", etc.
    const targetWords = target.split(' ').filter(w => w.length > 2);
    
    for (const sw of searchWords) {
        for (const tw of targetWords) {
            if (sw === tw) return true;
            if (sw.length > 4 && tw.length > 4) {
               if (levenshteinDistance(sw, tw) <= 2) return true;
            }
            if (tw.includes(sw) && sw.length > 2) return true;
            if (sw.includes(tw) && tw.length > 2) return true;
        }
    }
    return false;
};

interface EquipmentCategoriesProps {
  categories: EquipmentCategory[];
  equipment: Equipment[];
  itemTypes: ItemType[];
  onAddCategory: (category: EquipmentCategory) => void;
  onUpdateCategory: (category: EquipmentCategory) => void;
  onDeleteCategory: (id: string) => void;
}

const EquipmentCategories: React.FC<EquipmentCategoriesProps> = ({ 
  categories, 
  equipment,
  itemTypes,
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EquipmentCategory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<EquipmentCategory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dictionary Modal State
  const [isDictionaryModalOpen, setIsDictionaryModalOpen] = useState(false);
  const [synonymsState, setSynonymsState] = useState<Record<string, string>>(dynamicCategorySynonyms);
  const [categoryForSynonyms, setCategoryForSynonyms] = useState<EquipmentCategory | null>(null);
  const [specificSynonymKey, setSpecificSynonymKey] = useState('');
  const [specificSynonymValue, setSpecificSynonymValue] = useState('');
  const [sessionBases, setSessionBases] = useState<string[]>([]);
  const [isSuggestingSynonyms, setIsSuggestingSynonyms] = useState(false);
  const [suggestedSynonyms, setSuggestedSynonyms] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // Global Dictionary State
  const [isGlobalDictionaryModalOpen, setIsGlobalDictionaryModalOpen] = useState(false);
  const [newSynonymKey, setNewSynonymKey] = useState('');
  const [newSynonymValue, setNewSynonymValue] = useState('');
  
  type DictSortKey = 'synonym' | 'meaning' | 'category';
  const [dictSortConfig, setDictSortConfig] = useState<{key: DictSortKey, direction: 'asc'|'desc'}[]>([{key: 'synonym', direction: 'asc'}]);

  const getAssociatedCategory = (val: string) => {
    const valNormalized = getBaseNormalized(val);
    const exactCat = categories.find(c => getBaseNormalized(c.name) === valNormalized);
    if (exactCat) return exactCat.name;
    const similarCat = categories.find(c => {
        const n = getBaseNormalized(c.name);
        return n.includes(valNormalized) || valNormalized.includes(n);
    });
    return similarCat ? similarCat.name : '-';
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
     let entries = Object.entries(synonymsState).map(([key, value]) => ({
       synonym: key,
       meaning: value as string,
       category: getAssociatedCategory(value as string)
     }));

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
  }, [synonymsState, categories, dictSortConfig]);


  // Sincronización del diccionario con Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'categoryDictionary'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().synonyms || {};
        dynamicCategorySynonyms = data;
        setSynonymsState(data);
      }
    });

    const unsubEq = onSnapshot(doc(db, 'settings', 'equipmentDictionary'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().synonyms || {};
        localEquipmentSynonyms = data;
      }
    });

    return () => {
        unsub();
        unsubEq();
    };
  }, []);

  useEffect(() => {
    if (categoryForSynonyms) {
      setSpecificSynonymValue(getBaseNormalized(categoryForSynonyms.name));
      setSessionBases([getBaseNormalized(categoryForSynonyms.name)]);
    }
  }, [categoryForSynonyms]);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardName, setWizardName] = useState("");
  const [categoryConfirmDialog, setCategoryConfirmDialog] = useState<{isOpen: boolean, isSimilar?: boolean}>({isOpen: false});
  const [isCategoryNameDropdownOpen, setIsCategoryNameDropdownOpen] = useState(false);
  const [isItemTypeDropdownOpen, setIsItemTypeDropdownOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const categoryNameInputRef = useRef<HTMLDivElement>(null);
  const itemTypeNameInputRef = useRef<HTMLDivElement>(null);
  const editingCategoryRef = useRef<EquipmentCategory | null>(null);

  // Update ref for click-outside
  useEffect(() => {
    editingCategoryRef.current = editingCategory;
  }, [editingCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryNameInputRef.current && !categoryNameInputRef.current.contains(event.target as Node)) {
        setIsCategoryNameDropdownOpen(prevOpen => {
          if (prevOpen) {
            setNewCategory(prev => {
              const isVerifiedName = categories.some(c => getBaseNormalized(c.name) === getBaseNormalized(prev.name));
              if (!isVerifiedName && !editingCategoryRef.current && prev.name.trim() !== '') {
                return { ...prev, name: '' };
              }
              return prev;
            });
          }
          return false;
        });
      }
      if (itemTypeNameInputRef.current && !itemTypeNameInputRef.current.contains(event.target as Node)) {
        setIsItemTypeDropdownOpen(prevOpen => {
          if (prevOpen) {
            setNewCategory(prev => {
              const isVerifiedItemType = itemTypes.some(t => getBaseNormalized(t.name) === getBaseNormalized(prev.itemType || ''));
              if (!isVerifiedItemType && prev.itemType?.trim() !== '') {
                return { ...prev, itemType: '' };
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
  }, [categories, itemTypes]);

  type SortKey = 'name' | 'itemType' | 'description' | 'equipos' | 'createdAt' | 'updatedAt';
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}[]>([]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const [newCategory, setNewCategory] = useState({
    name: '',
    itemType: '',
    description: '',
    image: ''
  });

  const filteredCategories = categories.filter(cat => {
    if (!searchTerm) return true;
    return isSimilarCategory(searchTerm, cat.name) || 
      (cat.description && isSimilarCategory(searchTerm, cat.description));
  });

  const sortedCategories = useMemo(() => {
    let sortable = [...filteredCategories];

    if (sortConfig.length > 0) {
      sortable.sort((a, b) => {
        for (const sort of sortConfig) {
          let valA: any = '';
          let valB: any = '';

          if (sort.key === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
          } else if (sort.key === 'itemType') {
            valA = (a.itemType || '').toLowerCase();
            valB = (b.itemType || '').toLowerCase();
          } else if (sort.key === 'description') {
            valA = (a.description || '').toLowerCase();
            valB = (b.description || '').toLowerCase();
          } else if (sort.key === 'equipos') {
            valA = equipment.filter(e => e.category === a.name).length;
            valB = equipment.filter(e => e.category === b.name).length;
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
  }, [filteredCategories, sortConfig, equipment]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedName = getBaseNormalized(newCategory.name);
    
    if (!normalizedName) {
        alert("Por favor establece el nombre de la Categoría.");
        return;
    }

    if (!editingCategory) {
        const isDuplicate = categories.some(c => getBaseNormalized(c.name) === normalizedName);
        if (isDuplicate) {
            setDuplicateError(`No es posible guardar la categoría porque ya existe otra con el nombre "${newCategory.name.trim()}".`);
            return;
        }
        if (isCategoryNameDropdownOpen) {
            alert("Por favor selecciona una categoría del listado o usa la opción de crear nueva.");
            return;
        }
    } else {
        const isDuplicate = categories.some(c => getBaseNormalized(c.name) === normalizedName && c.id !== editingCategory.id);
        if (isDuplicate) {
            setDuplicateError(`No es posible actualizar la categoría porque ya existe otra con el nombre "${newCategory.name.trim()}".`);
            return;
        }
    }

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        ...newCategory,
        updatedAt: new Date().toISOString()
      });
    } else {
      const itemToAdd: EquipmentCategory = {
        id: `cat-${Date.now()}`,
        ...newCategory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onAddCategory(itemToAdd);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingCategory(null);
    setNewCategory({
      name: '',
      itemType: '',
      description: '',
      image: ''
    });
  };

  const handleEdit = (item: EquipmentCategory) => {
    setEditingCategory(item);
    setNewCategory({
      name: item.name,
      itemType: item.itemType || '',
      description: item.description || '',
      image: item.image || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (item: EquipmentCategory) => {
    setCategoryToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const filteredCategoriesForDropdown = useMemo(() => {
     if (!newCategory.name.trim()) return [];
     return categories.filter(c => isSimilarCategory(newCategory.name, c.name) && getBaseNormalized(c.name) !== getBaseNormalized(newCategory.name));
  }, [categories, newCategory.name]);

  const filteredItemTypesForDropdown = useMemo(() => {
    if (!newCategory.itemType?.trim()) return itemTypes;
    return itemTypes.filter(t => isSimilarCategory(newCategory.itemType || '', t.name));
  }, [itemTypes, newCategory.itemType]);

  const handleAddSynonym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSynonymKey.trim() || !newSynonymValue.trim()) return;
    
    const key = newSynonymKey.trim().toLowerCase();
    const value = newSynonymValue.trim().toLowerCase();
    
    const updated = { ...synonymsState, [key]: value };
    setSynonymsState(updated);
    updateGlobalCategorySynonyms(updated);
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
    updateGlobalCategorySynonyms(updated);
    setSpecificSynonymKey('');
    setSpecificSynonymValue('');
  };

  const [synonymGroupToDelete, setSynonymGroupToDelete] = useState<string | null>(null);

  const handleSuggestSynonyms = async () => {
    if (!categoryForSynonyms) return;
    setIsSuggestingSynonyms(true);
    setSuggestedSynonyms([]);
    setSelectedSuggestions([]);
    
    const suggestions = await suggestSynonyms(categoryForSynonyms.name);
    const catName = getBaseNormalized(categoryForSynonyms.name);
    
    const existingKeys = Object.keys(synonymsState).filter(key => synonymsState[key] === catName);
    const filteredSuggestions = suggestions.filter(s => !existingKeys.includes(s));
    
    setSuggestedSynonyms(filteredSuggestions);
    setIsSuggestingSynonyms(false);
  };

  const toggleSuggestionSelection = (suggestion: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestion) 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    );
  };

  const handleAddSelectedSuggestions = () => {
    if (!categoryForSynonyms || selectedSuggestions.length === 0) return;
    
    const value = getBaseNormalized(categoryForSynonyms.name);
    const updated = { ...synonymsState };
    
    selectedSuggestions.forEach(key => {
      updated[key] = value;
    });
    
    setFormBases(value);

    setSynonymsState(updated);
    updateGlobalCategorySynonyms(updated);
    setSuggestedSynonyms([]);
    setSelectedSuggestions([]);
  };

  const setFormBases = (val: string) => {
      setSessionBases(prev => Array.from(new Set([...prev, val])));
  }

  const handleRemoveSynonym = (key: string) => {
    const updated = { ...synonymsState };
    delete updated[key];
    setSynonymsState(updated);
    updateGlobalCategorySynonyms(updated);
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
    updateGlobalCategorySynonyms(updated);
    setSynonymGroupToDelete(null);
  };

  const handleRemoveSynonymGroup = (baseWord: string) => {
    setSynonymGroupToDelete(baseWord);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const downloadURL = await uploadFile(file, 'equipment_categories');
      setNewCategory(prev => ({ ...prev, image: downloadURL }));
    } catch (error: any) {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen: " + (error?.message || "Revisa la consola"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Categorías de Equipos
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg border border-slate-200">{categories.length} Categorías</span>
          </h1>
          <p className="text-slate-500 text-sm">Gestiona las clasificaciones de tu maquinaria.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={async () => {
                const defaults = [
                  { name: "Demoledores", itemType: "Equipos" },
                  { name: "Concretadoras", itemType: "Equipos" },
                  { name: "Escaleras", itemType: "Equipos" },
                  { name: "Hidrolavadoras", itemType: "Equipos" },
                  { name: "Andamios de tijera", itemType: "Equipos" },
                  { name: "Andamios multidireccionales", itemType: "Equipos" },
                  { name: "Minicargadores", itemType: "Equipos" },
                  { name: "Excavadoras", itemType: "Equipos" },
                  { name: "Vibrocompactadores", itemType: "Equipos" },
                  { name: "Generadores de energia", itemType: "Equipos" },
                  { name: "Bombas de agua", itemType: "Equipos" },
                  { name: "Vehículos", itemType: "Vehículos" },
                ];
                for (const cat of defaults) {
                  const exists = categories.find(c => c.name === cat.name);
                  if (!exists) {
                    await onAddCategory({
                      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
                      name: cat.name,
                      itemType: cat.itemType,
                      description: 'Sin descripción'
                    });
                  }
                }
             }}
             className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
          >
            Añadir Categorías Faltantes
          </button>
          <button 
            onClick={() => setIsGlobalDictionaryModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95"
            title="Diccionario de Sinónimos"
          >
            <BookA size={18} />
            Diccionario
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-200 transition-all active:scale-95"
          >
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm px-2">
          <Search size={18} className="text-amber-500" />
          Buscador de Categorías
        </div>
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(cleanInput(e.target.value))}
            onBlur={(e) => setSearchTerm(e.target.value.trim())}
            placeholder="Buscar por nombre o descripción..."
            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="bg-white py-20 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Tags size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No se encontraron categorías</h3>
          <p className="text-slate-400 text-sm">Intenta ajustar tu búsqueda o crea una nueva.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <SortableHeader label="Nombre" sortKey="name" />
                  <SortableHeader label="Tipo de Artículo" sortKey="itemType" />
                  <SortableHeader label="Descripción" sortKey="description" />
                  <SortableHeader label="Equipos" sortKey="equipos" align="center" />
                  <SortableHeader label="Creación" sortKey="createdAt" />
                  <SortableHeader label="Actualización" sortKey="updatedAt" />
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCategories.map((item) => {
                  const categoryEquipment = equipment.filter(e => e.category === item.name);
                  const isExpanded = expandedCategory === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0 flex items-center justify-center">
                              {item.image ? (
                                <img src={item.image || undefined} alt={item.name} className="w-full h-full object-contain" />
                              ) : (
                                <Tags size={20} className="text-slate-300" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900">{item.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Hash size={10} /> {item.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Layers size={14} className="text-amber-500" />
                            <span className="text-xs font-bold text-slate-700">
                              {item.itemType || <span className="text-slate-400 italic">Sin tipo</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-600">
                            {item.description || <span className="text-slate-400 italic">Sin descripción</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : item.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isExpanded 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Package size={14} />
                            {categoryEquipment.length}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(item.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(item.updatedAt)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setCategoryForSynonyms(item);
                                setIsDictionaryModalOpen(true);
                              }} 
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                              title="Gestionar Sinónimos"
                            >
                              <BookA size={16} />
                            </button>
                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteRequest(item)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="pl-16 pr-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Package size={14} />
                                Equipos en esta categoría
                              </h4>
                              {categoryEquipment.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {categoryEquipment.map(eq => (
                                    <div key={eq.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-white shrink-0 flex items-center justify-center">
                                        {eq.image ? (
                                          <img src={eq.image || undefined} alt={eq.name} className="w-full h-full object-contain" />
                                        ) : (
                                          <Package size={16} className="text-slate-300" />
                                        )}
                                      </div>
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-slate-800 truncate">{eq.name}</span>
                                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                          <Hash size={10} /> {eq.id}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-dashed border-slate-200 text-center">
                                  No hay equipos asociados a esta categoría.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="relative" ref={categoryNameInputRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la Categoría</label>
                  <WordCasingAdjuster 
                    value={newCategory.name} 
                    onChange={(val) => setNewCategory(prev => ({...prev, name: val}))}
                    label="Categoría"
                  />
                </div>
                <div className="relative">
                  <Tags className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors ${isCategoryNameDropdownOpen ? 'text-amber-500' : ''}`} size={18} />
                  <input 
                    required 
                    readOnly={!!editingCategory}
                    value={newCategory.name} 
                    onChange={e => {
                      if (!editingCategory) {
                        const val = cleanInput(e.target.value);
                        setNewCategory({...newCategory, name: val});
                        setIsCategoryNameDropdownOpen(true);
                        setDuplicateError(null);
                      }
                    }} 
                    onBlur={(e) => {
                      if (!editingCategory) {
                        setNewCategory(prev => ({...prev, name: formatTitleCase(e.target.value.trim())}));
                      }
                    }}
                    onClick={() => {
                        if (editingCategory) {
                            setWizardName(newCategory.name);
                            setIsWizardOpen(true);
                        }
                    }}
                    onFocus={() => {
                        if (!editingCategory) setIsCategoryNameDropdownOpen(true);
                    }}
                    type="text" 
                    placeholder="Ej. Maquinaria Pesada" 
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all ${isCategoryNameDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : 'focus:ring-2 focus:ring-amber-500/20'} ${editingCategory ? 'cursor-pointer hover:bg-slate-100' : ''}`} 
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isCategoryNameDropdownOpen ? 'rotate-180' : ''} ${editingCategory ? 'hidden' : ''}`} size={16} />
                  {editingCategory && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md pointer-events-none">Editar</span>}
                </div>
                {isCategoryNameDropdownOpen && (filteredCategoriesForDropdown.length > 0 || (newCategory.name.trim() !== '' && !filteredCategoriesForDropdown.some(s => getBaseNormalized(s.name) === getBaseNormalized(newCategory.name)))) && !editingCategory && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 flex flex-col">
                      {filteredCategoriesForDropdown.map(c => (
                          <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                  setNewCategory({...newCategory, name: c.name});
                                  setIsCategoryNameDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex flex-col gap-1"
                          >
                              <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                          </button>
                      ))}
                      
                      {newCategory.name.trim() !== '' && !filteredCategoriesForDropdown.some(c => getBaseNormalized(c.name) === getBaseNormalized(newCategory.name)) && (
                          <button
                              type="button"
                              onClick={() => {
                                  setWizardName(newCategory.name.trim());
                                  setIsWizardOpen(true);
                                  setIsCategoryNameDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border-t border-amber-100 transition-colors flex items-center gap-2 font-bold text-sm"
                          >
                              <Plus size={16} className="text-amber-600" />
                              {editingCategory ? `Verificar Actualización "${newCategory.name.trim()}"` : `Verificar y Crear "${newCategory.name.trim()}"`}
                          </button>
                      )}
                  </div>
                )}
                {duplicateError && (
                    <div className="mt-2 text-rose-500 text-xs font-medium flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertTriangle size={14} />
                        {duplicateError}
                    </div>
                )}
              </div>

              <div className="relative" ref={itemTypeNameInputRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Artículo</label>
                  <WordCasingAdjuster 
                    value={newCategory.itemType || ''} 
                    onChange={(val) => setNewCategory(prev => ({...prev, itemType: val}))}
                    label="Tipo de Artículo"
                  />
                </div>
                <div className="relative">
                  <Layers className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors ${isItemTypeDropdownOpen ? 'text-amber-500' : ''}`} size={18} />
                  <input 
                    required 
                    value={newCategory.itemType || ''} 
                    onChange={e => {
                      const val = cleanInput(e.target.value);
                      setNewCategory({...newCategory, itemType: val});
                      setIsItemTypeDropdownOpen(true);
                    }} 
                    onBlur={(e) => {
                      setNewCategory(prev => ({...prev, itemType: formatTitleCase(e.target.value.trim())}));
                    }}
                    onFocus={() => setIsItemTypeDropdownOpen(true)}
                    onClick={() => setIsItemTypeDropdownOpen(true)}
                    type="text" 
                    placeholder="Ej. Herramientas Eléctricas" 
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700 transition-all ${isItemTypeDropdownOpen ? 'ring-4 ring-amber-500/10 border-amber-500 bg-white' : 'focus:ring-2 focus:ring-amber-500/20'}`} 
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform pointer-events-none ${isItemTypeDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                </div>
                {isItemTypeDropdownOpen && filteredItemTypesForDropdown.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 flex flex-col">
                      {filteredItemTypesForDropdown.map(t => (
                          <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                  setNewCategory({...newCategory, itemType: t.name});
                                  setIsItemTypeDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex flex-col gap-1"
                          >
                              <div className="font-bold text-slate-700 text-sm">{t.name}</div>
                          </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Imagen de Categoría</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {newCategory.image ? (
                      <>
                        <img src={newCategory.image || undefined} alt="Preview" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setNewCategory(prev => ({ ...prev, image: '' }))}
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
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Descripción (Opcional)</label>
                <textarea 
                  value={newCategory.description} 
                  onChange={e => setNewCategory({...newCategory, description: cleanInput(e.target.value)})} 
                  onBlur={(e) => setNewCategory(prev => ({...prev, description: e.target.value.trim()}))}
                  placeholder="Breve descripción de la categoría..." 
                  className="w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none min-h-[100px] resize-none" 
                />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all">{editingCategory ? 'Actualizar Categoría' : 'Guardar Categoría'}</button>
            </form>
          </div>
        </div>
      )}

      {isWizardOpen && (() => {
        const normWizardName = getBaseNormalized(wizardName);
        const exactCategory = categories.find(c => getBaseNormalized(c.name) === normWizardName && (!editingCategory || c.id !== editingCategory.id));
        const existsExactWizard = wizardName.trim() !== '' && !!exactCategory;
        
        const similarCategoryWizard = wizardName.trim() !== '' 
            ? categories.filter(c => c.name !== exactCategory?.name && (!editingCategory || c.id !== editingCategory.id) && isSimilarCategory(wizardName, c.name))
            : [];
            
        const existsSimilarWizard = wizardName.trim() !== '' && !existsExactWizard && similarCategoryWizard.length > 0;

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
                              {existsExactWizard ? 'Categoría Duplicada' : existsSimilarWizard ? 'Similitud Detectada' : (editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría')}
                          </h2>
                          <p className={`text-xs font-medium transition-colors ${existsExactWizard ? 'text-rose-600' : existsSimilarWizard ? 'text-amber-700' : 'text-slate-500'}`}>
                              {existsExactWizard ? 'Ya existe una categoría con nombre exacto' : 'Verifica que no exista antes de crearla'}
                          </p>
                       </div>
                   </div>
                   <button onClick={() => setIsWizardOpen(false)} className={`p-2 rounded-full transition-all ${existsExactWizard ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : existsSimilarWizard ? 'text-amber-500 hover:bg-amber-100 hover:text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div className="space-y-2">
                        <label className={`text-[10px] font-bold uppercase tracking-wider block ml-1 transition-colors ${existsExactWizard ? 'text-rose-500' : existsSimilarWizard ? 'text-amber-600' : 'text-slate-400'}`}>Nombre de la Categoría</label>
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
                            placeholder="Escribe el nombre de la categoría..."
                            autoFocus
                        />
                    </div>

                    {wizardName.trim() !== '' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">Categorías Similares Registradas</label>
                            {similarCategoryWizard.length > 0 ? (
                                <div className={`bg-slate-50 border rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar transition-colors ${existsExactWizard ? 'border-rose-100' : existsSimilarWizard ? 'border-amber-100' : 'border-slate-200'}`}>
                                    {similarCategoryWizard.map(s => {
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
                              setCategoryConfirmDialog({ isOpen: true, isSimilar: true });
                              return;
                          }
                          
                          setNewCategory({...newCategory, name: wizardName.trim()});
                          setIsWizardOpen(false);
                      }}
                      className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                          existsExactWizard
                          ? 'bg-rose-100 text-rose-400 shadow-none cursor-not-allowed'
                          : existsSimilarWizard
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200/50'
                      }`}
                   >
                       {existsSimilarWizard ? 'Usar este de todos modos' : (editingCategory ? 'Confirmar Actualización' : 'Confirmar y Usar')}
                   </button>
                </div>
            </div>
          </div>
        );
      })()}

      {categoryConfirmDialog.isOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">¿Estás seguro?</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">
                   Estás creando un equipo con nombre similar a uno que ya existe. ¿Deseas <span className="text-amber-600 font-bold">forzar la creación</span> o usar uno existente?
                </p>
                <div className="flex flex-col gap-2">
                   <button 
                      onClick={() => {
                          setNewCategory({...newCategory, name: wizardName.trim()});
                          setCategoryConfirmDialog({ isOpen: false });
                          setIsWizardOpen(false);
                      }}
                      className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                   >
                       Sí, forzar creación
                   </button>
                   <button 
                      onClick={() => setCategoryConfirmDialog({ isOpen: false })}
                      className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                   >
                       Regresar
                   </button>
                </div>
             </div>
          </div>
      )}

      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Categoría?</h2>
            <p className="text-slate-500 text-sm mb-6">
              Estás a punto de eliminar la categoría <span className="font-bold text-slate-700">{categoryToDelete.name}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setCategoryToDelete(null); }}
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

      {isGlobalDictionaryModalOpen && (
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
              <button onClick={() => setIsGlobalDictionaryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
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
                    onBlur={(e) => setNewSynonymKey(formatTitleCase(e.target.value.trim()))}
                    placeholder="Palabra original (ej. maquinaria pesada)"
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
                    onBlur={(e) => setNewSynonymValue(formatTitleCase(e.target.value.trim()))}
                    placeholder="Sinónimo (ej. equipo pesado)"
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
                         <th className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleDictSort('category')}>
                            <div className="flex items-center gap-1">
                               Categoría Asociada
                               {dictSortConfig.find(s => s.key === 'category') && (
                                  dictSortConfig.find(s => s.key === 'category')?.direction === 'asc' ? <ArrowUp size={12} className="text-amber-500" /> : <ArrowDown size={12} className="text-amber-500" />
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
                                     {item.category}
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
                onClick={() => setIsGlobalDictionaryModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dictionary Modal */}
      {isDictionaryModalOpen && categoryForSynonyms && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <BookA size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sinónimos</h2>
                  <p className="text-sm text-slate-500">Agrega palabras equivalentes para {categoryForSynonyms.name}.</p>
                </div>
              </div>
              <button onClick={() => {setIsDictionaryModalOpen(false); setCategoryForSynonyms(null);}} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
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
                    onBlur={(e) => setSpecificSynonymKey(formatTitleCase(e.target.value.trim()))}
                    placeholder={`Sinónimo (ej. maquinaria pesada)`}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all min-w-0"
                  />
                  <span className="hidden sm:flex items-center text-slate-300"><ArrowUpDown size={16} className="rotate-90" /></span>
                  <input
                    type="text"
                    value={specificSynonymValue}
                    onChange={(e) => setSpecificSynonymValue(cleanInput(e.target.value))}
                    placeholder="Significado (Categoría Base)"
                    className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl outline-none text-sm min-w-0 text-slate-500 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <button
                  type="submit"
                  disabled={!specificSynonymKey.trim() || !specificSynonymValue.trim()}
                  className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-amber-500/20"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Agregar</span>
                </button>
              </form>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Sinónimos Sugeridos (IA)</h3>
                <button 
                  onClick={handleSuggestSynonyms}
                  disabled={isSuggestingSynonyms}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSuggestingSynonyms ? <Loader2 size={14} className="animate-spin" /> : <BookA size={14} />}
                  Sugerir
                </button>
              </div>

              {suggestedSynonyms.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <div className="flex flex-wrap gap-2">
                    {suggestedSynonyms.map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => toggleSuggestionSelection(suggestion)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                          selectedSuggestions.includes(suggestion)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  {selectedSuggestions.length > 0 && (
                    <button
                      onClick={handleAddSelectedSuggestions}
                      className="mt-4 w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                    >
                      Agregar Seleccionados ({selectedSuggestions.length})
                    </button>
                  )}
                </div>
              )}

              <h3 className="text-sm font-bold text-slate-700 mb-4 mt-2">Sinónimos Actuales</h3>
              <div className="space-y-4">
                {(() => {
                  const catName = getBaseNormalized(categoryForSynonyms.name);
                  const catWords = catName.split(' ').filter(w => w.length > 2);
                  
                  const relevantBaseWords = new Set<string>(sessionBases);
                  
                  Object.entries(synonymsState).forEach(([key, valueRaw]) => {
                    const value = valueRaw as string;
                    if (
                      value === catName || 
                      key === catName || 
                      catWords.some(w => value === w || key === w) || 
                      catName.includes(value) || 
                      catName.includes(key)
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
                        <p>No hay sinónimos específicos registrados para esta categoría.</p>
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
                                  updateGlobalCategorySynonyms(updated);
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
                                   updateGlobalCategorySynonyms(updated);
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
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {setIsDictionaryModalOpen(false); setCategoryForSynonyms(null);}}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
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

export default EquipmentCategories;

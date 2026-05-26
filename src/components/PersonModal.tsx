import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  UserCircle, Plus, X, User, Briefcase, ChevronDown, Check, Building2,
  HardHat, MapPin, Phone, Mail, Trash2, Calendar, Clock
} from 'lucide-react';
import { Person, Company, ConstructionSite, ContactDetail } from '../types';
import { cleanInput, trimInput, formatTitleCase } from '../lib/utils';
import { WordCasingAdjuster } from './WordCasingAdjuster';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Person) => void;
  editingPerson?: Person | null;
  companies: Company[];
  sites: ConstructionSite[];
  fixedEntityId?: string;
  fixedLocationType?: 'Oficina' | 'Obra';
  fixedSiteId?: string;
  fixedStakeholderType?: 'Cliente' | 'Proveedor';
}

const PersonModal: React.FC<PersonModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingPerson, 
  companies, 
  sites,
  fixedEntityId,
  fixedLocationType,
  fixedSiteId,
  fixedStakeholderType
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    stakeholderType: fixedStakeholderType || 'Cliente',
    roles: [] as string[],
    entityId: fixedEntityId || '',
    locationType: fixedLocationType || 'Oficina',
    siteId: fixedSiteId || '',
    phones: [] as ContactDetail[],
    emails: [] as ContactDetail[],
    createdAt: '',
    updatedAt: ''
  });

  const [tempPhone, setTempPhone] = useState({ label: 'Móvil', value: '' });
  const [tempEmail, setTempEmail] = useState({ label: 'Trabajo', value: '' });
  
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);
  const siteDropdownRef = useRef<HTMLDivElement>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const availableRoles = [
    "Dueño / socio", "Gerente", "Director", "Almacenista", "Maestro de obra", "Siso", "Administrativo", "Contacto general", "Residente", "Ingeniero", "Arquitecto", "Facturación", "Representante legal"
  ];

  useEffect(() => {
    if (isOpen) {
      if (editingPerson) {
        setFormData({
          firstName: editingPerson.firstName,
          middleName: editingPerson.middleName || '',
          lastName: editingPerson.lastName,
          secondLastName: editingPerson.secondLastName || '',
          stakeholderType: editingPerson.stakeholderType,
          roles: editingPerson.roles,
          entityId: editingPerson.entityId || '',
          locationType: editingPerson.locationType || 'Oficina',
          siteId: editingPerson.siteId || '',
          phones: editingPerson.phones || [],
          emails: editingPerson.emails || [],
          createdAt: editingPerson.createdAt || '',
          updatedAt: editingPerson.updatedAt || ''
        });
        const entity = companies.find(c => c.id === editingPerson.entityId);
        setEntitySearch(entity?.name || '');
      } else {
        setFormData({
          firstName: '',
          middleName: '',
          lastName: '',
          secondLastName: '',
          stakeholderType: fixedStakeholderType || 'Cliente',
          roles: [],
          entityId: fixedEntityId || '',
          locationType: fixedLocationType || 'Oficina',
          siteId: fixedSiteId || '',
          phones: [],
          emails: [],
          createdAt: '',
          updatedAt: ''
        });
        
        if (fixedEntityId) {
          const entity = companies.find(c => c.id === fixedEntityId);
          setEntitySearch(entity?.name || '');
        } else {
          setEntitySearch('');
        }
      }
      setTempPhone({ label: 'Móvil', value: '' });
      setTempEmail({ label: 'Trabajo', value: '' });
      setIsRoleDropdownOpen(false);
      setIsEntityDropdownOpen(false);
      setIsSiteDropdownOpen(false);
    }
  }, [isOpen, editingPerson, fixedEntityId, fixedLocationType, fixedSiteId, fixedStakeholderType, companies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) setIsRoleDropdownOpen(false);
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(target)) setIsEntityDropdownOpen(false);
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(target)) setIsSiteDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSiteName = (siteId?: string) => {
    if (!siteId) return null;
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : null;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const entityOptions = useMemo(() => {
    let options: { id: string, name: string, status?: string }[] = [];
    if (formData.stakeholderType === 'Cliente') {
      options = companies.filter(c => c.roles.includes('Cliente')).map(c => ({ id: c.id, name: c.name, status: c.linkageStatus }));
    } else {
      options = companies.filter(c => c.roles.includes('Proveedor')).map(s => ({ id: s.id, name: s.name }));
    }
    return options.filter(opt => opt.name.toLowerCase().includes(entitySearch.toLowerCase()));
  }, [formData.stakeholderType, companies, entitySearch]);

  const siteOptions = useMemo(() => {
    if (formData.stakeholderType === 'Cliente' && formData.entityId) {
      return sites.filter(s => s.clientId === formData.entityId && s.status === 'Activa' && !s.isVirtualObra);
    } else {
      return sites.filter(s => s.status === 'Activa' && !s.isVirtualObra);
    }
  }, [sites, formData.stakeholderType, formData.entityId]);

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
      id: editingPerson ? editingPerson.id : `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...formData,
      firstName: trimInput(formData.firstName),
      middleName: trimInput(formData.middleName),
      lastName: trimInput(formData.lastName),
      secondLastName: trimInput(formData.secondLastName),
      phones: finalPhones,
      emails: finalEmails,
      siteId: formData.locationType === 'Oficina' ? undefined : formData.siteId,
      createdAt: editingPerson ? formData.createdAt : now,
      updatedAt: now
    };

    onSave(personData);
  };

  const getSelectedClientStatus = () => {
    if (formData.stakeholderType !== 'Cliente' || !formData.entityId) return null;
    const client = companies.find(c => c.id === formData.entityId && c.roles.includes('Cliente'));
    return client?.linkageStatus === 'Vinculado' ? 'Cliente Actual' : 'Prospecto';
  };

  const getSelectedSiteStatus = () => {
    if (formData.locationType !== 'Obra' || !formData.siteId) return null;
    const site = sites.find(s => s.id === formData.siteId);
    return site?.prospectStatus || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-visible animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    {editingPerson ? <User className="w-6 h-6" /> : <UserCircle size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{editingPerson ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
                    <p className="text-sm text-slate-500">{editingPerson ? 'Actualizando información' : 'Registrar nuevo contacto'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Primer Nombre</label>
                        <WordCasingAdjuster 
                            value={formData.firstName} 
                            onChange={(val) => setFormData({...formData, firstName: val})}
                            label="Nombre"
                        />
                    </div>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            required 
                            value={formData.firstName} 
                            onChange={(e) => setFormData({...formData, firstName: cleanInput(e.target.value)})} 
                            onBlur={(e) => setFormData({...formData, firstName: formatTitleCase(trimInput(e.target.value))})}
                            placeholder="Ej. Roberto" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700" 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Segundo Nombre</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={formData.middleName} 
                            onChange={(e) => setFormData({...formData, middleName: cleanInput(e.target.value)})} 
                            onBlur={(e) => setFormData({...formData, middleName: formatTitleCase(trimInput(e.target.value))})}
                            placeholder="Ej. Andrés" 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700" 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Primer Apellido</label>
                        <WordCasingAdjuster 
                            value={formData.lastName} 
                            onChange={(val) => setFormData({...formData, lastName: val})}
                            label="Apellido"
                        />
                    </div>
                    <div className="relative group">
                        <input 
                            type="text" 
                            required 
                            value={formData.lastName} 
                            onChange={(e) => setFormData({...formData, lastName: cleanInput(e.target.value)})} 
                            onBlur={(e) => setFormData({...formData, lastName: formatTitleCase(trimInput(e.target.value))})}
                            placeholder="Ej. Gómez" 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700" 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Segundo Apellido</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={formData.secondLastName} 
                            onChange={(e) => setFormData({...formData, secondLastName: cleanInput(e.target.value)})} 
                            onBlur={(e) => setFormData({...formData, secondLastName: formatTitleCase(trimInput(e.target.value))})}
                            placeholder="Ej. Pérez" 
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700" 
                        />
                    </div>
                </div>
            </div>

            {/* Tipo de Stakeholder (Tabs) */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Tipo de Contacto</label>
                <div className="grid grid-cols-2 gap-3">
                    {['Cliente', 'Proveedor'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            disabled={!!fixedStakeholderType}
                            onClick={() => {
                              if(fixedStakeholderType) return;
                              setFormData({...formData, stakeholderType: type as any, entityId: '', siteId: ''});
                              setEntitySearch('');
                            }}
                            className={`py-4 rounded-[1.25rem] font-bold text-sm transition-all border-2 ${formData.stakeholderType === type ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'} ${fixedStakeholderType ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selección de Empresa */}
            <div className="space-y-2 relative" ref={entityDropdownRef}>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  {formData.stakeholderType === 'Cliente' ? 'Empresa / Cliente' : 'Empresa / Proveedor'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                   <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={20} />
                   <input 
                      type="text" 
                      disabled={!!fixedEntityId}
                      placeholder={`Buscar ${formData.stakeholderType.toLowerCase()}...`}
                      value={entitySearch}
                      onFocus={() => { if(!fixedEntityId) setIsEntityDropdownOpen(true); }}
                      onChange={(e) => { setEntitySearch(cleanInput(e.target.value)); setIsEntityDropdownOpen(true); }}
                      onBlur={() => {
                         setTimeout(() => {
                            const selectedEntity = companies.find(c => c.id === formDataRef.current.entityId);
                            if (selectedEntity) {
                               setEntitySearch(selectedEntity.name);
                            } else {
                               setEntitySearch('');
                               setFormData(prev => ({...prev, entityId: '', siteId: ''}));
                            }
                         }, 200);
                      }}
                      className={`w-full pl-12 pr-10 py-4 bg-slate-50 border transition-all font-medium text-slate-700 rounded-[1.25rem] outline-none ${isEntityDropdownOpen ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' : 'border-slate-200 focus:bg-white'} ${fixedEntityId ? 'cursor-not-allowed bg-slate-100 opacity-80' : ''}`}
                   />
                   {!fixedEntityId && <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isEntityDropdownOpen ? 'rotate-180' : ''}`} size={20} />}
                </div>

                {isEntityDropdownOpen && !fixedEntityId && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                       {entityOptions.length > 0 ? (
                         entityOptions.map(opt => (
                           <button 
                             key={opt.id}
                             type="button"
                             onClick={() => {
                                setFormData({...formData, entityId: opt.id, siteId: ''});
                                setEntitySearch(opt.name);
                                setIsEntityDropdownOpen(false);
                             }}
                             className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                           >
                              <div className="font-bold text-slate-700 text-sm">{opt.name}</div>
                              {formData.stakeholderType === 'Cliente' && opt.status && (
                                 <div className={`text-[10px] uppercase font-bold mt-0.5 ${opt.status === 'Vinculado' ? 'text-green-600' : 'text-amber-600'}`}>
                                   {opt.status === 'Vinculado' ? 'Cliente Actual' : 'Prospecto'}
                                 </div>
                              )}
                           </button>
                         ))
                       ) : (
                         <div className="p-4 text-xs text-slate-400 italic text-center">No se encontraron resultados</div>
                       )}
                    </div>
                )}
            </div>

            {/* SECCIÓN DE TELÉFONOS MÚLTIPLES */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="flex items-center justify-between">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Teléfonos de Contacto</label>
                 <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{formData.phones.length} agregados</span>
               </div>
               
               <div className="space-y-2">
                  {formData.phones.map((phone, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                       <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Phone size={14} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{phone.label}</span>
                          <span className="text-sm font-semibold text-slate-700 block truncate">{phone.value}</span>
                       </div>
                       <button type="button" onClick={() => handleRemovePhone(idx)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>

               <div className="flex gap-2 items-center pt-2">
                  <select 
                    value={tempPhone.label}
                    onChange={(e) => setTempPhone({...tempPhone, label: e.target.value})}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-3 outline-none focus:border-emerald-500"
                  >
                    <option>Móvil</option>
                    <option>Oficina</option>
                    <option>Casa</option>
                    <option>Whatsapp</option>
                  </select>
                  <input 
                    type="text" 
                    value={tempPhone.value}
                    onChange={(e) => setTempPhone({...tempPhone, value: cleanInput(e.target.value)})}
                    onBlur={(e) => setTempPhone({...tempPhone, value: trimInput(e.target.value)})}
                    placeholder="Número..."
                    className="flex-1 bg-white border border-slate-200 text-sm rounded-xl px-3 py-3 outline-none focus:border-emerald-500 placeholder:text-slate-300"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddPhone}
                    className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
                    disabled={!tempPhone.value.trim()}
                  >
                    <Plus size={18} />
                  </button>
               </div>
            </div>

            {/* SECCIÓN DE CORREOS MÚLTIPLES */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="flex items-center justify-between">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Correos Electrónicos</label>
                 <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{formData.emails.length} agregados</span>
               </div>
               
               <div className="space-y-2">
                  {formData.emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Mail size={14} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{email.label}</span>
                          <span className="text-sm font-semibold text-slate-700 block truncate">{email.value}</span>
                       </div>
                       <button type="button" onClick={() => handleRemoveEmail(idx)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
               </div>

               <div className="flex gap-2 items-center pt-2">
                  <select 
                    value={tempEmail.label}
                    onChange={(e) => setTempEmail({...tempEmail, label: e.target.value})}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
                  >
                    <option>Trabajo</option>
                    <option>Personal</option>
                    <option>Facturación</option>
                    <option>Otro</option>
                  </select>
                  <input 
                    type="email" 
                    value={tempEmail.value}
                    onChange={(e) => setTempEmail({...tempEmail, value: cleanInput(e.target.value)})}
                    onBlur={(e) => setTempEmail({...tempEmail, value: trimInput(e.target.value)})}
                    placeholder="correo@ejemplo.com"
                    className="flex-1 bg-white border border-slate-200 text-sm rounded-xl px-3 py-3 outline-none focus:border-blue-500 placeholder:text-slate-300"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddEmail}
                    className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                    disabled={!tempEmail.value.trim()}
                  >
                    <Plus size={18} />
                  </button>
               </div>
            </div>

            {/* Ubicación: Oficina vs Obra */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Ubicación Operativa</label>
                <div className="flex bg-slate-100 p-1 rounded-[1.25rem]">
                    <button
                      type="button"
                      disabled={!!fixedLocationType}
                      onClick={() => setFormData({...formData, locationType: 'Oficina', siteId: ''})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.locationType === 'Oficina' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'} ${fixedLocationType ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <Briefcase size={16} /> Oficina
                    </button>
                    <button
                      type="button"
                      disabled={!!fixedLocationType}
                      onClick={() => setFormData({...formData, locationType: 'Obra'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.locationType === 'Obra' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'} ${fixedLocationType ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <HardHat size={16} /> Obra / Proyecto
                    </button>
                </div>
            </div>

            {/* Selector de Obra (Condicional) */}
            {formData.locationType === 'Obra' && (
              <div className="space-y-2 relative animate-in slide-in-from-top-2" ref={siteDropdownRef}>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Asignar Obra <span className="text-red-500">*</span></label>
                  
                  {!formData.entityId ? (
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic text-center">
                        Debes seleccionar una empresa primero para ver sus obras.
                     </div>
                  ) : (
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={20} />
                      <button
                          type="button"
                          disabled={!!fixedSiteId}
                          onClick={() => { if(!fixedSiteId) setIsSiteDropdownOpen(!isSiteDropdownOpen) }}
                          className={`w-full pl-12 pr-10 py-4 text-left bg-slate-50 border rounded-[1.25rem] outline-none transition-all font-medium text-slate-700 flex items-center justify-between ${isSiteDropdownOpen ? 'border-amber-500 bg-white ring-4 ring-amber-500/10' : 'border-slate-200 hover:bg-white'} ${fixedSiteId ? 'cursor-not-allowed opacity-80 bg-slate-100' : ''}`}
                      >
                          {formData.siteId ? getSiteName(formData.siteId) : 'Seleccionar obra...'}
                          {!fixedSiteId && <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isSiteDropdownOpen ? 'rotate-180' : ''}`} size={20} />}
                      </button>

                      {isSiteDropdownOpen && !fixedSiteId && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                            {siteOptions.length > 0 ? (
                              siteOptions.map(site => (
                                  <button
                                      key={site.id}
                                      type="button"
                                      onClick={() => {
                                          setFormData({...formData, siteId: site.id});
                                          setIsSiteDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center justify-between transition-colors ${formData.siteId === site.id ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                  >
                                      {site.name}
                                      {formData.siteId === site.id && <Check size={16} />}
                                  </button>
                              ))
                            ) : (
                              <div className="p-4 text-xs text-slate-400 italic text-center">No hay obras activas disponibles para esta empresa.</div>
                            )}
                          </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Roles */}
            <div className="space-y-2 relative" ref={roleDropdownRef}>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Cargos / Roles (Selección Múltiple) <span className="text-red-500">*</span></label>
                <div 
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className={`w-full min-h-[60px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-[1.25rem] cursor-pointer hover:bg-white transition-all flex flex-wrap gap-2 items-center ${isRoleDropdownOpen ? 'ring-4 ring-blue-500/10 border-blue-500 bg-white' : ''}`}
                >
                    {formData.roles.length === 0 && <span className="text-slate-300 font-medium ml-2">Seleccionar cargos...</span>}
                    {formData.roles.map(role => (
                        <span key={role} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            {role}
                            <X size={12} className="cursor-pointer hover:text-blue-900" onClick={(e) => { e.stopPropagation(); toggleRole(role); }} />
                        </span>
                    ))}
                     <div className="ml-auto"><ChevronDown className={`text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} size={20} /></div>
                </div>

                {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] p-2 animate-in fade-in slide-in-from-top-2">
                        {availableRoles.map(role => {
                            const isSelected = formData.roles.includes(role);
                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleRole(role);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {role}
                                    {isSelected && <Check size={18} />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* METADATA FECHAS (SOLO LECTURA) */}
            {editingPerson && (
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

            <div className="pt-4 flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-[1.25rem] hover:bg-slate-200 transition-all active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 px-8 py-4 bg-slate-900 text-white font-bold rounded-[1.25rem] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95">Guardar Contacto</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PersonModal;

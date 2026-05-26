import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Briefcase, Users, Truck, ArrowUpRight, Plus, Filter, TrendingUp, 
  Handshake, X, Sparkles, FileText, Download, Share2, Calendar, 
  Phone, Mail, MessageCircle, MapPin, CheckCircle2, Clock, 
  ChevronRight, User, History, BellRing, Target, Edit2, Building2, HardHat,
  AlertCircle, Check, ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpWideNarrow, SlidersHorizontal,
  ExternalLink, ChevronDown, Link, Smartphone, Upload, Image as ImageIcon, Mic, Paperclip, Trash2, Loader2
} from 'lucide-react';
import { Company, ViewType, Person, CommercialActivity, ConstructionSite, Attachment } from '../types';
import { getCommercialReport } from '../services/geminiService';
import { uploadFile } from '../services/firebaseService';
import { cleanInput, trimInput, formatTitleCase } from '../lib/utils';

interface CommercialManagementProps {
  companies: Company[];
  people: Person[];
  sites: ConstructionSite[];
  activities: CommercialActivity[];
  onAddActivity: (activity: CommercialActivity) => void;
  onUpdateActivity: (activity: CommercialActivity) => void;
  onDeleteActivity: (id: string) => void;
  setView: (view: ViewType) => void;
}

type SortOption = 'urgency-desc' | 'urgency-asc' | 'alpha-asc' | 'alpha-desc';

const CommercialManagement: React.FC<CommercialManagementProps> = ({ 
  companies, people, sites, activities, onAddActivity, onUpdateActivity, onDeleteActivity, setView 
}) => {
  // Pestaña por defecto: Seguimiento
  const [activeTab, setActiveTab] = useState<'seguimiento' | 'dashboard'>('seguimiento');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Estados para Modal de Nueva Interacción / Tarea
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estado para el Radar de Prioridad (Columna Derecha)
  const [radarView, setRadarView] = useState<'personas' | 'empresas' | 'obras'>('personas');
  const [radarSort, setRadarSort] = useState<SortOption>('urgency-desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  // --- NUEVO: Estados de Filtros del Radar ---
  // Filtros Personas
  const [radarPersonRole, setRadarPersonRole] = useState<string>('Todos los Cargos');
  const [radarPersonCompany, setRadarPersonCompany] = useState<string>('Todas Empresas');
  const [radarPersonSite, setRadarPersonSite] = useState<string>('Todas Obras');

  // Filtros Empresas
  const [radarClientStatus, setRadarClientStatus] = useState<'Todos' | 'Vinculado' | 'Potencial'>('Todos');

  // Filtros Obras
  const [radarSiteStatus, setRadarSiteStatus] = useState<'Todas' | 'Obra Cliente' | 'Obra Prospecto'>('Todas');

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados para el Dropdown con Buscador (Contacto)
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  // Modo del formulario: 'log' (registrar pasado) o 'schedule' (programar futuro)
  const [entryMode, setEntryMode] = useState<'log' | 'schedule'>('log'); 

  // --- NUEVO: Estado para modal de finalización de tarea ---
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<CommercialActivity | null>(null);
  const [completionData, setCompletionData] = useState({
    date: new Date().toISOString().split('T')[0],
    outcome: '',
    scheduleNext: false,
    nextDate: ''
  });

  // --- NUEVO: Estado para modal de historial completo ---
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Click Outside para cerrar dropdown de ordenamiento y de contacto
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setIsSortDropdownOpen(false);
      }
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(target)) {
        setIsContactDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lista de contactos filtrada para el formulario (Solo Clientes)
  const clientContacts = useMemo(() => {
    return people.filter(p => p.stakeholderType === 'Cliente');
  }, [people]);

  // Lista filtrada para el buscador del dropdown
  const filteredClientContacts = useMemo(() => {
    if (!contactSearch) return clientContacts;
    const term = contactSearch.toLowerCase();
    return clientContacts.filter(p => 
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
      (p.roles[0] || '').toLowerCase().includes(term)
    );
  }, [clientContacts, contactSearch]);

  // Listas para Dropdowns de Filtro (Personas)
  const uniqueRoles = useMemo(() => ['Todos los Cargos', ...Array.from(new Set(people.flatMap(p => p.roles)))], [people]);
  const uniqueCompanies = useMemo(() => ['Todas Empresas', ...Array.from(new Set(companies.filter(c => c.roles.includes('Cliente')).map(c => c.name)))], [companies]);
  const uniqueSites = useMemo(() => ['Todas Obras', ...Array.from(new Set(sites.filter(s => !s.isVirtualObra).map(s => s.name)))], [sites]);

  const [activityForm, setActivityForm] = useState({
    personId: '',
    type: 'Llamada' as 'Llamada' | 'Correo' | 'Reunión' | 'Visita Obra' | 'Whatsapp',
    date: new Date().toISOString().split('T')[0],
    scheduledDate: '', 
    time: '09:00',
    notes: '',
    scheduleNext: false,
    nextDate: '',
    attachments: [] as Attachment[]
  });

  const activityFormRef = useRef(activityForm);
  const contactSearchRef = useRef(contactSearch);

  useEffect(() => {
    activityFormRef.current = activityForm;
  }, [activityForm]);

  useEffect(() => {
    contactSearchRef.current = contactSearch;
  }, [contactSearch]);

  // --- Helper para calcular días ---
  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const date = new Date(dateStr);
    date.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const formatDaysAgo = (dateStr: string) => {
    const days = getDaysDiff(dateStr);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  };

  // --- Helper para obtener contexto (Empresa y Obra) ---
  const getContextInfo = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return { person: null, companyName: 'Desconocido', siteName: null, client: null, site: null };

    const entity = person.stakeholderType === 'Cliente'
        ? companies.find(c => c.id === person.entityId && c.roles.includes('Cliente'))
        : companies.find(s => s.id === person.entityId && s.roles.includes('Proveedor'));
    
    const site = person.siteId ? sites.find(s => s.id === person.siteId) : null;

    return {
        person,
        companyName: entity ? entity.name : 'Sin Empresa',
        siteName: site ? site.name : null,
        client: (person.stakeholderType === 'Cliente' && entity) ? entity : null,
        site: site
    };
  };

  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
    setIsLoadingReport(true);
    const clientsCount = companies.filter(c => c.roles.includes('Cliente')).length;
    const suppliersCount = companies.filter(c => c.roles.includes('Proveedor')).length;
    const recentActivity = companies.slice(0, 3).map(item => item.name).join(", ");
    const report = await getCommercialReport(clientsCount, suppliersCount, recentActivity);
    setReportContent(report);
    setIsLoadingReport(false);
  };

  // --- Lógica de Agenda (Seguimiento) ---
  const pendingActivities = useMemo(() => {
    return activities
      .filter(a => a.status === 'Pendiente')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activities]);

  const pastActivities = useMemo(() => {
    return activities
      .filter(a => a.status === 'Realizado')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);

  const getLastContact = (personId: string) => {
    const personActivities = activities
      .filter(a => a.personId === personId && a.status === 'Realizado')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return personActivities.length > 0 ? personActivities[0] : null;
  };

  // --- Helper de Ordenamiento ---
  const sortRadarItems = (a: any, b: any, type: 'person' | 'entity') => {
    if (radarSort === 'alpha-asc' || radarSort === 'alpha-desc') {
        const nameA = type === 'person' ? `${a.firstName} ${a.lastName}` : a.name;
        const nameB = type === 'person' ? `${b.firstName} ${b.lastName}` : b.name;
        return radarSort === 'alpha-asc' 
            ? nameA.localeCompare(nameB) 
            : nameB.localeCompare(nameA);
    }
    if (radarSort === 'urgency-desc') {
        return b.daysAgo - a.daysAgo;
    } else {
        return a.daysAgo - b.daysAgo;
    }
  };

  // --- Lógica del Radar de Prioridad (PERSONAS) ---
  const sortedPeople = useMemo(() => {
    return people
      .filter(p => p.stakeholderType === 'Cliente')
      .filter(p => {
          if (radarPersonRole !== 'Todos los Cargos' && !p.roles.includes(radarPersonRole)) return false;
          
          const entity = companies.find(c => c.id === p.entityId);
          if (radarPersonCompany !== 'Todas Empresas' && entity?.name !== radarPersonCompany) return false;

          const site = sites.find(s => s.id === p.siteId);
          if (radarPersonSite !== 'Todas Obras' && site?.name !== radarPersonSite) return false;

          return true;
      })
      .map(p => {
        const last = getLastContact(p.id);
        const entity = companies.find(c => c.id === p.entityId);
        return {
          ...p,
          companyName: entity?.name || 'Sin Empresa',
          lastDate: last ? last.date : null,
          daysAgo: last ? getDaysDiff(last.date) : 9999
        };
      })
      .sort((a, b) => sortRadarItems(a, b, 'person'));
  }, [people, activities, radarSort, radarPersonRole, radarPersonCompany, radarPersonSite, companies, sites]);

  // --- Lógica del Radar de Prioridad (EMPRESAS) ---
  const sortedClients = useMemo(() => {
    return companies.filter(c => c.roles.includes('Cliente'))
        .filter(c => radarClientStatus === 'Todos' || c.linkageStatus === radarClientStatus)
        .map(client => {
          const clientPeopleIds = people.filter(p => p.entityId === client.id).map(p => p.id);
          const clientActivities = activities
            .filter(a => clientPeopleIds.includes(a.personId) && a.status === 'Realizado')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          const lastDate = clientActivities.length > 0 ? clientActivities[0].date : null;
          
          return {
            ...client,
            contactName: client.contactPerson, // Asumiendo que hay un contacto principal
            lastDate,
            daysAgo: lastDate ? getDaysDiff(lastDate) : 9999
          };
        }).sort((a, b) => sortRadarItems(a, b, 'entity'));
  }, [companies, people, activities, radarSort, radarClientStatus]);

  // --- Lógica del Radar de Prioridad (OBRAS) ---
  const sortedSites = useMemo(() => {
    return sites
      .filter(s => s.status === 'Activa' || s.status === 'Pendiente de iniciar') 
      .filter(s => {
          if (radarSiteStatus === 'Todas') return true;
          return s.prospectStatus === radarSiteStatus;
      })
      .map(site => {
        const sitePeopleIds = people.filter(p => p.siteId === site.id).map(p => p.id);
        const siteActivities = activities
          .filter(a => sitePeopleIds.includes(a.personId) && a.status === 'Realizado')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const lastDate = siteActivities.length > 0 ? siteActivities[0].date : null;

        return {
          ...site,
          lastDate,
          daysAgo: lastDate ? getDaysDiff(lastDate) : 9999
        };
      }).sort((a, b) => sortRadarItems(a, b, 'entity'));
  }, [sites, people, activities, radarSort, radarSiteStatus]);

  const PriorityBadge = ({ daysAgo }: { daysAgo: number }) => {
    if (daysAgo === 9999) {
      return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 flex items-center gap-1"><AlertCircle size={10} /> Nunca contactado</span>;
    }
    if (daysAgo > 30) {
      return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 flex items-center gap-1"><AlertCircle size={10} /> {daysAgo} días sin contacto</span>;
    }
    if (daysAgo > 15) {
      return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1"><Clock size={10} /> {daysAgo} días sin contacto</span>;
    }
    return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1"><Check size={10} /> Al día ({daysAgo}d)</span>;
  };

  const handleEdit = (act: CommercialActivity) => {
    setEditingId(act.id);
    
    // Buscar la persona para setear el texto del buscador
    const person = people.find(p => p.id === act.personId);
    setContactSearch(person ? `${person.firstName} ${person.lastName}` : '');

    setActivityForm({
      personId: act.personId,
      type: act.type,
      date: act.date,
      scheduledDate: act.scheduledDate || '', 
      time: '09:00',
      notes: act.outcome || '',
      scheduleNext: false, 
      nextDate: act.nextFollowUp || '',
      attachments: act.attachments || []
    });
    setEntryMode(act.status === 'Realizado' ? 'log' : 'schedule');
    setIsActivityModalOpen(true);
    setIsHistoryModalOpen(false);
  };

  const handleOpenCompletion = (act: CommercialActivity) => {
    setCompletingTask(act);
    setCompletionData({
      date: new Date().toISOString().split('T')[0], 
      outcome: 'Tarea completada exitosamente.',
      scheduleNext: false,
      nextDate: ''
    });
    setIsCompletionModalOpen(true);
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    onUpdateActivity({
      ...completingTask,
      status: 'Realizado',
      date: completionData.date, 
      scheduledDate: completingTask.date, 
      outcome: completionData.outcome
    });

    if (completionData.scheduleNext && completionData.nextDate) {
        const followUp: CommercialActivity = {
          id: `act-fu-${Date.now()}`,
          personId: completingTask.personId,
          type: 'Llamada', 
          date: completionData.nextDate,
          status: 'Pendiente',
          outcome: ''
        };
        onAddActivity(followUp);
    }

    setIsCompletionModalOpen(false);
    setCompletingTask(null);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.personId) return;

    if (editingId) {
      const updatedActivity: CommercialActivity = {
        id: editingId,
        personId: activityForm.personId,
        type: activityForm.type,
        date: activityForm.date,
        scheduledDate: activityForm.scheduledDate,
        status: entryMode === 'log' ? 'Realizado' : 'Pendiente',
        outcome: activityForm.notes,
        attachments: activityForm.attachments,
        nextFollowUp: (entryMode === 'log' && activityForm.scheduleNext) ? activityForm.nextDate : undefined
      };
      
      onUpdateActivity(updatedActivity);

      if (entryMode === 'log' && activityForm.scheduleNext && activityForm.nextDate) {
         const followUp: CommercialActivity = {
            id: `act-fu-${Date.now()}`,
            personId: activityForm.personId,
            type: 'Llamada', 
            date: activityForm.nextDate,
            status: 'Pendiente'
          };
          onAddActivity(followUp);
      }

    } else {
      if (entryMode === 'log') {
        const newActivity: CommercialActivity = {
          id: `act-${Date.now()}`,
          personId: activityForm.personId,
          type: activityForm.type,
          date: activityForm.date,
          status: 'Realizado',
          outcome: activityForm.notes,
          attachments: activityForm.attachments,
          nextFollowUp: activityForm.scheduleNext ? activityForm.nextDate : undefined
        };
        onAddActivity(newActivity);

        if (activityForm.scheduleNext && activityForm.nextDate) {
          const followUp: CommercialActivity = {
            id: `act-fu-${Date.now()}`,
            personId: activityForm.personId,
            type: 'Llamada', 
            date: activityForm.nextDate,
            status: 'Pendiente'
          };
          onAddActivity(followUp);
        }
      } else {
        const scheduledTask: CommercialActivity = {
          id: `act-sch-${Date.now()}`,
          personId: activityForm.personId,
          type: activityForm.type,
          date: activityForm.date,
          status: 'Pendiente',
          outcome: activityForm.notes,
          attachments: activityForm.attachments 
        };
        onAddActivity(scheduledTask);
      }
    }

    setIsActivityModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setActivityForm({
      personId: '',
      type: 'Llamada',
      date: new Date().toISOString().split('T')[0],
      scheduledDate: '',
      time: '09:00',
      notes: '',
      scheduleNext: false,
      nextDate: '',
      attachments: []
    });
    setContactSearch(''); // Limpiar buscador
    setEntryMode('log');
    setEditingId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const filesToUpload = Array.from(e.target.files);
      
      try {
        const uploadedAttachments: Attachment[] = await Promise.all(
          filesToUpload.map(async (file: File) => {
            const downloadUrl = await uploadFile(file, 'attachments');
            let type: 'image' | 'audio' | 'document' = 'document';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('audio/')) type = 'audio';

            return {
              id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              type: type,
              url: downloadUrl,
              size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
            };
          })
        );

        setActivityForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedAttachments]
        }));
      } catch (error) {
        console.error("Error al subir archivos:", error);
        alert("Hubo un error al subir los archivos. Por favor intenta de nuevo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setActivityForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }));
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'Llamada': return Phone;
      case 'Correo': return Mail;
      case 'Reunión': return Users;
      case 'Visita Obra': return MapPin;
      case 'Whatsapp': return MessageCircle;
      default: return Briefcase;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Briefcase className="text-slate-400" size={28} />
            Gestión Comercial
          </h1>
          <p className="text-slate-500 text-sm">Convierte prospectos en obras activas.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('seguimiento')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'seguimiento' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
             <Target size={16} /> Seguimiento Clientes
           </button>
           <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
             <TrendingUp size={16} /> Dashboard KPIs
           </button>
        </div>
      </div>

      {/* --- PESTAÑA SEGUIMIENTO CLIENTES --- */}
      {activeTab === 'seguimiento' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Agenda y Próximos Pasos */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Botones de Acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button 
                onClick={() => { resetForm(); setEntryMode('log'); setIsActivityModalOpen(true); }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 text-left group"
               >
                 <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                 <div>
                   <span className="block font-bold text-slate-900">Registrar Interacción</span>
                   <span className="text-xs text-slate-500">Ya llamé o me reuní</span>
                 </div>
               </button>

               <button 
                onClick={() => { resetForm(); setEntryMode('schedule'); setIsActivityModalOpen(true); }}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-4 text-left group"
               >
                 <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                 <div>
                   <span className="block font-bold text-slate-900">Programar Tarea</span>
                   <span className="text-xs text-slate-500">Recordatorio futuro</span>
                 </div>
               </button>
            </div>

            {/* Lista de Tareas Pendientes (Agenda) */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 text-slate-50 opacity-50"><Target size={120} /></div>
               <div className="relative z-10">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <BellRing className="text-amber-500" size={20} />
                  Tareas Programadas
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full border border-slate-200">{pendingActivities.length}</span>
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendingActivities.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center text-slate-400 text-sm">
                      No hay tareas pendientes. ¡Programa seguimientos para vender más!
                    </div>
                  ) : (
                    pendingActivities.map(act => {
                      const { person, companyName, siteName } = getContextInfo(act.personId);
                      const ActIcon = getIconForType(act.type);
                      const lastInteraction = getLastContact(act.personId);

                      return (
                        <div key={act.id} className="bg-white text-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-amber-300 hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                               <ActIcon size={20} />
                             </div>
                             <div>
                               <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm">{act.type} con {person ? `${person.firstName} ${person.lastName}` : 'Desconocido'}</h4>
                                  {lastInteraction && (
                                    <span className="text-[9px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200" title={`Último contacto: ${lastInteraction.date}`}>
                                      {formatDaysAgo(lastInteraction.date)}
                                    </span>
                                  )}
                               </div>
                               <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 mb-1">
                                    <span className="flex items-center gap-1 font-semibold"><Building2 size={10} className="text-slate-400"/> {companyName}</span>
                                    {siteName && <span className="flex items-center gap-1"><HardHat size={10} className="text-amber-500"/> {siteName}</span>}
                               </div>

                               <p className="text-xs text-slate-500 flex items-center gap-1">
                                 <Clock size={12} /> Fecha límite: <span className="font-semibold text-rose-600">{act.date}</span>
                               </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(act)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Tarea"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                 if(window.confirm('¿Estás seguro de eliminar esta tarea programada?')) onDeleteActivity(act.id);
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar Tarea"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleOpenCompletion(act)}
                              className="px-4 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 border border-green-200"
                            >
                              <CheckCircle2 size={14} /> Listo
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
               </div>
            </div>
            
            {/* Historial Reciente */}
            <div className="pt-2">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="text-slate-400" size={20} />
                    Historial de Interacciones
                  </h3>
                  {pastActivities.length > 5 && (
                    <button 
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Ver todo el historial ({pastActivities.length})
                    </button>
                  )}
               </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                 {pastActivities.slice(0, 5).map((act, idx) => {
                    const { person, companyName, siteName } = getContextInfo(act.personId);
                    const ActIcon = getIconForType(act.type);
                    return (
                      <div key={act.id} className={`p-4 flex items-start gap-4 ${idx !== Math.min(pastActivities.length, 5) - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/50 transition-colors group`}>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ActIcon size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div>
                                 <span className="text-sm font-bold text-slate-700 block">{person ? `${person.firstName} ${person.lastName}` : 'Desconocido'}</span>
                                 <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                    <span className="flex items-center gap-1"><Building2 size={10} /> {companyName}</span>
                                    {siteName && <span className="flex items-center gap-1"><HardHat size={10} className="text-amber-500" /> {siteName}</span>}
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{act.date}</span>
                               <button 
                                onClick={() => handleEdit(act)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                                title="Editar Interacción"
                                >
                                 <Edit2 size={14} />
                               </button>
                             </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 italic">"{act.outcome || 'Sin notas'}"</p>
                          {act.attachments && act.attachments.length > 0 && (
                             <div className="flex gap-2 mt-2">
                                {act.attachments.map(att => (
                                   <a href={att.url} target="_blank" rel="noopener noreferrer" key={att.id} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                      <Paperclip size={10} /> {att.name}
                                   </a>
                                ))}
                             </div>
                          )}
                          {act.nextFollowUp && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                              <ArrowUpRight size={10} /> Seguimiento: {act.nextFollowUp}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                 })}
              </div>
            </div>
          </div>
          
          {/* Radar Priority (Derecha) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col">
              <div className="mb-4 space-y-3">
                 {/* Header Radar */}
                 <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Target className="text-rose-500" size={20} />
                    Radar de Prioridad
                  </h3>
                  
                  <div className="relative" ref={sortDropdownRef}>
                    <button onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                      <SlidersHorizontal size={18} />
                    </button>
                    {isSortDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-[50] py-1 animate-in fade-in zoom-in-95 duration-200">
                         <button onClick={() => { setRadarSort('urgency-desc'); setIsSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold ${radarSort === 'urgency-desc' ? 'text-rose-600' : 'text-slate-600'}`}>Mayor Tiempo Sin Contacto</button>
                         <button onClick={() => { setRadarSort('urgency-asc'); setIsSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold ${radarSort === 'urgency-asc' ? 'text-emerald-600' : 'text-slate-600'}`}>Menor Tiempo Sin Contacto</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs de Radar */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setRadarView('personas')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${radarView === 'personas' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Personas</button>
                  <button onClick={() => setRadarView('empresas')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${radarView === 'empresas' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Empresas</button>
                  <button onClick={() => setRadarView('obras')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${radarView === 'obras' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Obras</button>
                </div>

                {/* FILTROS DINÁMICOS POR PESTAÑA */}
                {radarView === 'personas' && (
                    <div className="grid grid-cols-1 gap-2">
                        <select 
                            value={radarPersonRole} 
                            onChange={(e) => setRadarPersonRole(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                        >
                            {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <select 
                                value={radarPersonCompany} 
                                onChange={(e) => setRadarPersonCompany(e.target.value)}
                                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                            >
                                {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                                value={radarPersonSite} 
                                onChange={(e) => setRadarPersonSite(e.target.value)}
                                className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                            >
                                {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {radarView === 'empresas' && (
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {['Todos', 'Vinculado', 'Potencial'].map(status => (
                            <button 
                                key={status} 
                                onClick={() => setRadarClientStatus(status as any)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${radarClientStatus === status ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}

                {radarView === 'obras' && (
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {['Todas', 'Obra Cliente', 'Obra Prospecto'].map(status => (
                            <button 
                                key={status} 
                                onClick={() => setRadarSiteStatus(status as any)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${radarSiteStatus === status ? 'bg-white shadow text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {status === 'Todas' ? 'Todas' : (status === 'Obra Cliente' ? 'De Clientes' : 'Prospectos')}
                            </button>
                        ))}
                    </div>
                )}

                <div className="text-[10px] text-slate-400 italic">Ordenado por tiempo sin contacto</div>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-2 max-h-[550px]">
                  
                  {/* LISTA PERSONAS */}
                  {radarView === 'personas' && sortedPeople.map(person => (
                       <div key={person.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-blue-500`}>
                            {person.firstName[0]}{person.lastName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{person.firstName} {person.lastName}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{person.companyName}</p>
                          </div>
                          <button onClick={() => { 
                              setEntryMode('schedule'); 
                              setActivityForm(prev => ({...prev, personId: person.id})); 
                              setContactSearch(`${person.firstName} ${person.lastName}`);
                              setIsActivityModalOpen(true); 
                            }} 
                            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-blue-600 hover:border-blue-200 transition-colors"
                          >
                            <Calendar size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                           <PriorityBadge daysAgo={person.daysAgo} />
                           <button onClick={() => { 
                              setEntryMode('log'); 
                              setActivityForm(prev => ({...prev, personId: person.id})); 
                              setContactSearch(`${person.firstName} ${person.lastName}`);
                              setIsActivityModalOpen(true); 
                            }} 
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                           >+ Registrar</button>
                        </div>
                      </div>
                  ))}

                  {/* LISTA EMPRESAS */}
                  {radarView === 'empresas' && sortedClients.map(client => (
                      <div key={client.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                             <Building2 size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{client.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{client.contactName || 'Sin contacto'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                           <PriorityBadge daysAgo={client.daysAgo} />
                           <button 
                             onClick={() => {
                                const contact = people.find(p => p.entityId === client.id);
                                resetForm();
                                if (contact) {
                                    setActivityForm(prev => ({...prev, personId: contact.id}));
                                    setContactSearch(`${contact.firstName} ${contact.lastName}`);
                                }
                                setEntryMode('schedule');
                                setIsActivityModalOpen(true);
                             }}
                             className="text-[10px] font-bold text-blue-600 hover:underline"
                           >
                             Programar
                           </button>
                        </div>
                      </div>
                  ))}

                  {/* LISTA OBRAS */}
                  {radarView === 'obras' && sortedSites.map(site => (
                      <div key={site.id} className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group bg-slate-50/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                             <HardHat size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{site.name}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <MapPin size={10} /> <span className="truncate">{site.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                           <PriorityBadge daysAgo={site.daysAgo} />
                           <button 
                             onClick={() => {
                                const contact = people.find(p => p.siteId === site.id);
                                resetForm();
                                if (contact) {
                                    setActivityForm(prev => ({...prev, personId: contact.id}));
                                    setContactSearch(`${contact.firstName} ${contact.lastName}`);
                                }
                                setEntryMode('schedule');
                                setIsActivityModalOpen(true);
                             }}
                             className="text-[10px] font-bold text-blue-600 hover:underline"
                           >
                             Programar
                           </button>
                        </div>
                      </div>
                  ))}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Actividad / Tarea REDISEÑADO */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Columna Izquierda: Formulario */}
            <div className="flex-1 flex flex-col min-h-0 bg-white relative z-10">
                <div className="p-8 pb-0 shrink-0">
                  <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Actividad' : 'Registrar Actividad'}</h2>
                  <p className="text-sm text-slate-500 font-medium">Modifica los detalles</p>
                </div>
                
                <form onSubmit={handleSaveActivity} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  
                  {/* Selector de Cliente / Contacto con Buscador */}
                  <div className="space-y-1.5 relative" ref={contactDropdownRef}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Cliente / Contacto <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={20} />
                        <input
                            type="text"
                            required
                            placeholder="Seleccionar Contacto..."
                            value={contactSearch}
                            onFocus={() => setIsContactDropdownOpen(true)}
                            onChange={(e) => {
                                setContactSearch(cleanInput(e.target.value));
                                setIsContactDropdownOpen(true);
                                if(e.target.value === '') setActivityForm(prev => ({...prev, personId: ''}));
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    const val = formatTitleCase(trimInput(contactSearchRef.current));
                                    const exists = clientContacts.some(p => `${p.firstName} ${p.lastName}` === val);
                                    if (!exists || !activityFormRef.current.personId) {
                                        setContactSearch('');
                                        setActivityForm(prev => ({...prev, personId: ''}));
                                    } else {
                                        setContactSearch(val);
                                    }
                                }, 200);
                            }}
                            className={`w-full pl-12 pr-10 py-4 bg-slate-50 border rounded-xl outline-none text-sm font-semibold text-slate-700 transition-all ${isContactDropdownOpen ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' : 'border-slate-200 hover:bg-white focus:bg-white'}`}
                        />
                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-transform pointer-events-none ${isContactDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                        
                        {isContactDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
                                {filteredClientContacts.length > 0 ? (
                                    filteredClientContacts.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setActivityForm(prev => ({...prev, personId: p.id}));
                                                setContactSearch(`${p.firstName} ${p.lastName}`);
                                                setIsContactDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-700 text-sm">{p.firstName} {p.lastName}</div>
                                            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{p.roles[0]}</div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-xs text-slate-400 italic text-center">
                                        No se encontraron contactos.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo Acción</label>
                      <div className="relative">
                          <select value={activityForm.type} onChange={(e) => setActivityForm({...activityForm, type: e.target.value as any})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 appearance-none">
                            {['Llamada', 'Correo', 'Reunión', 'Visita Obra', 'Whatsapp'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha Programada</label>
                      <input type="date" required value={activityForm.date} onChange={(e) => setActivityForm({...activityForm, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notas de Preparación / Objetivo</label>
                    <textarea rows={3} value={activityForm.notes} onChange={(e) => setActivityForm({...activityForm, notes: cleanInput(e.target.value)})} onBlur={(e) => setActivityForm({...activityForm, notes: trimInput(e.target.value)})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium resize-none placeholder:text-slate-300" placeholder="Escribe los detalles..." />
                  </div>

                  {/* SECCIÓN DE ADJUNTOS CON UPLOAD REAL */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Paperclip size={12}/> Adjuntar Evidencia
                      </label>
                      
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group bg-slate-50/50">
                          <input 
                              type="file" 
                              multiple 
                              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                              onChange={handleFileUpload} 
                              disabled={isUploading}
                          />
                          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-amber-500 transition-colors">
                              {isUploading ? (
                                <>
                                  <Loader2 size={24} className="animate-spin text-amber-500" />
                                  <p className="text-xs font-bold text-amber-500">Subiendo archivos...</p>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                      <Upload size={18} />
                                  </div>
                                  <div>
                                      <p className="text-xs font-bold text-slate-600">Arrastra archivos o haz clic para subir</p>
                                      <p className="text-[10px] text-slate-400">Imágenes, Audios, PDFs</p>
                                  </div>
                                </>
                              )}
                          </div>
                      </div>

                      {/* Lista de Archivos */}
                      {activityForm.attachments.length > 0 && (
                          <div className="space-y-2">
                              {activityForm.attachments.map(file => (
                                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                              <FileText size={18} />
                                          </div>
                                          <div className="min-w-0">
                                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-800 truncate hover:text-blue-600 hover:underline block">{file.name}</a>
                                              <span className="text-[10px] text-slate-400">{file.size}</span>
                                          </div>
                                      </div>
                                      <button type="button" onClick={() => removeAttachment(file.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="pt-4 mt-auto">
                    <button type="submit" disabled={isUploading} className="w-full py-4 text-white font-bold rounded-2xl shadow-xl shadow-amber-100 bg-amber-500 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 text-base">
                      {isUploading ? 'Subiendo...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
            </div>

            {/* Columna Derecha: Panel de Contexto (Sidebar) */}
            <div className="hidden md:flex w-[320px] bg-white border-l border-slate-100 flex-col shrink-0">
               <div className="p-4 flex justify-end">
                  <button onClick={() => { setIsActivityModalOpen(false); resetForm(); }} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
               </div>
               
               <div className="flex-1 px-6 py-2 space-y-8 overflow-y-auto custom-scrollbar">
                   {/* Context Information */}
                   {(() => {
                      const { person, companyName, siteName, client } = getContextInfo(activityForm.personId || '');
                      
                      if (!person) return <div className="text-center text-slate-300 text-xs italic mt-10">Selecciona un contacto para ver información detallada.</div>;

                      return (
                         <>
                            {/* Cliente / Empresa */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-400 px-1">
                                    <Building2 size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Cliente / Empresa</span>
                                </div>
                                <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                    <p className="font-bold text-slate-800 text-sm mb-2">{companyName}</p>
                                    {client?.linkageStatus && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 tracking-wider`}>
                                            {client.linkageStatus}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info Obra */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-400 px-1">
                                    <HardHat size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Info Obra</span>
                                </div>
                                {siteName ? (
                                    <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                                        <p className="font-bold text-slate-800 text-sm mb-1">{siteName}</p>
                                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold">Obra Asignada</span>
                                    </div>
                                ) : (
                                    <div className="p-5 border-2 border-dashed border-slate-100 rounded-2xl text-center bg-slate-50/30">
                                        <span className="text-xs text-slate-400 italic font-medium">No tiene obra asignada</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Contacto */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-400 px-1">
                                    <Smartphone size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Info Contacto</span>
                                </div>
                                <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] space-y-4">
                                    {person.phones && person.phones.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                                <Phone size={14} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">{person.phones[0].label}</span>
                                                <span className="text-sm font-bold text-slate-700 block">{person.phones[0].value}</span>
                                            </div>
                                        </div>
                                    )}
                                    {person.emails && person.emails.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Mail size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase block">{person.emails[0].label}</span>
                                                <span className="text-sm font-bold text-slate-700 block truncate">{person.emails[0].value}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                         </>
                      );
                   })()}
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Finalizar Tarea (NUEVO) */}
      {isCompletionModalOpen && completingTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Verde */}
            <div className="bg-emerald-50 p-8 text-center border-b border-emerald-100">
               <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                  <CheckCircle2 size={32} strokeWidth={2.5} />
               </div>
               <h2 className="text-2xl font-bold text-emerald-900">Finalizar Tarea</h2>
               <p className="text-emerald-700/80 font-medium mt-1">¿Cuándo completaste esta actividad?</p>
            </div>

            <form onSubmit={handleConfirmCompletion} className="p-8 space-y-6">
               
               {/* Resumen Tarea */}
               <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                      {completingTask.type} con {getContextInfo(completingTask.personId).person?.firstName}
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 italic text-sm">
                      "{completingTask.outcome || 'Sin detalles previos'}"
                  </div>
               </div>

               {/* Fecha Realización */}
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha de Realización</label>
                  <input 
                    type="date" 
                    required 
                    value={completionData.date} 
                    onChange={(e) => setCompletionData({...completionData, date: e.target.value})} 
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold text-slate-700" 
                  />
               </div>

               {/* Resultado */}
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Resultado / Notas Finales</label>
                  <textarea 
                    rows={2} 
                    value={completionData.outcome} 
                    onChange={(e) => setCompletionData({...completionData, outcome: cleanInput(e.target.value)})} 
                    onBlur={(e) => setCompletionData({...completionData, outcome: trimInput(e.target.value)})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium resize-none placeholder:text-slate-300"
                    placeholder="Ej. Tarea completada exitosamente."
                  />
               </div>

               {/* Programar Próximo Contacto (Caja Amarilla/Naranja clara como en imagen) */}
               <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3 transition-all">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={completionData.scheduleNext} 
                        onChange={(e) => setCompletionData({...completionData, scheduleNext: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 transition-all cursor-pointer"
                      />
                      <span className="text-sm font-bold text-amber-800 group-hover:text-amber-900 transition-colors">Programar Próximo Contacto</span>
                   </label>
                   
                   {completionData.scheduleNext && (
                      <div className="pt-2 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-1.5 block">Fecha Siguiente Acción</label>
                          <input 
                            type="date" 
                            required={completionData.scheduleNext}
                            value={completionData.nextDate} 
                            onChange={(e) => setCompletionData({...completionData, nextDate: e.target.value})} 
                            className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-bold text-slate-700" 
                          />
                      </div>
                   )}
               </div>

               {/* Botones */}
               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsCompletionModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">Confirmar</button>
               </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Historial Completo */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
               <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <History className="text-slate-400" size={24} />
                    Historial Completo
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">{pastActivities.length} interacciones registradas</p>
               </div>
               <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {pastActivities.map((act, idx) => {
                    const { person, companyName, siteName } = getContextInfo(act.personId);
                    const ActIcon = getIconForType(act.type);
                    return (
                      <div key={act.id} className={`p-6 flex items-start gap-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group`}>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-1">
                          <ActIcon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <div>
                                 <span className="text-sm font-bold text-slate-800 block">{person ? `${person.firstName} ${person.lastName}` : 'Desconocido'}</span>
                                 <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1 font-semibold"><Building2 size={12} className="text-slate-400"/> {companyName}</span>
                                    {siteName && <span className="flex items-center gap-1"><HardHat size={12} className="text-amber-500" /> {siteName}</span>}
                                 </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{act.date}</span>
                               <button 
                                onClick={() => handleEdit(act)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar Interacción"
                                >
                                 <Edit2 size={16} />
                               </button>
                             </div>
                          </div>
                          
                          <div className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                            {act.outcome || <span className="italic text-slate-400">Sin notas registradas</span>}
                          </div>

                          {act.attachments && act.attachments.length > 0 && (
                             <div className="flex gap-2 mt-3 flex-wrap">
                                {act.attachments.map(att => (
                                   <a href={att.url} target="_blank" rel="noopener noreferrer" key={att.id} className="flex items-center gap-1.5 text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm">
                                      <Paperclip size={12} /> {att.name}
                                   </a>
                                ))}
                             </div>
                          )}
                          
                          {act.nextFollowUp && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                              <ArrowUpRight size={14} /> Seguimiento Programado: {act.nextFollowUp}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                 })}
                 {pastActivities.length === 0 && (
                    <div className="p-10 text-center text-slate-400">No hay historial disponible.</div>
                 )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialManagement;

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './views/Login';
import { AuthGuard } from './components/AuthGuard';

const AppRoutes = ({ itemTypes, companies, sites, equipment, categories, people, activities, orders, handleAddSite, handleUpdateSite, handleDeleteSite, handleAddEquipment, handleUpdateEquipment, handleDeleteEquipment, handleAddCategory, handleUpdateCategory, handleDeleteCategory, handleAddPerson, handleUpdatePerson, handleDeletePerson, handleAddActivity, handleUpdateActivity, handleDeleteActivity, handleAddItemType, handleUpdateItemType, handleDeleteItemType }: any) => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location };

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AuthGuard><Layout><Dashboard companies={companies} sites={sites} equipment={equipment} orders={orders} /></Layout></AuthGuard>} />
        <Route path="/comercial" element={<AuthGuard requiredPermission="VER_COMERCIAL"><Layout><CommercialManagement companies={companies} people={people} sites={sites} activities={activities} onAddActivity={handleAddActivity} onUpdateActivity={handleUpdateActivity} onDeleteActivity={handleDeleteActivity} /></Layout></AuthGuard>} />
        <Route path="/obras" element={<AuthGuard requiredPermission="VER_OBRAS"><Layout><SitesView sites={sites} companies={companies} people={people} onAddSite={handleAddSite} onUpdateSite={handleUpdateSite} onDeleteSite={handleDeleteSite} onAddPerson={handleAddPerson} /></Layout></AuthGuard>} />
        <Route path="/empresas" element={<AuthGuard requiredPermission="VER_EMPRESAS"><Layout><CompaniesView companies={companies} people={people} onAddPerson={handleAddPerson} /></Layout></AuthGuard>} />
        <Route path="/contactos" element={<AuthGuard requiredPermission="VER_CONTACTOS"><Layout><PeopleView people={people} companies={companies} sites={sites} onAddPerson={handleAddPerson} onUpdatePerson={handleUpdatePerson} onDeletePerson={handleDeletePerson} /></Layout></AuthGuard>} />
        <Route path="/equipos" element={<AuthGuard requiredPermission="VER_EQUIPOS"><Layout><EquipmentList equipment={equipment} categories={categories} itemTypes={itemTypes} companies={companies} onAddEquipment={handleAddEquipment} onUpdateEquipment={handleUpdateEquipment} onDeleteEquipment={handleDeleteEquipment} /></Layout></AuthGuard>} />
        <Route path="/categorias" element={<AuthGuard requiredPermission="VER_EQUIPOS"><Layout><EquipmentCategories categories={categories} equipment={equipment} itemTypes={itemTypes} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} /></Layout></AuthGuard>} />
        <Route path="/tipos-articulos" element={<AuthGuard requiredPermission="VER_EQUIPOS"><Layout><ItemTypesView itemTypes={itemTypes} equipment={equipment} onAddItemType={handleAddItemType} onUpdateItemType={handleUpdateItemType} onDeleteItemType={handleDeleteItemType} /></Layout></AuthGuard>} />
        <Route path="/operaciones" element={<AuthGuard requiredPermission="VER_OPERACIONES"><Layout><OperationsView /></Layout></AuthGuard>} />
        <Route path="/pedidos" element={<AuthGuard requiredPermission="VER_PEDIDOS"><Layout><PruebaApp realCompanies={companies} realSites={sites} realEquipment={equipment} realCategories={categories} /></Layout></AuthGuard>} />
        <Route path="/mantenimiento" element={<AuthGuard requiredPermission="VER_MANTENIMIENTO"><Layout><PruebaApp realCompanies={companies} realSites={sites} realEquipment={equipment} realCategories={categories} /></Layout></AuthGuard>} />
        <Route path="/compras" element={<AuthGuard requiredPermission="VER_COMPRAS"><Layout><PurchasesView /></Layout></AuthGuard>} />
        <Route path="/rrhh" element={<AuthGuard requiredPermission="VER_RRHH"><Layout><HumanResourcesView /></Layout></AuthGuard>} />
        <Route path="/ajustes/roles" element={<AuthGuard requiredPermission="GESTIONAR_ROLES"><Layout><RolesView /></Layout></AuthGuard>} />
        <Route path="/pagos" element={<AuthGuard requiredPermission="VER_PAGOS"><Layout><PaymentsView /></Layout></AuthGuard>} />
        <Route path="/cartera" element={<AuthGuard requiredPermission="VER_CARTERA"><Layout><PortfolioView /></Layout></AuthGuard>} />
        <Route path="/juridica" element={<AuthGuard requiredPermission="VER_JURIDICA"><Layout><LegalView /></Layout></AuthGuard>} />
        <Route path="/papelera" element={<AuthGuard requiredPermission="VER_PAPELERA"><Layout><RecycleBinView /></Layout></AuthGuard>} />
        <Route path="/prueba-app" element={<AuthGuard><Layout><PruebaApp realCompanies={companies} realSites={sites} realEquipment={equipment} realCategories={categories} /></Layout></AuthGuard>} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/pedidos" element={<AuthGuard requiredPermission="VER_PEDIDOS"><Layout><PruebaApp realCompanies={companies} realSites={sites} realEquipment={equipment} realCategories={categories} asModal={true} /></Layout></AuthGuard>} />
          <Route path="/mantenimiento" element={<AuthGuard requiredPermission="VER_MANTENIMIENTO"><Layout><PruebaApp realCompanies={companies} realSites={sites} realEquipment={equipment} realCategories={categories} asModal={true} /></Layout></AuthGuard>} />
        </Routes>
      )}
    </>
  );
};

import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import EquipmentList, { setDynamicSynonyms } from './views/EquipmentList';
import EquipmentCategories from './views/EquipmentCategories';
import ItemTypesView from './views/ItemTypesView';
import SitesView from './views/SitesView';
import CommercialManagement from './views/CommercialManagement';
import PeopleView from './views/PeopleView';
import OperationsView from './views/OperationsView';
import HumanResourcesView from './views/HumanResourcesView';
import PortfolioView from './views/PortfolioView';
import LegalView from './views/LegalView';
import PurchasesView from './views/PurchasesView';
import PaymentsView from './views/PaymentsView';
import CompaniesView from './views/CompaniesView';
import PruebaApp from './views/OrdersAndMaintenance';
import RecycleBinView from './views/RecycleBinView';
import RolesView from './views/RolesView';
import { ConstructionSite, Equipment, Person, CommercialActivity, EquipmentCategory, Company, Order, ItemType } from './types';
import { subscribeToCollection, saveItem, deleteItem, seedDatabase, propagateEquipmentNameChange } from './services/firebaseService';
import { Database, UploadCloud, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './services/firebaseConfig';
import { OrdersProvider } from './context/OrdersContext';

const App: React.FC = () => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado centralizado - Inicialmente vacío, se llena desde Firestore
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<ConstructionSite[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activities, setActivities] = useState<CommercialActivity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);


  // Efecto para conectar con Firestore
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      setCompanies([]);
      setSites([]);
      setEquipment([]);
      setCategories([]);
      setItemTypes([]);
      setPeople([]);
      setActivities([]);
      setOrders([]);
      return;
    }

    setIsLoading(true);
    
    // Suscripciones a todas las colecciones
    const unsubCompanies = subscribeToCollection('companies', (data) => {
      console.log('Main App: Companies updated:', data.length);
      setCompanies(data as Company[]);
    });
    const unsubSites = subscribeToCollection('sites', (data) => {
      console.log('Main App: Sites updated:', data.length);
      setSites(data as ConstructionSite[]);
    });
    const unsubEquipment = subscribeToCollection('equipment', (data) => setEquipment(data as Equipment[]));
    const unsubCategories = subscribeToCollection('equipmentCategories', (data) => setCategories(data as EquipmentCategory[]));
    const unsubItemTypes = subscribeToCollection('itemTypes', (data) => setItemTypes(data as ItemType[]));
    const unsubPeople = subscribeToCollection('people', (data) => setPeople(data as Person[]));
    const unsubActivities = subscribeToCollection('activities', (data) => setActivities(data as CommercialActivity[]));
    const unsubOrders = subscribeToCollection('orders', (data) => setOrders(data as Order[]));

    const unsubDictionary = onSnapshot(doc(db, 'settings', 'equipmentDictionary'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().synonyms || {};
        setDynamicSynonyms(data);
      }
    });

    // Simular un pequeño tiempo de carga inicial para la UI
    const timer = setTimeout(() => setIsLoading(false), 1000);

    return () => {
      unsubCompanies();
      unsubSites();
      unsubEquipment();
      unsubCategories();
      unsubItemTypes();
      unsubPeople();
      unsubActivities();
      unsubOrders();
      unsubDictionary();
      clearTimeout(timer);
    };
  }, [currentUser]);

  // Handlers ahora llaman al servicio de Firestore
  const handleAddSite = (site: ConstructionSite) => saveItem('sites', site);
  const handleUpdateSite = (updatedSite: ConstructionSite) => saveItem('sites', updatedSite);
  const handleDeleteSite = (id: string) => deleteItem('sites', id);

  const handleAddEquipment = (item: Equipment) => saveItem('equipment', item);
  const handleUpdateEquipment = async (updatedEquipment: Equipment) => {
    const oldEquipment = equipment.find(e => e.id === updatedEquipment.id);
    await saveItem('equipment', updatedEquipment);
    if (oldEquipment && oldEquipment.name !== updatedEquipment.name) {
      await propagateEquipmentNameChange(oldEquipment.name, updatedEquipment.name);
    }
  };
  const handleDeleteEquipment = (id: string) => deleteItem('equipment', id);

  const handleAddCategory = (category: EquipmentCategory) => saveItem('equipmentCategories', category);
  const handleUpdateCategory = (updatedCategory: EquipmentCategory) => saveItem('equipmentCategories', updatedCategory);
  const handleDeleteCategory = (id: string) => deleteItem('equipmentCategories', id);

  const handleAddItemType = (itemType: ItemType) => saveItem('itemTypes', itemType);
  const handleUpdateItemType = (updatedItemType: ItemType) => saveItem('itemTypes', updatedItemType);
  const handleDeleteItemType = (id: string) => deleteItem('itemTypes', id);

  const handleAddPerson = (person: Person) => saveItem('people', person);
  const handleUpdatePerson = (updatedPerson: Person) => saveItem('people', updatedPerson);
  const handleDeletePerson = (id: string) => deleteItem('people', id);

  const handleAddActivity = (activity: CommercialActivity) => saveItem('activities', activity);
  const handleUpdateActivity = (updatedActivity: CommercialActivity) => saveItem('activities', updatedActivity);
  const handleDeleteActivity = (id: string) => deleteItem('activities', id);

  // Pantalla de Carga Inicial
  if (isAuthLoading || (currentUser && isLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-amber-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando con la nube...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes 
        itemTypes={itemTypes}
          companies={companies} 
          sites={sites} 
          equipment={equipment} 
          categories={categories} 
          people={people} 
          activities={activities} 
          orders={orders} 
          handleAddSite={handleAddSite} 
          handleUpdateSite={handleUpdateSite} 
          handleDeleteSite={handleDeleteSite} 
          handleAddEquipment={handleAddEquipment} 
          handleUpdateEquipment={handleUpdateEquipment} 
          handleDeleteEquipment={handleDeleteEquipment} 
          handleAddCategory={handleAddCategory} 
          handleUpdateCategory={handleUpdateCategory} 
          handleDeleteCategory={handleDeleteCategory} 
          handleAddItemType={handleAddItemType}
          handleUpdateItemType={handleUpdateItemType}
          handleDeleteItemType={handleDeleteItemType}
          handleAddPerson={handleAddPerson} 
          handleUpdatePerson={handleUpdatePerson} 
          handleDeletePerson={handleDeletePerson} 
          handleAddActivity={handleAddActivity} 
          handleUpdateActivity={handleUpdateActivity} 
        handleDeleteActivity={handleDeleteActivity} 
      />
    </BrowserRouter>
  );
};

export default App;
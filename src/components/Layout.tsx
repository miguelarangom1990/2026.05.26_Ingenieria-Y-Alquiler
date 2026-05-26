
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  HardHat, 
  Truck, 
  Users, 
  Construction, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  ChevronDown,
  Users2,
  UserCircle,
  ClipboardList,
  UserCog,
  Wallet,
  Scale,
  ShoppingBag,
  CreditCard,
  Tags,
  Building2,
  Layers,
  Wrench,
  Trash2,
  LogOut,
  Shield
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userData, userRole, logout, hasPermission, viewingAsRole, setViewAsRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStakeholdersOpen, setIsStakeholdersOpen] = useState(false);
  const [isEquiposOpen, setIsEquiposOpen] = useState(false);
  const [isOperacionesOpen, setIsOperacionesOpen] = useState(false);
  const [isAdministracionOpen, setIsAdministracionOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const sidebarRef = useRef<HTMLElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);

  // Asegurar que el menú activo esté abierto y los demás cerrados
  useEffect(() => {
    if (['/obras', '/empresas', '/contactos'].includes(currentPath)) {
      setIsStakeholdersOpen(true);
      setIsEquiposOpen(false);
      setIsOperacionesOpen(false);
    } else if (['/equipos', '/categorias'].includes(currentPath)) {
      setIsEquiposOpen(true);
      setIsStakeholdersOpen(false);
      setIsOperacionesOpen(false);
    } else if (['/pedidos', '/mantenimiento'].includes(currentPath)) {
      setIsOperacionesOpen(true);
      setIsStakeholdersOpen(false);
      setIsEquiposOpen(false);
    } else if (['/ajustes/roles'].includes(currentPath)) {
      setIsAdministracionOpen(true);
      setIsStakeholdersOpen(false);
      setIsEquiposOpen(false);
      setIsOperacionesOpen(false);
    } else {
      setIsStakeholdersOpen(false);
      setIsEquiposOpen(false);
      setIsOperacionesOpen(false);
      setIsAdministracionOpen(false);
    }
  }, [currentPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideSidebar = sidebarRef.current && !sidebarRef.current.contains(event.target as Node);
      const isOutsideMobileHeader = mobileHeaderRef.current && !mobileHeaderRef.current.contains(event.target as Node);
      
      if (isOutsideSidebar && isOutsideMobileHeader) {
        setIsSidebarOpen(false);
        setIsCollapsed(true);
        // Also close the submenus just in case
        setIsStakeholdersOpen(false);
        setIsEquiposOpen(false);
        setIsOperacionesOpen(false);
        setIsAdministracionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'comercial', label: 'Gestión Comercial', icon: Briefcase, path: '/comercial', permission: 'VER_COMERCIAL' },
    { 
      id: 'stakeholders', 
      label: 'Stakeholders', 
      icon: Users2,
      subItems: [
        { id: 'obras', label: 'Obras', icon: HardHat, path: '/obras', permission: 'VER_OBRAS' },
        { id: 'empresas', label: 'Directorio de Empresas', icon: Building2, path: '/empresas', permission: 'VER_EMPRESAS' },
        { id: 'contactos', label: 'Contactos', icon: UserCircle, path: '/contactos', permission: 'VER_CONTACTOS' },
      ].filter(sub => !sub.permission || hasPermission(sub.permission as any))
    },
    { 
      id: 'equipos-menu', 
      label: 'Artículos', 
      icon: Construction,
      subItems: [
        { id: 'equipos', label: 'Listado de Artículos', icon: Construction, path: '/equipos', permission: 'VER_EQUIPOS' },
        { id: 'tipos-articulos', label: 'Tipos de Artículos', icon: Tags, path: '/tipos-articulos', permission: 'VER_EQUIPOS' },
        { id: 'categorias', label: 'Categorías', icon: Tags, path: '/categorias', permission: 'VER_EQUIPOS' },
      ].filter(sub => !sub.permission || hasPermission(sub.permission as any))
    },
    { 
      id: 'operaciones-menu', 
      label: 'Operaciones', 
      icon: ClipboardList,
      subItems: [
        { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag, path: '/pedidos', permission: 'VER_PEDIDOS' },
        { id: 'mantenimiento', label: 'Mant/Limp/Repo', icon: Wrench, path: '/mantenimiento', permission: 'VER_MANTENIMIENTO' },
      ].filter(sub => !sub.permission || hasPermission(sub.permission as any))
    },
    { id: 'compras', label: 'Compras', icon: ShoppingBag, path: '/compras', permission: 'VER_COMPRAS' },
    { id: 'rrhh', label: 'Recursos Humanos', icon: UserCog, path: '/rrhh', permission: 'VER_RRHH' },
    { 
      id: 'administracion-menu', 
      label: 'Administración', 
      icon: Shield,
      subItems: [
        { id: 'roles', label: 'Roles y Permisos', icon: UserCircle, path: '/ajustes/roles', permission: 'GESTIONAR_ROLES' },
      ].filter(sub => !sub.permission || hasPermission(sub.permission as any))
    },
    { id: 'pagos', label: 'Pagos', icon: CreditCard, path: '/pagos', permission: 'VER_PAGOS' },
    { id: 'cartera', label: 'Cartera', icon: Wallet, path: '/cartera', permission: 'VER_CARTERA' },
    { id: 'juridica', label: 'Gestión Jurídica', icon: Scale, path: '/juridica', permission: 'VER_JURIDICA' },
    { id: 'papelera', label: 'Papelera', icon: Trash2, path: '/papelera', permission: 'VER_PAPELERA' },
  ].filter(item => {
    if (item.subItems) return item.subItems.length > 0;
    return !item.permission || hasPermission(item.permission as any);
  });

  const handleNavClick = (id: string, hasSubItems: boolean) => {
    if (hasSubItems) {
      if (id === 'stakeholders') {
        setIsStakeholdersOpen(!isStakeholdersOpen);
        setIsEquiposOpen(false);
        setIsOperacionesOpen(false);
      }
      if (id === 'equipos-menu') {
        setIsEquiposOpen(!isEquiposOpen);
        setIsStakeholdersOpen(false);
        setIsOperacionesOpen(false);
      }
      if (id === 'operaciones-menu') {
        setIsOperacionesOpen(!isOperacionesOpen);
        setIsStakeholdersOpen(false);
        setIsEquiposOpen(false);
        setIsAdministracionOpen(false);
      }
      if (id === 'administracion-menu') {
        setIsAdministracionOpen(!isAdministracionOpen);
        setIsStakeholdersOpen(false);
        setIsEquiposOpen(false);
        setIsOperacionesOpen(false);
      }
      if (isCollapsed) setIsCollapsed(false); // Expandir sidebar si se abre un submenú
    } else {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <div ref={mobileHeaderRef} className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Construction className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">ConstruManage</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside ref={sidebarRef} className={`
        fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 min-h-[81px]">
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
                <Construction className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-bold text-slate-900 text-lg leading-tight">ConstruManage</span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gestión de Alquiler</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-x-hidden overflow-y-auto no-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = !!item.subItems;
              const isParentActive = hasSubItems && item.subItems?.some(sub => currentPath.startsWith(sub.path!));
              const isActive = currentPath === item.path || isParentActive;

              return (
                <div key={item.id} className="space-y-1">
                  {hasSubItems ? (
                    <button
                      onClick={() => handleNavClick(item.id, hasSubItems)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                        ${isActive 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                          {item.label}
                        </span>
                      </div>
                      {hasSubItems && !isCollapsed && (
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-300 ${((item.id === 'stakeholders' && isStakeholdersOpen) || (item.id === 'equipos-menu' && isEquiposOpen) || (item.id === 'operaciones-menu' && isOperacionesOpen) || (item.id === 'administracion-menu' && isAdministracionOpen)) ? 'rotate-180' : ''}`} 
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path!}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                        ${isActive 
                          ? 'bg-amber-50 text-amber-600' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                      `}
                    >
                      <Icon size={20} className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                        {item.label}
                      </span>
                    </Link>
                  )}

                  {/* Submenu Items */}
                  {hasSubItems && ((item.id === 'stakeholders' && isStakeholdersOpen) || (item.id === 'equipos-menu' && isEquiposOpen) || (item.id === 'operaciones-menu' && isOperacionesOpen) || (item.id === 'administracion-menu' && isAdministracionOpen)) && !isCollapsed && (
                    <div className="ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {item.subItems?.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = currentPath === sub.path;
                        return (
                          <Link
                            key={sub.id}
                            to={sub.path!}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`
                              w-full flex items-start gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left
                              ${isSubActive 
                                ? 'text-amber-600 bg-amber-50/50' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                            `}
                          >
                            <SubIcon size={16} className={`shrink-0 mt-0.5 ${isSubActive ? 'text-amber-500' : 'text-slate-300'}`} />
                            <span className="leading-tight">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className={`bg-slate-50 rounded-xl p-3 flex flex-col gap-3 transition-all duration-300`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden shrink-0 border-2 border-white flex items-center justify-center text-slate-600 font-bold">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Avatar" />
                  ) : (
                    userData?.displayName?.[0] || userData?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className={`flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'hidden' : 'w-full opacity-100'}`}>
                  <span className="text-sm font-bold text-slate-900 truncate" title={userRole?.name || 'Usuario'}>{userRole?.name || 'Usuario'}</span>
                  <span className="text-xs text-slate-400 truncate" title={userData?.email}>{userData?.email}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className={`flex items-center text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center w-full' : 'gap-2 w-full text-sm font-medium'}`}
                title="Cerrar Sessión"
              >
                <LogOut size={16} />
                {!isCollapsed && <span>Cerrar Sesión</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Banner de Vista de Rol */}
          {viewingAsRole && (
            <div className="bg-amber-100 border-b border-amber-200 px-8 py-3 flex items-center justify-between z-10 sticky top-0 shadow-sm shrink-0">
              <div className="flex items-center gap-2 text-amber-800">
                <Shield size={16} />
                <span className="text-sm font-medium">Estás visualizando la aplicación como el rol <strong>{viewingAsRole.name}</strong></span>
              </div>
              <button
                onClick={() => setViewAsRole(null)}
                className="text-xs font-semibold px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg transition-colors border border-amber-300"
              >
                Restaurar vista original
              </button>
            </div>
          )}
          
          <div className={`flex-1 flex flex-col min-h-0 relative p-1 md:p-2 ${['/pedidos', '/mantenimiento', '/prueba-app'].includes(currentPath) ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Shield } from 'lucide-react';
import { Permission } from '../constants/permissions';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredPermission }) => {
  const { currentUser, isLoading, hasPermission, viewingAsRole, setViewAsRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    // Redirigir al login si no está autenticado, guardando la ruta intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: Opcional, si queremos bloquear cuando un usuario logueado no tiene el permiso necesario.
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4 relative">
        {viewingAsRole && (
          <div className="absolute top-0 left-0 w-full bg-amber-100 border-b border-amber-200 px-8 py-3 flex items-center justify-between shadow-sm z-50">
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
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 mb-4">No tienes los permisos necesarios para ver esta página.</p>
        <button onClick={() => window.history.back()} className="text-blue-600 hover:underline">
          Volver atrás
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '../services/firebaseConfig';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

interface Role {
  id: string; // The role key, e.g. 'admin'
  name: string; // The display name
  description: string;
  permissions: string[];
}

const defaultRoles = ['owner', 'admin'];

export const RolesView: React.FC = () => {
  const navigate = useNavigate();
  const { setViewAsRole, viewingAsRole, currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Role>>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleData, setNewRoleData] = useState<Role>({ id: '', name: '', description: '', permissions: [] });
  
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, roleId: string | null}>({ isOpen: false, roleId: null });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'roles'), (snapshot) => {
      const rolesData: Role[] = [];
      snapshot.forEach((doc) => {
        rolesData.push({ id: doc.id, ...doc.data() } as Role);
      });
      setRoles(rolesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching roles:", error);
      alert("Error de permisos al cargar roles: " + error.message + ". Verifica las reglas de Firebase.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveEdit = async (roleId: string) => {
    try {
      if (!editFormData.name) return;
      const roleRef = doc(db, 'roles', roleId);
      await setDoc(roleRef, {
        name: editFormData.name,
        description: editFormData.description || '',
        permissions: editFormData.permissions || []
      }, { merge: true });
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error updating role.');
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!newRoleData.id || !newRoleData.name) {
        alert('ID y Nombre son obligatorios');
        return;
      }
      
      // Basic validation for ID: no spaces, lowercase, etc.
      const validId = newRoleData.id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (validId !== newRoleData.id) {
        alert('El ID solo puede contener letras minúsculas, números, guiones y guiones bajos.');
        return;
      }

      const roleRef = doc(db, 'roles', validId);
      await setDoc(roleRef, {
        name: newRoleData.name,
        description: newRoleData.description,
        permissions: newRoleData.permissions
      });
      
      setIsCreating(false);
      setNewRoleData({ id: '', name: '', description: '', permissions: [] });
    } catch (error: any) {
      console.error('Error creating role:', error);
      alert('Error al crear el rol: ' + error.message + '. Verifica las reglas de Firestore.');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (defaultRoles.includes(roleId)) return;
    try {
      await deleteDoc(doc(db, 'roles', roleId));
      setConfirmDialog({ isOpen: false, roleId: null });
    } catch (error) {
      console.error('Error delete role:', error);
      alert('Error al eliminar el rol.');
    }
  };

  const togglePermission = (permissions: string[], perm: string): string[] => {
    if (permissions.includes(perm)) {
      return permissions.filter(p => p !== perm);
    } else {
      return [...permissions, perm];
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    role.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = ALL_PERMISSIONS.filter(perm => 
    perm.toLowerCase().replace(/_/g, ' ').includes(permissionSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Cargando roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Gestión de Roles y Permisos
          </h1>
          <p className="text-sm text-slate-500">Configura los niveles de acceso de los usuarios del sistema.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nuevo Rol
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {isCreating && (
            <div className="p-6 bg-indigo-50/30 border-b border-indigo-100 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-800">Crear Nuevo Rol</h3>
                <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID del Rol (sin espacios)</label>
                  <input 
                    type="text"
                    value={newRoleData.id}
                    onChange={e => setNewRoleData({...newRoleData, id: e.target.value})}
                    placeholder="ej. gerente_ventas"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre para mostrar</label>
                  <input 
                    type="text"
                    value={newRoleData.name}
                    onChange={e => setNewRoleData({...newRoleData, name: e.target.value})}
                    placeholder="ej. Gerente de Ventas"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                  <input 
                    type="text"
                    value={newRoleData.description}
                    onChange={e => setNewRoleData({...newRoleData, description: e.target.value})}
                    placeholder="Breve descripción de las responsabilidades del rol"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <label className="block text-xs font-semibold text-slate-700">Permisos Asignados</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar permiso..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredPermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-indigo-300">
                      <input 
                        type="checkbox"
                        checked={newRoleData.permissions.includes(perm)}
                        onChange={() => setNewRoleData({
                          ...newRoleData, 
                          permissions: togglePermission(newRoleData.permissions, perm)
                        })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-700 truncate" title={perm}>{perm.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateRole}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar Rol
                </button>
              </div>
            </div>
          )}

          {filteredRoles.map(role => {
            const isRoleEditing = isEditing === role.id;
            const isProtected = defaultRoles.includes(role.id);

            if (isRoleEditing) {
              return (
                <div key={role.id} className="p-6 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-slate-800">Editando: {role.id}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre para mostrar</label>
                      <input 
                        type="text"
                        value={editFormData.name || ''}
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                      <input 
                        type="text"
                        value={editFormData.description || ''}
                        onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <label className="block text-xs font-semibold text-slate-700">Permisos Asignados</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Buscar permiso..."
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                          className="w-full sm:w-64 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredPermissions.map(perm => (
                        <label key={perm} className={`flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-indigo-300 ${isProtected ? 'opacity-70' : ''}`}>
                          <input 
                            type="checkbox"
                            checked={editFormData.permissions?.includes(perm) || false}
                            onChange={() => !isProtected && setEditFormData({
                              ...editFormData, 
                              permissions: togglePermission(editFormData.permissions || [], perm)
                            })}
                            disabled={isProtected}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                          <span className="text-xs text-slate-700 truncate" title={perm}>{perm.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                    {isProtected && (
                      <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Los permisos de este rol están protegidos por el sistema.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditing(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleSaveEdit(role.id)}
                      className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={role.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-lg">{role.name}</h3>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-mono">
                        {role.id}
                      </span>
                      {isProtected && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          Sistema
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {viewingAsRole?.id === role.id ? (
                        <button
                          onClick={() => setViewAsRole(null)}
                          className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors border border-amber-200"
                          title="Dejar de ver como este rol"
                        >
                          <EyeOff className="w-4 h-4" />
                          Restaurar vista original
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setViewAsRole(role);
                            navigate('/dashboard');
                          }}
                          className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
                          title="Ver aplicación temporalmente como este rol"
                        >
                          <Eye className="w-4 h-4" />
                          Ver como este rol
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setIsEditing(role.id);
                          setEditFormData(role);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modificar rol"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isProtected && (
                        <button 
                          onClick={() => setConfirmDialog({ isOpen: true, roleId: role.id })}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar rol"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{role.description || 'Sin descripción'}</p>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Permisos ({role.permissions?.length || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {(role.permissions || []).map(perm => (
                        <span key={perm} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2 py-0.5 rounded font-medium">
                          {perm.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <span className="text-sm text-slate-400 italic">Ningún permiso asignado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRoles.length === 0 && !isCreating && (
            <div className="p-8 text-center text-slate-500">
              No se encontraron roles que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message="¿Estás seguro que deseas eliminar este rol? Los usuarios con este rol podrían perder el acceso al sistema."
        onConfirm={() => {
          if (confirmDialog.roleId) handleDeleteRole(confirmDialog.roleId);
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, roleId: null })}
      />
    </div>
  );
};

export default RolesView;

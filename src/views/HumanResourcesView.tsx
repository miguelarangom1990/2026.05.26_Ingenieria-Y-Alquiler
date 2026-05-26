
import React, { useState, useEffect } from 'react';
import { UserCog, Users, Shield, Search, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../services/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';

const HumanResourcesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManageRoles = hasPermission('GESTIONAR_ROLES');

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach(doc => usersData.push({ ...doc.data() } as User));
      setUsers(usersData);
      checkLoading();
    });

    const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
      const rolesData: Role[] = [];
      snapshot.forEach(doc => rolesData.push({ id: doc.id, ...doc.data() } as Role));
      setRoles(rolesData);
      checkLoading();
    });

    let loaded = 0;
    const checkLoading = () => {
      loaded++;
      if (loaded >= 2) setIsLoading(false);
    };

    return () => {
      unsubUsers();
      unsubRoles();
    };
  }, []);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        roleId: newRoleId
      });
    } catch (e) {
      console.error('Error updating status/role:', e);
      alert('Error updating user role.');
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive
      });
    } catch (e) {
      console.error('Error updating status/role:', e);
      alert('Error updating user status.');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="text-slate-400" size={28} />
          Recursos Humanos y Usuarios
        </h1>
        <p className="text-slate-500 text-sm">Gestión de personal y acceso al sistema.</p>
      </div>

      {!canManageRoles && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Permisos Restringidos</h4>
            <p className="text-sm text-amber-700">No tienes permisos para modificar los roles o el estado de los usuarios. Solo puedes visualizar la lista.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>
          ) : (
             <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Información de Acceso</th>
                  <th className="px-6 py-4">Rol Asignado</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{user.displayName || '-'}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-500 text-xs font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                        UID: {user.uid.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canManageRoles ? (
                        <select
                          value={user.roleId || ''}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                          className={`w-full max-w-[180px] px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors ${
                            !user.roleId ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 focus:border-indigo-500'
                          }`}
                        >
                          <option value="">-- Sin Rol --</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          !user.roleId ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {roles.find(r => r.id === user.roleId)?.name || 'Sin Rol'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canManageRoles ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={user.isActive !== false}
                            onChange={(e) => handleStatusChange(user.uid, e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`text-xs font-medium ${user.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {user.isActive !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </label>
                      ) : (
                        <span className={`text-xs font-medium flex items-center gap-1.5 ${user.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <div className={`w-2 h-2 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          {user.isActive !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Proceso de Admisión de Nuevos Usuarios
        </h3>
        <p className="text-slate-500 text-sm mb-4">
          Para añadir un nuevo usuario al sistema, indíquele que se registre o inicie sesión utilizando el botón de Google u otro método de inicio en la pantalla principal. Una vez haya iniciado sesión por primera vez, aparecerá en esta lista <strong>Sin Rol</strong>, esperando que un administrador le asigne un rol apropiado y apruebe su acceso.
        </p>
      </div>

    </div>
  );
};

export default HumanResourcesView;

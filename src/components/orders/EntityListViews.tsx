import React from 'react';
import { Building2, Users, Store, RefreshCw, UserCircle, Edit2, Trash2 } from 'lucide-react';
import { ConstructionSite, Company } from '../../types';

interface EntityListViewsProps {
  currentSection: string;
  constructionSites: ConstructionSite[];
  companies: Company[];
  handleEditWork: (site: ConstructionSite) => void;
  handleEditClient: (client: Company) => void;
  handleEditSupplier: (supplier: Company) => void;
}

export const EntityListViews: React.FC<EntityListViewsProps> = ({
  currentSection,
  constructionSites,
  companies,
  handleEditWork,
  handleEditClient,
  handleEditSupplier,
}) => {
  if (currentSection === 'replacements') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Listado de Reposiciones</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <RefreshCw className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Sección de Reposiciones en desarrollo.</p>
        </div>
      </div>
    );
  }

  if (currentSection === 'works') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Listado de Obras</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre de la Obra</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ubicación</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {constructionSites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No hay obras registradas.</td>
                </tr>
              ) : (
                constructionSites.map(site => (
                  <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-700">{site.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {companies.find(c => c.id === site.companyId)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {site.location || 'Sin ubicación'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditWork(site)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar Obra"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (currentSection === 'clients') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Listado de Clientes</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">NIT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.filter(c => (c.roles?.includes('Cliente') || c.type === 'cliente')).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">No hay clientes registrados.</td>
                </tr>
              ) : (
                companies.filter(c => (c.roles?.includes('Cliente') || c.type === 'cliente')).map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{client.nit || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <UserCircle className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-700">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClient(client)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar Cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (currentSection === 'suppliers') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-bold text-slate-900">Listado de Proveedores</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">NIT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Servicios</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.filter(c => (c.roles?.includes('Proveedor') || c.type === 'proveedor')).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No hay proveedores registrados.</td>
                </tr>
              ) : (
                companies.filter(c => (c.roles?.includes('Proveedor') || c.type === 'proveedor')).map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{supplier.nit || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                          <Store className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-700">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {supplier.services && supplier.services.length > 0 ? (
                          supplier.services.map(service => (
                            <span key={service} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md capitalize">
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No especificado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar Proveedor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

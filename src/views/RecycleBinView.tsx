import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCcw, Search, Clock, Trash, AlertTriangle, CheckSquare, Square, X } from 'lucide-react';
import { subscribeToCollection, restoreItem, deleteItemPermanently } from '../services/firebaseService';

interface RecycledItem {
  id: string;
  originalCollection: string;
  deletedAt: string;
  data: any;
}

const RecycleBinView: React.FC = () => {
  const [items, setItems] = useState<RecycledItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollection, setFilterCollection] = useState('ALL');
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'single' | 'bulk' | 'empty'; targetId?: string }>({ isOpen: false, type: 'single' });

  useEffect(() => {
    const unsubscribe = subscribeToCollection('recycleBin', (data) => {
      setItems(data.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()));
    });
    return () => unsubscribe();
  }, []);

  const handleRestore = async (id: string) => {
    await restoreItem(id);
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const executeDelete = async () => {
    if (deleteModalState.type === 'single' && deleteModalState.targetId) {
      await deleteItemPermanently(deleteModalState.targetId);
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(deleteModalState.targetId!);
        return next;
      });
    } else if (deleteModalState.type === 'bulk') {
      for (const id of Array.from(selectedItems) as string[]) {
        await deleteItemPermanently(id);
      }
      setSelectedItems(new Set());
    } else if (deleteModalState.type === 'empty') {
      for (const item of items) {
        await deleteItemPermanently(item.id);
      }
      setSelectedItems(new Set());
    }
    setDeleteModalState({ isOpen: false, type: 'single' });
  };

  const handleBulkRestore = async () => {
    for (const id of Array.from(selectedItems) as string[]) {
      await restoreItem(id);
    }
    setSelectedItems(new Set());
  };

  const getCollectionName = (col: string) => {
    const names: Record<string, string> = {
      companies: 'Empresas',
      sites: 'Obras',
      equipment: 'Equipos',
      equipmentCategories: 'Categorías',
      people: 'Contactos',
      activities: 'Actividades',
      orders: 'Pedidos',
      maintenanceCards: 'Mantenimientos',
    };
    return names[col] || col;
  };

  const getItemName = (item: RecycledItem) => {
    const { data } = item;
    return data.name || data.nombre || data.id || 'Elemento sin nombre';
  };

  const collections = Array.from(new Set(items.map(item => item.originalCollection)));

  const filteredItems = items.filter(item => {
    const matchesSearch = getItemName(item).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCol = filterCollection === 'ALL' || item.originalCollection === filterCollection;
    return matchesSearch && matchesCol;
  });

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)] overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-red-100 text-red-600 p-2 rounded-xl">
              <Trash2 className="w-8 h-8" />
            </div>
            Papelera de Reciclaje
          </h1>
          <p className="text-slate-500 mt-2">
            Elementos eliminados. Aquí puedes restaurarlos a su ubicación original.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm font-medium text-slate-500 mr-2">
                {selectedItems.size} {selectedItems.size === 1 ? 'seleccionado' : 'seleccionados'}
              </span>
              <button
                onClick={handleBulkRestore}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Restaurar
              </button>
              <button
                onClick={() => setDeleteModalState({ isOpen: true, type: 'bulk' })}
                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar en la papelera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
          />
        </div>
        <div>
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
          >
            <option value="ALL">Todas las colecciones</option>
            {(collections as string[]).map(col => (
              <option key={col} value={col}>{getCollectionName(col)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-slate-200">
        {filteredItems.length > 0 ? (
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left w-12">
                     <button
                        onClick={handleSelectAll}
                        className={`p-1 rounded transition-colors flex items-center justify-center ${selectedItems.size === filteredItems.length && filteredItems.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                      >
                        {selectedItems.size === filteredItems.length && filteredItems.length > 0 ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre / ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría Original</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Eliminado El</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className={`p-1 rounded transition-colors flex items-center justify-center ${selectedItems.has(item.id) ? 'text-blue-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                      >
                        {selectedItems.has(item.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">{getItemName(item)}</div>
                      <div className="text-xs text-slate-500">ID: {item.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {getCollectionName(item.originalCollection)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-slate-600 gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {new Date(item.deletedAt).toLocaleDateString()} {new Date(item.deletedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Restaurar
                        </button>
                        <button
                          onClick={() => setDeleteModalState({ isOpen: true, type: 'single', targetId: item.id })}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1"
                          title="Eliminar permanentemente"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <Trash2 className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-lg font-medium text-slate-800">La papelera está vacía</p>
            <p className="text-slate-500">No hay elementos eliminados en este momento.</p>
          </div>
        )}
      </div>

      {deleteModalState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden shadow-red-500/10">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Eliminar Definitivamente</h3>
              <p className="text-slate-600 text-sm">
                {deleteModalState.type === 'single' && '¿Está seguro de que desea eliminar este elemento permanentemente?'}
                {deleteModalState.type === 'bulk' && `¿Está seguro de que desea eliminar ${selectedItems.size} elementos permanentemente?`}
                {deleteModalState.type === 'empty' && '¿Esta acción vaciará por completo la papelera eliminando todo permanentemente?'}
                <br /><br /><strong>Esta acción no se puede deshacer.</strong>
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, type: 'single' })}
                className="px-4 py-2 font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecycleBinView;

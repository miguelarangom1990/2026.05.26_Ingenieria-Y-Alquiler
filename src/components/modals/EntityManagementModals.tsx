import React from 'react';
import { UserPlus, Building2, Store, X, Save, AlertCircle, AlertTriangle, ChevronRight, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { Company, ConstructionSite } from '../../types';
import { NewClientModal } from './NewClientModal';
import { NewWorkModal } from './NewWorkModal';
import { NewSupplierModal } from './NewSupplierModal';
import { ConfirmDialog } from '../ConfirmDialog';

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface EntityManagementModalsProps {
  isNewClientModalOpen: boolean;
  setIsNewClientModalOpen: (open: boolean) => void;
  isNewWorkModalOpen: boolean;
  setIsNewWorkModalOpen: (open: boolean) => void;
  isNewSupplierModalOpen: boolean;
  setIsNewSupplierModalOpen: (open: boolean) => void;
  handleCreateClient: (client: Partial<Company>) => void;
  handleCreateWork: (work: Partial<ConstructionSite>) => void;
  handleCreateSupplier: (supplier: Partial<Company>) => void;
  companies: Company[];
  constructionSites: ConstructionSite[];
  wizardConfig: { isOpen: boolean; field: 'client' | 'work' | 'supplier' | null; value: string };
  setWizardConfig: (config: any) => void;
  clientDuplicateError: string | null;
  setClientDuplicateError: (error: string | null) => void;
  forceCreationConfirmDialog: boolean;
  setForceCreationConfirmDialog: (open: boolean) => void;
}

export function EntityManagementModals({
  isNewClientModalOpen,
  setIsNewClientModalOpen,
  isNewWorkModalOpen,
  setIsNewWorkModalOpen,
  isNewSupplierModalOpen,
  setIsNewSupplierModalOpen,
  handleCreateClient,
  handleCreateWork,
  handleCreateSupplier,
  companies,
  constructionSites,
  wizardConfig,
  setWizardConfig,
  clientDuplicateError,
  setClientDuplicateError,
  forceCreationConfirmDialog,
  setForceCreationConfirmDialog
}: EntityManagementModalsProps) {

  return (
    <>
      <NewClientModal 
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSave={handleCreateClient}
      />

      <NewWorkModal 
        isOpen={isNewWorkModalOpen}
        onClose={() => setIsNewWorkModalOpen(false)}
        clients={companies.filter(c => c.roles?.includes('Cliente') || (c as any).type === 'cliente')}
        onSave={handleCreateWork}
      />

      <NewSupplierModal 
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        onSave={handleCreateSupplier}
      />

      {wizardConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Sidebar / Icon */}
            <div className={`w-full md:w-32 flex flex-col items-center justify-center p-6 text-white ${
              wizardConfig.field === 'client' ? 'bg-indigo-600' : 
              wizardConfig.field === 'work' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {wizardConfig.field === 'client' && <UserPlus className="w-10 h-10 mb-2" />}
              {wizardConfig.field === 'work' && <Building2 className="w-10 h-10 mb-2" />}
              {wizardConfig.field === 'supplier' && <Store className="w-10 h-10 mb-2" />}
              <div className="h-1 w-8 bg-white/30 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                    Nuevo {wizardConfig.field === 'client' ? 'Cliente' : wizardConfig.field === 'work' ? 'Obra' : 'Proveedor'}
                  </h3>
                  <p className="text-slate-500 mt-1">
                    No encontramos "<span className="font-semibold text-slate-700">{wizardConfig.value}</span>" en la base de datos.
                  </p>
                </div>
                <button 
                  onClick={() => setWizardConfig({ isOpen: false, field: null, value: '' })}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  wizardConfig.field === 'client' ? 'bg-indigo-500' : 
                  wizardConfig.field === 'work' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></div>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    wizardConfig.field === 'client' ? 'bg-indigo-100 text-indigo-600' : 
                    wizardConfig.field === 'work' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <PlusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre Registrado</p>
                    <p className="text-lg font-bold text-slate-800">{wizardConfig.value}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    const val = wizardConfig.value;
                    const field = wizardConfig.field;
                    setWizardConfig({ isOpen: false, field: null, value: '' });
                    if (field === 'client') {
                      setIsNewClientModalOpen(true);
                      // Custom setup logic if needed
                    } else if (field === 'work') {
                      setIsNewWorkModalOpen(true);
                    } else if (field === 'supplier') {
                      setIsNewSupplierModalOpen(true);
                    }
                  }}
                  className={`w-full sm:flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                    wizardConfig.field === 'client' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 
                    wizardConfig.field === 'work' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  }`}
                >
                  Completar Perfil
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setWizardConfig({ isOpen: false, field: null, value: '' })}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {clientDuplicateError && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-red-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Error de Duplicidad</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Ya existe un registro con el nombre <span className="font-bold text-red-600">"{clientDuplicateError}"</span>. No es posible crear duplicados para mantener la integridad de los datos.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setClientDuplicateError(null)}
                  className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                  Entendido
                </button>
                <button
                  onClick={() => {
                    setClientDuplicateError(null);
                    setForceCreationConfirmDialog(true);
                  }}
                  className="flex-1 bg-white text-slate-500 border border-slate-200 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Forzar Creación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={forceCreationConfirmDialog}
        message="¿Estás seguro de que deseas forzar la creación de este registro duplicado? Esto podría generar inconsistencias en los reportes y facturación."
        onConfirm={() => {
          // Note: The actual creation logic will be handled where this hook is used
          setForceCreationConfirmDialog(false);
        }}
        onCancel={() => setForceCreationConfirmDialog(false)}
        isAlert
      />
    </>
  );
}

import React from 'react';
import { FileUp, ChevronDown, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportButtonProps {
  type: 'cliente' | 'proveedor' | 'obra';
  activeImportDropdown: string | null;
  setActiveImportDropdown: (dropdown: string | null) => void;
  triggerImport: (type: 'cliente' | 'proveedor' | 'obra') => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ 
  type, 
  activeImportDropdown, 
  setActiveImportDropdown,
  triggerImport 
}) => {
  const isOpen = activeImportDropdown === type;

  const downloadTemplate = (type: 'cliente' | 'proveedor' | 'obra') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'cliente' || type === 'proveedor') {
      data = [{ Nombre: 'Ejemplo Empresa', NIT: '123456789-0' }];
      filename = `Plantilla_${type === 'cliente' ? 'Clientes' : 'Proveedores'}.xlsx`;
    } else if (type === 'obra') {
      data = [{ Nombre: 'Obra Ejemplo', Cliente: 'Nombre del Cliente Existente', Ubicacion: 'Calle 123 #45-67' }];
      filename = 'Plantilla_Obras.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, filename);
    setActiveImportDropdown(null);
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setActiveImportDropdown(isOpen ? null : type)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-sm"
      >
        <FileUp className="w-4 h-4" />
        Importar
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setActiveImportDropdown(null)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => downloadTemplate(type)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Descargar Plantilla</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Formato .xlsx</p>
              </div>
            </button>
            <button 
              onClick={() => triggerImport(type)}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Subir Archivo</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Cargar Excel</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

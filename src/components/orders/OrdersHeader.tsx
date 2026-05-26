import React from 'react';
import { Plus as PlusIcon } from 'lucide-react';
import { SectionType, Order, MaintenanceCard, SortRule } from '../../types';
import { CreateMenu } from '../menus/CreateMenu';
import { ImportButton } from './header/ImportButton';
import { ControlsPopover } from './header/ControlsPopover';
import { HistoryToggle } from './header/HistoryToggle';
import { ViewModeToggle } from './header/ViewModeToggle';
import { useOrdersContext } from '../../context/OrdersContext';

interface OrdersHeaderProps {
  currentSection: SectionType;
  historyMode: 'active' | 'history';
  setHistoryMode: (mode: 'active' | 'history') => void;
  viewMode: 'list' | 'dashboard' | 'table';
  setViewMode: (mode: 'list' | 'dashboard' | 'table') => void;
  tableExpandMode: 'equipment' | 'provider';
  setTableExpandMode: (mode: 'equipment' | 'provider') => void;
  handleCreateOrder: (type?: 'ALQUILER' | 'TRANSPORTE') => void;
  handleCreateTransport: () => void;
  handleCreateStandaloneMaintenance: () => void;
  sortRules: SortRule[];
  setSortRules: (rules: SortRule[]) => void;
  groupBy: string;
  setGroupBy: (group: any) => void;
  activeFilters: any;
  labels: any;
  history: Order[];
  maintenanceCards: MaintenanceCard[];
  setIsNewWorkModalOpen: (open: boolean) => void;
  setIsNewClientModalOpen: (open: boolean) => void;
  setIsNewSupplierModalOpen: (open: boolean) => void;
  triggerImport: (type: 'cliente' | 'proveedor' | 'obra') => void;
}

export const OrdersHeader = React.memo(function OrdersHeader({
  currentSection,
  historyMode,
  setHistoryMode,
  viewMode,
  setViewMode,
  tableExpandMode,
  setTableExpandMode,
  handleCreateOrder,
  handleCreateTransport,
  handleCreateStandaloneMaintenance,
  sortRules,
  setSortRules,
  groupBy,
  setGroupBy,
  activeFilters,
  labels,
  history,
  maintenanceCards,
  setIsNewWorkModalOpen,
  setIsNewClientModalOpen,
  setIsNewSupplierModalOpen,
  triggerImport
}: OrdersHeaderProps) {
  const { ui } = useOrdersContext();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = React.useState(false);
  const [showControlsPopover, setShowControlsPopover] = React.useState(false);
  const [showSortPopover, setShowSortPopover] = React.useState(false);
  const [showFilterPopover, setShowFilterPopover] = React.useState(false);
  const [showGroupPopover, setShowGroupPopover] = React.useState(false);
  const [activeImportDropdown, setActiveImportDropdown] = React.useState<string | null>(null);

  const isOrderOrMaint = currentSection === 'orders' || currentSection === 'maintenance' || currentSection === 'history';

  return (
    <div className="mb-4 flex flex-col md:flex-row md:items-center justify-end gap-4">
      <div className="flex items-center gap-3 self-start">
        {isOrderOrMaint && (
          <>
            {(currentSection === 'orders' || currentSection === 'maintenance') && (
              <>
                <CreateMenu
                  isOpen={isCreateMenuOpen}
                  setIsOpen={setIsCreateMenuOpen}
                  onCreateOrder={handleCreateOrder}
                  onCreateTransport={handleCreateTransport}
                  onCreateStandaloneMaintenance={handleCreateStandaloneMaintenance}
                />

                <ControlsPopover
                  showControlsPopover={showControlsPopover}
                  setShowControlsPopover={setShowControlsPopover}
                  showSortPopover={showSortPopover}
                  setShowSortPopover={setShowSortPopover}
                  showFilterPopover={showFilterPopover}
                  setShowFilterPopover={setShowFilterPopover}
                  showGroupPopover={showGroupPopover}
                  setShowGroupPopover={setShowGroupPopover}
                  sortRules={sortRules}
                  setSortRules={setSortRules}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  activeFilters={activeFilters}
                  labels={labels}
                  currentSection={currentSection}
                />
              </>
            )}

            <div className="flex items-center gap-4">
              {(currentSection === 'orders' || currentSection === 'maintenance') && (
                <HistoryToggle
                  currentSection={currentSection}
                  historyMode={historyMode}
                  setHistoryMode={setHistoryMode}
                  orderHistory={history}
                  maintenanceCards={maintenanceCards}
                />
              )}
              
              <ViewModeToggle
                viewMode={viewMode}
                setViewMode={setViewMode}
                tableExpandMode={tableExpandMode}
                setTableExpandMode={setTableExpandMode}
              />
            </div>
          </>
        )}

        {currentSection === 'works' && (
          <div className="flex items-center gap-2">
            <ImportButton 
              type="obra" 
              activeImportDropdown={activeImportDropdown}
              setActiveImportDropdown={setActiveImportDropdown}
              triggerImport={triggerImport}
            />
            <button
              onClick={() => setIsNewWorkModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              Crear Obra
            </button>
          </div>
        )}

        {currentSection === 'clients' && (
          <div className="flex items-center gap-2">
            <ImportButton 
              type="cliente" 
              activeImportDropdown={activeImportDropdown}
              setActiveImportDropdown={setActiveImportDropdown}
              triggerImport={triggerImport}
            />
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              Crear Cliente
            </button>
          </div>
        )}

        {currentSection === 'suppliers' && (
          <div className="flex items-center gap-2">
            <ImportButton 
              type="proveedor" 
              activeImportDropdown={activeImportDropdown}
              setActiveImportDropdown={setActiveImportDropdown}
              triggerImport={triggerImport}
            />
            <button
              onClick={() => setIsNewSupplierModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              Crear Proveedor
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

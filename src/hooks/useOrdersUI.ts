import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Order, MaintenanceCard, MaintenanceStatus, SortRule, Attachment, WizardConfigState, ConfirmDialogState, SectionType } from '../types';

export function useOrdersUI() {
  const location = useLocation();
  const [currentSection, setCurrentSection] = useState<SectionType>(() => {
    return location.pathname.startsWith('/mantenimiento') ? 'maintenance' : 'orders';
  });

  useEffect(() => {
    setCurrentSection(location.pathname.startsWith('/mantenimiento') ? 'maintenance' : 'orders');
  }, [location.pathname]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isApartadosMenuOpen, setIsApartadosMenuOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isModifyMenuOpen, setIsModifyMenuOpen] = useState(false);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isRazonDropdownOpen, setIsRazonDropdownOpen] = useState(false);
  const [openTipoCobroId, setOpenTipoCobroId] = useState<string | null>(null);
  const [orderForNewInspection, setOrderForNewInspection] = useState<Order | null>(null);
  const [selectedItemsForInspection, setSelectedItemsForInspection] = useState<Set<string>>(new Set());
  const [newInspectionChoiceCard, setNewInspectionChoiceCard] = useState<MaintenanceCard | null>(null);

  const [historyMode, setHistoryMode] = useState<'active' | 'history'>('active');
  const [commentPanelWidth, setCommentPanelWidth] = useState(typeof window !== 'undefined' ? window.innerWidth * 0.25 : 400);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [wizardConfig, setWizardConfig] = useState<WizardConfigState>({isOpen: false, field: null, value: ''});
  const [forceCreationConfirmDialog, setForceCreationConfirmDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard' | 'table'>('dashboard');
  
  const [tableExpandMode, setTableExpandMode] = useState<'equipment' | 'provider'>('provider');
  const [tableColOrder, setTableColOrder] = useState([
    'id', 'nombre', 'cliente', 'destino', 'fecha', 'estado', 'tipoTransp', 'equipo', 'cantidad', 'proveedor',
    'transportista', 'tipoVehiculo', 'razonTransp', 'cobroTransp',
    'fTranspSub', 'fCobroSub', 'numAlterno', 'otrosAdjuntos', 'rmDvAdjuntos', 'notas'
  ]);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [maintTableColOrder, setMaintTableColOrder] = useState([
    'id', 'cliente', 'obra', 'equipo', 'idEquipo', 'cantidad', 'status', 'proveedorMant', 'propiedad', 'tipoCobro',
    'fechaEntrega', 'cotProvMantEnviada', 'numCotProvMant', 'aprobacionGerencia',
    'costoMant', 'numOrdenCompraIyA', 'ordenCompraAttachments', 'cobroMantClient', 'cotClientEnviada',
    'valorCotCliente', 'numCotMantCliente', 'aprobClientFactMantenimiento', 'facturaEstado', 'numFacturaMant', 'salidaTallerRealizada',
    'numOrdenMantSalidaT', 'ordenMantSalidaTallerArch', 'reciboTaller', 'cotClienteArch',
    'facturaMantArch', 'cotProvMantArch'
  ]);
  const [maintDraggedColId, setMaintDraggedColId] = useState<string | null>(null);
  const [tableColWidths, setTableColWidths] = useState<Record<string, number>>({
    id: 100, nombre: 200, cliente: 200, destino: 200, fecha: 120, estado: 140, tipoTransp: 130,
    equipo: 250, cantidad: 90, proveedor: 180, fTranspSub: 150, fCobroSub: 150, numAlterno: 150,
    otrosAdjuntos: 150, rmDvAdjuntos: 150, transportista: 180, tipoVehiculo: 150, razonTransp: 150,
    cobroTransp: 150, notas: 250
  });
  
  const [isEditingViewingTitle, setIsEditingViewingTitle] = useState(false);
  const [viewingTitleInput, setViewingTitleInput] = useState('');
  const [sortRules, setSortRules] = useState<SortRule[]>([{ field: 'fechaSolicitud', direction: 'desc' }]);
  const [groupBy, setGroupBy] = useState<'none' | 'cliente' | 'status' | 'proveedor' | 'fechaSolicitud' | 'fechaCreacion'>('none');
  
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [showGroupPopover, setShowGroupPopover] = useState(false);
  const [showControlsPopover, setShowControlsPopover] = useState(false);
  
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingComment, setIsDraggingComment] = useState(false);
  const [isDraggingAttachments, setIsDraggingAttachments] = useState(false);
  
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 80, equipo: 250, idEquipo: 150, cantidad: 80, fechaEntrega: 150, ubicacion: 150,
    clienteCobro: 180, obraCobro: 180, proveedor: 180, propiedad: 150, tipoCobro: 150,
    cotProvMantEnviada: 150, numCotProvMant: 150, costoMantenimiento: 150, cobroMantClient: 150,
    costoMant: 150, valorCotCliente: 150, cotClientEnviada: 150, aprobClientFactMantenimiento: 180,
    numCotMantCliente: 150, facturaEstado: 150, numFacturaMant: 150, numOrdenCompraIyA: 150,
    numCotProvMantAprob: 150, ordenCompraAttachments: 150, numOrden: 150, salidaTaller: 150,
    ordenMant: 150, reciboTaller: 150, cotCliente: 150, facturaMantArch: 150,
    salidaTallerRealizada: 180, numOrdenMantSalidaT: 180, ordenMantSalidaTallerArch: 180,
    aprobacionGerencia: 180, cotProvMantArch: 150,
  });
  
  const [resizingColumn, setResizingColumn] = useState<{
    id: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false, message: '', onConfirm: () => {}, isAlert: false });
  const [importType, setImportType] = useState<'cliente' | 'proveedor' | 'obra' | null>(null);
  const [activeImportDropdown, setActiveImportDropdown] = useState<'cliente' | 'proveedor' | 'obra' | null>(null);

  return {
    isSidebarOpen, setIsSidebarOpen,
    isCreateMenuOpen, setIsCreateMenuOpen,
    isApartadosMenuOpen, setIsApartadosMenuOpen,
    isActionMenuOpen, setIsActionMenuOpen,
    isModifyMenuOpen, setIsModifyMenuOpen,
    isAttachmentsModalOpen, setIsAttachmentsModalOpen,
    isRazonDropdownOpen, setIsRazonDropdownOpen,
    openTipoCobroId, setOpenTipoCobroId,
    orderForNewInspection, setOrderForNewInspection,
    selectedItemsForInspection, setSelectedItemsForInspection,
    newInspectionChoiceCard, setNewInspectionChoiceCard,
    currentSection, setCurrentSection,
    historyMode, setHistoryMode,
    commentPanelWidth, setCommentPanelWidth,
    windowWidth, setWindowWidth,
    wizardConfig, setWizardConfig,
    forceCreationConfirmDialog, setForceCreationConfirmDialog,
    viewMode, setViewMode,
    tableExpandMode, setTableExpandMode,
    tableColOrder, setTableColOrder,
    draggedColId, setDraggedColId,
    maintTableColOrder, setMaintTableColOrder,
    maintDraggedColId, setMaintDraggedColId,
    tableColWidths, setTableColWidths,
    isEditingViewingTitle, setIsEditingViewingTitle,
    viewingTitleInput, setViewingTitleInput,
    sortRules, setSortRules,
    groupBy, setGroupBy,
    showFilterPopover, setShowFilterPopover,
    showSortPopover, setShowSortPopover,
    showGroupPopover, setShowGroupPopover,
    showControlsPopover, setShowControlsPopover,
    newComment, setNewComment,
    commentAttachments, setCommentAttachments,
    isUploading, setIsUploading,
    isDraggingComment, setIsDraggingComment,
    isDraggingAttachments, setIsDraggingAttachments,
    columnWidths, setColumnWidths,
    resizingColumn, setResizingColumn,
    confirmDialog, setConfirmDialog,
    importType, setImportType,
    activeImportDropdown, setActiveImportDropdown
  };
}

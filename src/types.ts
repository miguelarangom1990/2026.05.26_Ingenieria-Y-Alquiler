
import { Permission } from './constants/permissions';

export enum EquipmentStatus {
  AVAILABLE = 'Disponible',
  RENTED = 'Alquilado',
  MAINTENANCE = 'Mantenimiento'
}

export interface Company {
  id: string;
  propiedadDeLaEmpresa?: 'Propia' | 'Tercero';
  name: string;
  legalName: string; // Razón Social
  commercialName: string; // Nombre Comercial
  shortName: string; // Nombre Corto
  entityType: 'Persona Natural' | 'Empresa' | 'Sin identificar'; // Tipo de Persona
  roles: ('Cliente' | 'Proveedor')[]; // Roles unificados
  linkageStatus: 'Potencial' | 'Vinculado'; // Estado de Vinculación
  source?: 'Gestión Comercial' | 'Estrategia Digital'; // Fuente de Prospección (Solo Clientes)
  taxId: string;
  contactPerson: string;
  phone: string;
  email?: string;
  services?: string[]; // Servicios que presta (Solo Proveedores)
  clientServices?: string[]; // Servicios que presta como cliente
  // Documentos
  rutFile?: string;
  chamberOfCommerceFile?: string;
  creditStudyFile?: string;
  idCardFile?: string;
  bankCertificateFile?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  itemType?: string;
  status: EquipmentStatus;
  hourlyRate: number;
  image: string;
  supplierId: string;
}

export interface ConstructionSite {
  id: string;
  name: string;
  departamento?: string;
  municipio?: string;
  location: string;
  status: 'Activa' | 'Completada' | 'Pausada' | 'Pendiente de iniciar';
  clientId: string;
  // Nuevos campos
  workSite?: string; // Sitio de trabajo al que pertenece
  billingPeriod?: 'Quincenal' | 'Mensual';
  icaRetainer?: 'Si' | 'No';
  observation?: string;
  email?: string;
  billingEmail?: string;
  prospectStatus?: 'Obra Cliente' | 'Obra Prospecto';
  displayName?: string;
  shortName?: string;
  isVirtualObra?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactDetail {
  label: string; // Ej: 'Móvil', 'Oficina', 'Personal', 'Trabajo'
  value: string;
}

export interface Person {
  id: string;
  firstName: string; // Primer Nombre
  middleName?: string; // Segundo Nombre
  lastName: string; // Primer Apellido
  secondLastName?: string; // Segundo Apellido
  stakeholderType: 'Cliente' | 'Proveedor';
  roles: string[]; // Multi-select: "Dueño / socio", "Gerente", "Director", "Almacenista", "Maestro de obra", "Siso"
  // Nuevos campos de vinculación
  entityId?: string; // ID del Cliente o Proveedor al que pertenece
  locationType?: 'Oficina' | 'Obra';
  siteId?: string; // ID de la obra si locationType es 'Obra'
  // Información de contacto múltiple
  phones: ContactDetail[];
  emails: ContactDetail[];
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'document' | string;
  url: string;
  size?: string | number;
  timestamp?: number;
  file?: File;
}

export interface CommercialActivity {
  id: string;
  personId: string;
  type: 'Llamada' | 'Correo' | 'Reunión' | 'Visita Obra' | 'Whatsapp';
  date: string; // Fecha de realización (si está completada) o fecha límite (si está pendiente)
  scheduledDate?: string; // NUEVO: Fecha en la que estaba programada originalmente (para históricas)
  status: 'Realizado' | 'Pendiente';
  outcome?: string;
  nextFollowUp?: string;
  attachments?: Attachment[]; // Lista de archivos adjuntos
}

export interface EquipmentCategory {
  id: string;
  name: string;
  itemType?: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemType {
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCompany {
  id: string;
  name: string;
  legalName: string;
  commercialName: string;
  shortName: string;
  entityType: 'Persona Natural' | 'Empresa' | 'Sin identificar';
  roles: ('Cliente' | 'Proveedor')[];
  linkageStatus: 'Potencial' | 'Vinculado';
  source?: 'Gestión Comercial' | 'Estrategia Digital';
  taxId: string;
  contactPerson: string;
  phone: string;
  email?: string;
  services?: string[];
  clientServices?: string[];
  rutFile?: string;
  chamberOfCommerceFile?: string;
  creditStudyFile?: string;
  idCardFile?: string;
  bankCertificateFile?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderHistoryEvent {
  id: string;
  orderId: string;
  action: string;
  date: string;
  timestamp: number;
  user: string;
  details?: string;
}

export type OrderStatus = 'SIN_CONFIRMAR' | 'CONFIRMADO' | 'REVISION_DOCUMENTOS' | 'PEDIDO' | 'EN_LOGISTICA' | 'EN_TRANSPORTE' | 'FINALIZADO' | 'MANTENIMIENTO' | 'CANCELADO' | 'COMPLETADO';

export interface LineItem {
  id: string;
  equipmentId: string;
  equipo?: string;
  cantidad: number;
  proveedor?: string;
  precio?: number;
  fechaCobroSub?: string;
  fechaTransporteSub?: string;
  numAlterno?: string;
}

export interface MaintenanceItem {
  id: string;
  equipmentId?: string;
  equipo?: string;
  idEquipo?: string;
  cantidad: number;
  proveedorMantenimiento?: string;
  estado?: string;
  clienteCobro?: string;
  obraCobro?: string;
  cotProvMantEnviada?: 'Sin Solicitar' | 'Cot Solicitada' | 'Cot Recibida';
  tipoCobro?: string[];
  propiedadEquipo?: string;
  recibosTaller?: any[];
}

export type MaintenanceStatus = 'SOLICITUD_REVISION' | 'COT_PROV_MANT' | 'APROB_MANT_IYA' | 'COT_CLIENT' | 'CERVINO' | 'CANCELADO' | 'COMPLETADO';

export interface Comment {
  id: string;
  autor?: string;
  author?: string;
  texto?: string;
  text?: string;
  fecha?: string;
  timestamp?: number;
  attachments?: Attachment[];
  messageId?: string;
  rfcMessageId?: string;
  threadId?: string;
}

export interface MaintenanceCard {
  id: string;
  orderId?: string;
  cliente?: string;
  obra?: string;
  nombre?: string;
  isManualTitle?: boolean;
  fechaIngreso: string;
  timestamp: number;
  status: MaintenanceStatus;
  items: any[];
  notasGenerales?: string;
  cotProvMantEnviada?: string;
  numCotProvMant?: string;
  costoMantenimiento?: number;
  cobroMantClient?: string;
  numOrdenCompraProveedor?: string;
  ordenMantArchivos?: Attachment[];
  ordenCompraProveedorArchivos?: Attachment[];
  comments?: Comment[];
}

export type SortField = string;
export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  id: string;
  field: string;
  direction: SortDirection;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface Order {
  id: string;
  nombre?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  cliente: string;
  clientId?: string;
  destino: string;
  siteId?: string;
  fecha: string;
  items: LineItem[];
  timestamp?: number;
  status: OrderStatus;
  type?: 'ALQUILER' | 'TRANSPORTE' | 'MANTENIMIENTO';
  tipoTransporte?: string;
  confirmado?: boolean;
  isManualTitle?: boolean;
  checklist?: Record<string, boolean>;
  logisticsInfo?: {
    transportista?: string;
    tipoVehiculo?: string;
    cobroTransporte?: string;
    razonTransporte?: string | string[];
    notas?: string;
  };
  transportInfo?: {
    providerData?: Record<string, {
      fechaTransporteSub?: string;
      fechaCobroSub?: string;
      numAlterno?: string;
    }>;
    rmDvArch?: Attachment[];
    fotosYOtrosArchivos?: Attachment[];
    providerAttachments?: Record<string, Attachment[]>;
    providerRmDvAttachments?: Record<string, Attachment[]>;
  };
  maintenanceInfo?: {
    items: MaintenanceItem[];
  };
  emailThreadIds?: string[];
}

export type ViewType = 'dashboard' | 'obras' | 'contactos' | 'equipos' | 'categorias' | 'comercial' | 'operaciones' | 'rrhh' | 'cartera' | 'juridica' | 'compras' | 'pagos' | 'empresas';

export interface OrdersAndMaintenanceProps {
  realCompanies?: Company[];
  realSites?: ConstructionSite[];
  realEquipment?: Equipment[];
  realCategories?: EquipmentCategory[];
  asModal?: boolean;
}

export type SectionType = 'orders' | 'maintenance' | 'replacements' | 'works' | 'clients' | 'suppliers' | 'history';

export interface ClientConfirmDialogState {
  isOpen: boolean;
  isSimilarName: boolean;
  isSimilarNit: boolean;
}

export interface WizardConfigState {
  isOpen: boolean;
  field: 'name' | 'nit' | null;
  value: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  isAlert?: boolean;
}

export interface ConfirmDialogProps extends ConfirmDialogState {}

export interface MaintenanceColumn {
  status: MaintenanceStatus;
  title: string;
  icon: any;
}

export interface Role {
  id: string; // Ej: 'admin', 'operator'
  name: string; // Ej: 'Administrador', 'Operador'
  description?: string;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  roleId: string; // Referencia al ID del rol
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

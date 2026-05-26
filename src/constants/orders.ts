import { OrderStatus, MaintenanceStatus } from '../types';
import { Wrench } from 'lucide-react';

export const EQUIPOS = [
  "Excavadora Hidráulica",
  "Retroexcavadora",
  "Grúa Móvil",
  "Generador Eléctrico 50kW",
  "Andamio Tubular (Set)",
  "Andamio Multidireccional",
  "Andamio Colgante",
  "Compresor de Aire",
  "Martillo Demoledor",
  "Torre de Iluminación",
  "Varios"
];

export const PROVEEDORES_MANTENIMIENTO = [
  "Taller Central Maquinaria",
  "Servicio Técnico Especializado",
  "Mantenimiento Express S.A.",
  "Reparaciones Industriales Pro"
];

export const TIPOS_VEHICULO = [
  "Automovil",
  "Cama baja",
  "Camion grua",
  "Camioneta de estacas",
  "Camioneta de volco",
  "Furgon",
  "Moto",
  "Motocarro"
];

export const TIPOS_TRANSPORTE = [
  "remision",
  "devolucion",
  "trayecto"
];

export const RAZONES_TRANSPORTE = [
  "alquiler",
  "cambio equipo",
  "mantenimiento",
  "trayecto transporte interno",
  "trayecto transporte externo"
];

export const STATUS_RANK: Record<string, number> = {
  'PEDIDO': 0,
  'EN_LOGISTICA': 1,
  'EN_TRANSPORTE': 2,
  'FINALIZADO': 3
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['PEDIDO', 'EN_LOGISTICA', 'EN_TRANSPORTE', 'FINALIZADO', 'COMPLETADO', 'CANCELADO'];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  'SOLICITUD_REVISION': 'Solicitud de revisión',
  'COT_PROV_MANT': 'Cot Prov mant',
  'APROB_MANT_IYA': 'Aprob mant IyA',
  'COT_CLIENT': 'Cot client',
  'CERVINO': 'Cervino',
  'CANCELADO': 'Cancelado',
  'COMPLETADO': 'Completado'
};

export const MAINTENANCE_COLUMNS: any = [
  { title: MAINTENANCE_STATUS_LABELS['SOLICITUD_REVISION'], status: 'SOLICITUD_REVISION', color: 'slate', icon: Wrench },
  { title: MAINTENANCE_STATUS_LABELS['COT_PROV_MANT'], status: 'COT_PROV_MANT', color: 'blue', icon: Wrench },
  { title: MAINTENANCE_STATUS_LABELS['APROB_MANT_IYA'], status: 'APROB_MANT_IYA', color: 'purple', icon: Wrench },
  { title: MAINTENANCE_STATUS_LABELS['COT_CLIENT'], status: 'COT_CLIENT', color: 'orange', icon: Wrench },
  { title: MAINTENANCE_STATUS_LABELS['CERVINO'], status: 'CERVINO', color: 'emerald', icon: Wrench },
];

export const REVISION_CHECKLIST_REMISION = [
  "1. Escanear documentos - Verificar que el conductor suba la documentación escaneada correctamente según aplique (remisión- remisión subalquiler- imágenes y video del equipo entregado).",
  "2. Nombre de obra - Verificar que la remisión tenga un nombre de obra asignado y que no pongan como nombre de obra ingeniería y alquiler solamente",
  "3. Ckecklist fotos y videos - Verificar checklist de fotos y videos de equipos entregados",
  "4. Verificacion articulos sub - Los articulos y cantidades de la remision de los subalquileres deben sumar la cantidad de los articulos de la remision de Ingenieria y Alquiler",
  "5. Firmar de documentos - Verificar que todos los documentos estén firmados por la persona que entrega y la persona que recibe en obra.",
  "6. Coincidencia de artículos remisionados - Verificar que los artículos remisionados coincidan con los entregados en obra.",
  "7. Especificar error en Clickup - Verificar si la tarjeta presenta algún error y especificarlo en el campo ID ERROR.",
  "8. Completar - Completar y archivar si tiene todo check"
];

export const REVISION_CHECKLIST_DEVOLUCION = [
  "1. Predevolución -> Devolución - Convertir pre-devolución en devolución.",
  "2. Subir documentación escaneada - Verificar que el conductor o jefe de bodega suba la documentación escaneada correctamente según aplique (pre-devolución, pre-devolución subalquiler, imágenes y video del equipo devuelto).",
  "3. Checklist fotos y videos - Verificar checklist de fotos y videos de equipos entregados",
  "4. Especificar error en Clickup - Verificar si la tarjeta presenta algún error y especificarlo en el campo ID ERROR.",
  "5. Firmar documentos - Verificar que todos los documentos estén firmados por la persona que entrega y la persona que recibe en subalquiler/ bodega.",
  "6. Saldos obra congruentes. - Verificar que los artículos devueltos no sean mayores que los saldos de ese equipo en la obra",
  "7. Coincidencia de artículos devueltos - Verificar que los artículos marcados en la pre-devolución coincidan con los entregados en bodega/ subalquiler.",
  "8. Hay documentos con observaciones cobros a obras? - Si hay, se deben cotizar y cobrar al cliente. Se debe pasar la tarjeta de clickup a la lista mantenimientos o reposiciones",
  "9. Hay observaciones de cantidades en equipos? - Si no se entregan la misma cantidad que se remisiono se debe modificar la cantidad de equipos en cervino",
  "10. Hay observaciones en la numeración de los equipos? - Si entregan un equipo con un numero diferente al que aparece en la remision se debe cambiar el numero de quipo en cervino por el numero que realmente es",
  "11. Salida de Subalquiler - Realizar salida de subalquiler con la fecha y los artículos tal cual el documento.",
  "12. Completar - Archivar si todos los artículos fueron devueltos a almacén."
];

export const FALLBACK_SITES = [
  "Proyecto Centro",
  "Obra Norte",
  "Planta Industrial Sur",
  "Almacén Principal",
  "Proyecto Residencial Este",
  "Construcción Vía Rápida",
  "Arena Primavera",
  "Cedro Azul",
  "Vegas 48",
  "Hoby Homes",
  "Housy Provenza",
  "Wake 2"
];

export const FALLBACK_CLIENTS = [
  "Constructora Horizonte S.A.",
  "Ingeniería y Desarrollo Global",
  "Servicios Mineros del Norte",
  "Logística Integral S.L.",
  "Urbanizaciones Modernas",
  "Mantenimiento Industrial Express",
  "Convel"
];

export const FALLBACK_SUPPLIERS = [
  "Maquinaria Pesada S.A.",
  "Equipos del Norte",
  "Alquileres Industriales Global",
  "Suministros Construcción 24/7",
  "Renta-Tool Profesional",
  "Varios",
  "Taller y Alquiler JM",
  "Alexis Herrera",
  "Logística Veloz S.A.",
  "Transportes Rápidos del Norte",
  "Carga Segura Express",
  "Movilidad Industrial Global",
  "Fletes y Mudanzas El Rayo",
  "Rentaequipos",
  "Megaequipos",
  "Saeco",
  "Arrendaequipos"
];

export const FALLBACK_TRANSPORTERS = [
  "Logística Veloz S.A.",
  "Transportes Rápidos del Norte",
  "Carga Segura Express",
  "Movilidad Industrial Global",
  "Fletes y Mudanzas El Rayo"
];

export const KANBAN_HISTORY_COLUMNS = [
  { title: 'Completado', status: 'COMPLETADO', color: 'emerald' },
  { title: 'Cancelado', status: 'CANCELADO', color: 'red' }
];

export const KANBAN_ACTIVE_COLUMNS = [
  { title: 'Solicitud', status: 'PEDIDO', color: 'slate' },
  { title: 'En Logística', status: 'EN_LOGISTICA', color: 'emerald' },
  { title: 'En Transporte', status: 'EN_TRANSPORTE', color: 'blue' },
  { title: 'Revision Docs', status: 'FINALIZADO', color: 'purple' },
];

export const TABLE_COLUMNS_CONFIG: Record<string, string> = {
  id: 'ID Solicitud', nombre: 'Nombre', cliente: 'Cliente', destino: 'Destino',
  fecha: 'Fecha', estado: 'Estado', tipoTransp: 'Tipo Transp.', equipo: 'Equipo',
  cantidad: 'Cantidad', proveedor: 'Proveedor', fTranspSub: 'F. Transp.',
  fCobroSub: 'F. Cobro', numAlterno: '# RM/DV',
  transportista: 'Transportista', tipoVehiculo: 'Tipo Vehículo', razonTransp: 'Razón Transp.',
  rmDvAdjuntos: 'RM/DV Adjuntos', otrosAdjuntos: 'Otros Adjuntos',
  cobroTransp: 'Cobro Transp.', notas: 'Notas'
};

export const MAINT_TABLE_COLUMNS_CONFIG: Record<string, string> = {
  id: 'ID Solic',
  cliente: 'Cliente',
  obra: 'Obra',
  equipo: 'Equipo',
  idEquipo: 'Id Equipo',
  cantidad: 'Cantidad',
  status: 'Estado',
  proveedorMant: 'Proveedor Mant.',
  propiedad: 'Propiedad',
  tipoCobro: 'Tipo Cobro',
  fechaEntrega: 'Fecha Ingreso T.',
  solicitudCotProv: 'Solicitud Cot Prov. (Obs)',
  cotProvMantEnviada: 'Solicitud Cot Prov.',
  numCotProvMant: '# Cot Prov Mant',
  aprobacionGerencia: 'Aprob. Gerencia',
  costoMant: 'Costo Mant.',
  numOrdenCompraIyA: '# OC IYA',
  ordenCompraAttachments: 'Orden Compra a Prov (arch)',
  cobroMantClient: 'Cobro Mant Client?',
  cotClientEnviada: 'Cot Client Env?',
  valorCotCliente: 'Valor Cot Cliente',
  numCotMantCliente: '# Cot Mant Cliente',
  aprobClientFactMantenimiento: 'Aprob Client Fact Mant.',
  facturaEstado: 'Factura Estado',
  numFacturaMant: '# Factura Mant',
  salidaTallerRealizada: 'Salida Taller Realiz?',
  numOrdenMantSalidaT: '# Orden Mant Salida T',
  ordenMantSalidaTallerArch: 'ORDEN MANT / SALIDA TALLER (ARCH)',
  reciboTaller: 'Recibo Taller (arch)',
  cotClienteArch: 'Cot Cliente (arch)',
  facturaMantArch: 'Factura compra (arch)',
  cotProvMantArch: 'Cot Prov (Arch)'
};

export const SECTION_LABELS = {
  orders: {
    fechaSolicitud: 'Fecha Solicitud',
    fechaCreacion: 'Fecha Creación',
    status: 'Status',
    proveedor: 'Proveedor',
    porStatus: 'Por Status',
    porProveedor: 'Por Proveedor',
    porFechaSolicitud: 'Por Fecha Solicitud',
    porFechaCreacion: 'Por Fecha Creación',
    items: 'Equipos',
    active: 'Activos',
  },
  maintenance: {
    fechaSolicitud: 'Fecha Ingreso Taller',
    fechaCreacion: 'Fecha Creación',
    status: 'Estado',
    proveedor: 'Proveedor Mant.',
    porStatus: 'Por Estado',
    porProveedor: 'Por Proveedor Mant.',
    porFechaSolicitud: 'Por Fecha Ingreso Taller',
    porFechaCreacion: 'Por Fecha Creación',
    items: 'Equipos',
    active: 'Activos',
  }
} as const;

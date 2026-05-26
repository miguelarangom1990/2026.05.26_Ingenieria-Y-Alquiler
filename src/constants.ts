import { Equipment, EquipmentStatus, ConstructionSite, Person, CommercialActivity, Company, Order } from './types';

// --- EQUIPOS ---
export const REVISION_CHECKLIST_ITEMS = [
  "1. Escanear documentos - Verificar que el conductor suba la documentación escaneada correctamente según aplique (remisión- remisión subalquiler- imágenes y video del equipo entregado).",
  "2. Nombre de obra - Verificar que la remisión tenga un nombre de obra asignado y que no pongan como nombre de obra ingeniería y alquiler solamente",
  "3. Ckecklist fotos y videos - Verificar checklist de fotos y videos de equipos entregados",
  "4. Verificacion articulos sub - Los articulos y cantidades de la remision de los subalquileres deben sumar la cantidad de los articulos de la remision de Ingenieria y Alquiler",
  "5. Firmar de documentos - Verificar que todos los documentos estén firmados por la persona que entrega y la persona que recibe en obra.",
  "6. Coincidencia de artículos remisionados - Verificar que los artículos remisionados coincidan con los entregados en obra.",
  "7. Especificar error en Clickup - Verificar si la tarjeta presenta algún error y especificarlo en el campo ID ERROR.",
  "8. Completar - Completar y archivar si tiene todo check"
];

export const MOCK_EQUIPMENT: Equipment[] = [
  { id: '1', name: 'Excavadora Caterpillar 320', category: 'Pesada', status: EquipmentStatus.RENTED, hourlyRate: 150, image: 'https://images.unsplash.com/photo-1586191582151-f737707480c1?auto=format&fit=crop&q=80&w=800', supplierId: 's1' },
  { id: '2', name: 'Mini Cargador Bobcat S450', category: 'Compacta', status: EquipmentStatus.AVAILABLE, hourlyRate: 75, image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?auto=format&fit=crop&q=80&w=800', supplierId: 's1' },
  { id: '3', name: 'Grúa Torre Potain MCT 88', category: 'Elevación', status: EquipmentStatus.AVAILABLE, hourlyRate: 300, image: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=800', supplierId: 's2' },
  { id: '4', name: 'Generador Eléctrico 100kVA', category: 'Energía', status: EquipmentStatus.MAINTENANCE, hourlyRate: 45, image: 'https://images.unsplash.com/photo-1590236141008-8476679124d1?auto=format&fit=crop&q=80&w=800', supplierId: 's3' },
  { id: '5', name: 'Rodillo Compactador Dynapac', category: 'Vial', status: EquipmentStatus.RENTED, hourlyRate: 90, image: 'https://images.unsplash.com/photo-1533227268408-a774695d9ae9?auto=format&fit=crop&q=80&w=800', supplierId: 's1' },
  { id: '6', name: 'Demoledor de muro', category: 'Herramienta', status: EquipmentStatus.AVAILABLE, hourlyRate: 25, image: '', supplierId: 's5' },
];

// --- EMPRESAS (Unificadas) ---
export const MOCK_COMPANIES: Company[] = [
  // Proveedores
  { id: 's1', name: 'Maquinaria Global S.A.', legalName: 'Maquinaria Global S.A.', commercialName: 'MaqGlobal', shortName: 'MaqGlobal', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-111-222', contactPerson: 'Juan Pérez', phone: '555-0101', email: 'ventas@maqglobal.com' },
  { id: 's2', name: 'Elevaciones Pro', legalName: 'Elevaciones Profesionales Ltda.', commercialName: 'Elevaciones Pro', shortName: 'ElevaPro', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-222-333', contactPerson: 'María García', phone: '555-0202', email: 'contacto@elevapro.com' },
  { id: 's3', name: 'Energía Continua', legalName: 'Energía Continua S.A.S.', commercialName: 'EnCon', shortName: 'EnCon', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Potencial', taxId: '900-333-444', contactPerson: 'Carlos Ruiz', phone: '555-0303', email: 'soporte@encon.com' },
  { id: 's4', name: 'Logística Pesada S.A.', legalName: 'Logística Pesada S.A.', commercialName: 'LogiPesada', shortName: 'LogiPesada', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-444-555', contactPerson: 'Andrés Castro', phone: '555-0404', email: 'logistica@pesada.com' },
  { id: 's5', name: 'Herramientas y Motores', legalName: 'Importadora Herramientas y Motores Ltda.', commercialName: 'HerraMot', shortName: 'HerraMot', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-555-666', contactPerson: 'Lucía Méndez', phone: '555-0505', email: 'ventas@herramot.com' },
  { id: 's6', name: 'Soluciones Civiles', legalName: 'Soluciones Civiles Integrales S.A.', commercialName: 'SolCiv', shortName: 'SolCiv', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Potencial', taxId: '900-666-777', contactPerson: 'Ricardo Díaz', phone: '555-0606', email: 'proyectos@solciv.com' },
  { id: 's7', name: 'Aceros del Pacífico', legalName: 'Aceros del Pacífico S.A.', commercialName: 'AcerosPac', shortName: 'AcerosPac', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-777-888', contactPerson: 'Fernando Torres', phone: '555-0707', email: 'ventas@acerospacifico.com' },
  { id: 's8', name: 'TecnoConstrucción', legalName: 'Tecnología en Construcción S.A.S.', commercialName: 'TecnoConstru', shortName: 'TecnoConstru', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '900-888-999', contactPerson: 'Sofía Vergara', phone: '555-0808', email: 'innovacion@tecnoconstru.com' },
  { id: 's9', name: 'Seguridad Industrial Total', legalName: 'Seguridad Industrial Total Ltda.', commercialName: 'Seguridad Total', shortName: 'SegTotal', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Potencial', taxId: '900-999-000', contactPerson: 'Miguel Ángel', phone: '555-0909', email: 'epis@seguridadtotal.com' },
  { id: 's10', name: 'Hormigones FastMix', legalName: 'Hormigones Rápidos S.A.', commercialName: 'FastMix', shortName: 'FastMix', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '901-000-111', contactPerson: 'Alberto Contador', phone: '555-1010', email: 'pedidos@fastmix.com' },
  { id: 's11', name: 'Andamios y Moldajes SA', legalName: 'Andamios y Moldajes S.A.', commercialName: 'Andamios SA', shortName: 'AndamiosSA', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '901-111-222', contactPerson: 'Valeria Mazza', phone: '555-1111', email: 'arriendos@andamios-sa.com' },
  { id: 's12', name: 'Ferretería Industrial La Tuerca', legalName: 'Ferretería La Tuerca Ltda.', commercialName: 'La Tuerca', shortName: 'La Tuerca', entityType: 'Empresa', roles: ['Proveedor'], linkageStatus: 'Vinculado', taxId: '901-222-333', contactPerson: 'Pedro Picapiedra', phone: '555-1212', email: 'contacto@latuerca.com' },
  // Clientes
  { id: 'c1', name: 'ConstruAsociados', legalName: 'Constructoras Asociadas S.A.S.', commercialName: 'Asociados Construcción', shortName: 'ConstruAsociados', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '900-123-456', contactPerson: 'Luis Torres', phone: '555-8888' },
  { id: 'c2', name: 'Edificios Mod', legalName: 'Edificios Modernos Ltda.', commercialName: 'Modern Edificaciones', shortName: 'Edificios Mod', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '860-987-654', contactPerson: 'Ana Belén', phone: '555-7777' },
  { id: 'c3', name: 'Urbano XXI', legalName: 'Desarrollo Urbano Siglo XXI S.A.', commercialName: 'Siglo XXI Desarrollos', shortName: 'Urbano XXI', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Potencial', taxId: '901-222-333', contactPerson: 'Mario Silva', phone: '555-6666' },
  { id: 'c4', name: 'Vial S.A.', legalName: 'Infraestructura Vial S.A.', commercialName: 'Redes Viales Nacionales', shortName: 'Vial S.A.', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '800-444-555', contactPerson: 'Elena Gómez', phone: '555-5555' },
  { id: 'c5', name: 'VivFuturo', legalName: 'Viviendas del Futuro S.A.S.', commercialName: 'Futuro Habitacional', shortName: 'VivFuturo', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Potencial', taxId: '900-777-888', contactPerson: 'Roberto Luna', phone: '555-4444' },
  { id: 'c6', name: 'Indus ABC', legalName: 'Proyectos Industriales ABC', commercialName: 'ABC Industrial Solutions', shortName: 'Indus ABC', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '810-111-222', contactPerson: 'Patricia Vera', phone: '555-3333' },
  { id: 'c7', name: 'Inmobiliaria Los Andes', legalName: 'Inversiones Los Andes SpA', commercialName: 'Los Andes Real Estate', shortName: 'Los Andes', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '902-333-444', contactPerson: 'Felipe Camiroaga', phone: '555-2222' },
  { id: 'c8', name: 'Constructora Bolivar', legalName: 'Constructora Bolivar S.A.', commercialName: 'Constructora Bolivar', shortName: 'Bolivar', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Potencial', taxId: '890-555-666', contactPerson: 'Simón Díaz', phone: '555-1111' },
  { id: 'c9', name: 'Grupo Hotelero Sol', legalName: 'Hoteles del Sol Caribe S.A.', commercialName: 'Sol Hotels', shortName: 'Grupo Sol', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '903-444-555', contactPerson: 'Carmen Sandiego', phone: '555-9999' },
  { id: 'c10', name: 'Infraestructuras del Estado', legalName: 'Agencia Nacional de Infraestructura', commercialName: 'ANI', shortName: 'ANI', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Vinculado', taxId: '800-000-111', contactPerson: 'Ministro Obras', phone: '555-0000' },
  { id: 'c11', name: 'Logística LATAM', legalName: 'Bodegas y Logística Latinoamericana', commercialName: 'LogiLatam', shortName: 'LogiLatam', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Potencial', taxId: '904-555-666', contactPerson: 'Clark Kent', phone: '555-1234' },
  { id: 'c12', name: 'Arquitectura Verde', legalName: 'Arquitectura Sustentable SAS', commercialName: 'Green Arch', shortName: 'ArqVerde', entityType: 'Empresa', roles: ['Cliente'], linkageStatus: 'Potencial', taxId: '905-666-777', contactPerson: 'Pamela Isley', phone: '555-4321' },
];

// --- 12 OBRAS ---
export const MOCK_SITES: ConstructionSite[] = [
  { id: 'site1', name: 'Torre Residencial Horizon', location: 'Av. Libertador 4500', status: 'Activa', clientId: 'c1', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site2', name: 'Puente Interconector Norte', location: 'Ruta 9 Km 22', status: 'Activa', clientId: 'c2', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site3', name: 'Centro Comercial Plaza Sur', location: 'Barrio Las Flores', status: 'Pausada', clientId: 'c3', billingPeriod: 'Quincenal', prospectStatus: 'Obra Prospecto' },
  { id: 'site4', name: 'Parque Eólico La Sierra', location: 'Valle Central', status: 'Activa', clientId: 'c4', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site5', name: 'Edificio Smart City', location: 'Distrito Financiero', status: 'Activa', clientId: 'c5', billingPeriod: 'Mensual', prospectStatus: 'Obra Prospecto' },
  { id: 'site6', name: 'Planta de Procesamiento', location: 'Zona Industrial Sur', status: 'Completada', clientId: 'c6', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site7', name: 'Hospital Regional Sur', location: 'Av. La Salud 123', status: 'Activa', clientId: 'c10', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site8', name: 'Condominio Los Pinos', location: 'Calle Los Pinos 88', status: 'Activa', clientId: 'c7', billingPeriod: 'Quincenal', prospectStatus: 'Obra Cliente' },
  { id: 'site9', name: 'Bodega Central 4', location: 'Parque Industrial Aeropuerto', status: 'Activa', clientId: 'c11', billingPeriod: 'Mensual', prospectStatus: 'Obra Prospecto' },
  { id: 'site10', name: 'Remodelación Hotel Sol', location: 'Playa Blanca Km 5', status: 'Pausada', clientId: 'c9', billingPeriod: 'Quincenal', prospectStatus: 'Obra Cliente' },
  { id: 'site11', name: 'Carretera Costera Tramo 3', location: 'Ruta del Sol', status: 'Activa', clientId: 'c4', billingPeriod: 'Mensual', prospectStatus: 'Obra Cliente' },
  { id: 'site12', name: 'Eco-Oficinas Centro', location: 'Calle Verde 404', status: 'Activa', clientId: 'c12', billingPeriod: 'Mensual', prospectStatus: 'Obra Prospecto' },
];

// --- 14 PERSONAS ---
export const MOCK_PEOPLE: Person[] = [
  { id: 'p1', firstName: 'Roberto', lastName: 'Gómez', stakeholderType: 'Cliente', roles: ['Gerente', 'Dueño / socio'], entityId: 'c1', locationType: 'Oficina', phones: [{label: 'Móvil', value: '300-111-2222'}], emails: [{label: 'Trabajo', value: 'roberto@constru.com'}] },
  { id: 'p2', firstName: 'Laura', lastName: 'Martínez', stakeholderType: 'Proveedor', roles: ['Almacenista'], entityId: 's1', locationType: 'Oficina', phones: [{label: 'Oficina', value: '555-0101'}], emails: [{label: 'Trabajo', value: 'laura@maqglobal.com'}] },
  { id: 'p3', firstName: 'Carlos', lastName: 'Sánchez', stakeholderType: 'Cliente', roles: ['Maestro de obra', 'Siso'], entityId: 'c2', locationType: 'Obra', siteId: 'site2', phones: [{label: 'Móvil', value: '310-999-8888'}], emails: [] },
  { id: 'p4', firstName: 'Ana', lastName: 'Rodríguez', stakeholderType: 'Proveedor', roles: ['Director'], entityId: 's2', locationType: 'Oficina', phones: [], emails: [{label: 'Personal', value: 'ana.rod@gmail.com'}] },
  { id: 'p5', firstName: 'Felipe', lastName: 'Camiroaga', stakeholderType: 'Cliente', roles: ['Gerente'], entityId: 'c7', locationType: 'Oficina', phones: [{label: 'Móvil', value: '315-777-6666'}, {label: 'Oficina', value: '601-222-3333'}], emails: [{label: 'Trabajo', value: 'felipe@losandes.com'}] },
  { id: 'p6', firstName: 'Jorge', lastName: 'Nuñez', stakeholderType: 'Cliente', roles: ['Maestro de obra'], entityId: 'c7', locationType: 'Obra', siteId: 'site8', phones: [{label: 'Móvil', value: '320-555-4444'}], emails: [] },
  { id: 'p7', firstName: 'Lucia', lastName: 'Méndez', stakeholderType: 'Proveedor', roles: ['Administrativo'], entityId: 's5', locationType: 'Oficina', phones: [{label: 'Oficina', value: '555-0505'}], emails: [{label: 'Facturación', value: 'facturacion@herramot.com'}] },
  { id: 'p8', firstName: 'Pedro', lastName: 'Coral', stakeholderType: 'Cliente', roles: ['Director', 'Siso'], entityId: 'c10', locationType: 'Obra', siteId: 'site7', phones: [{label: 'Móvil', value: '311-123-4567'}], emails: [{label: 'Trabajo', value: 'pcoral@ani.gov.co'}] },
  { id: 'p9', firstName: 'Marta', lastName: 'Haro', stakeholderType: 'Cliente', roles: ['Siso'], entityId: 'c4', locationType: 'Obra', siteId: 'site11', phones: [{label: 'Móvil', value: '312-987-6543'}], emails: [] },
  { id: 'p10', firstName: 'Sergio', lastName: 'Lagos', stakeholderType: 'Cliente', roles: ['Arquitecto', 'Director'], entityId: 'c12', locationType: 'Oficina', phones: [{label: 'Móvil', value: '316-444-5555'}], emails: [{label: 'Trabajo', value: 'sergio@arqverde.com'}, {label: 'Personal', value: 'slagos@gmail.com'}] },
  { id: 'p11', firstName: 'Diana', lastName: 'Prince', stakeholderType: 'Proveedor', roles: ['Gerente'], entityId: 's10', locationType: 'Oficina', phones: [{label: 'Móvil', value: '300-888-9999'}], emails: [{label: 'Trabajo', value: 'diana@fastmix.com'}] },
  { id: 'p12', firstName: 'Camilo', lastName: 'Kante', stakeholderType: 'Proveedor', roles: ['Almacenista'], entityId: 's4', locationType: 'Obra', phones: [{label: 'Móvil', value: '319-222-1111'}], emails: [] },
  { id: 'p13', firstName: 'Pablo', lastName: 'Marmol', stakeholderType: 'Proveedor', roles: ['Administrativo', 'Almacenista'], entityId: 's12', locationType: 'Oficina', phones: [{label: 'Trabajo', value: '555-9090'}], emails: [{label: 'Ventas', value: 'pmarmol@latuerca.com'}] },
  { id: 'p14', firstName: 'Fernando', lastName: 'Alonso', stakeholderType: 'Cliente', roles: ['Maestro de obra'], entityId: 'c11', locationType: 'Obra', siteId: 'site9', phones: [{label: 'Móvil', value: '300-333-1414'}], emails: [] },
];

// --- 13 ACTIVIDADES COMERCIALES ---
export const MOCK_ACTIVITIES: CommercialActivity[] = [
  { id: 'act1', personId: 'p1', type: 'Llamada', date: '2023-10-15', status: 'Realizado', outcome: 'Interesado en alquiler de retroexcavadora por 3 meses. Se envió cotización formal.' },
  { id: 'act2', personId: 'p3', type: 'Visita Obra', date: '2023-10-18', status: 'Realizado', outcome: 'Revisión de terreno para ingreso de grúa torre. Acceso aprobado.' },
  { id: 'act3', personId: 'p5', type: 'Reunión', date: '2023-10-20', status: 'Realizado', outcome: 'Negociación de tarifas para el proyecto Los Andes. Se acordó descuento del 5% por volumen.' },
  { id: 'act4', personId: 'p8', type: 'Correo', date: '2023-10-22', status: 'Realizado', outcome: 'Envío de facturas pendientes de septiembre. Confirmaron recepción y fecha de pago.' },
  { id: 'act5', personId: 'p10', type: 'Whatsapp', date: '2023-10-24', status: 'Realizado', outcome: 'Coordinación rápida sobre cambio de operador para la excavadora.' },
  { id: 'act6', personId: 'p6', type: 'Llamada', date: '2023-10-25', status: 'Realizado', outcome: 'Cliente reporta falla menor en el generador. Se coordinó visita técnica inmediata.' },
  { id: 'act7', personId: 'p14', type: 'Visita Obra', date: '2023-10-26', status: 'Realizado', outcome: 'Entrega de equipo Bobcat en obra Bodega Central. Firma de acta de entrega conforme.' },
  { id: 'act8', personId: 'p1', type: 'Llamada', date: '2024-11-05', status: 'Pendiente', outcome: 'Seguimiento a cotización #4055 (Retroexcavadora). Validar si aprobaron presupuesto.' },
  { id: 'act9', personId: 'p5', type: 'Reunión', date: '2024-11-08', status: 'Pendiente', outcome: 'Firma de contrato marco anual para suministro de andamios.' },
  { id: 'act10', personId: 'p10', type: 'Correo', date: '2024-11-10', status: 'Pendiente', outcome: 'Enviar catálogo actualizado de equipos eco-amigables y certificación de emisiones.' },
  { id: 'act11', personId: 'p3', type: 'Visita Obra', date: '2024-11-12', status: 'Pendiente', outcome: 'Inspección mensual preventiva de maquinaria alquilada en Puente Norte.' },
  { id: 'act12', personId: 'p9', type: 'Whatsapp', date: '2024-11-15', status: 'Pendiente', outcome: 'Confirmar asistencia del personal a la capacitación de seguridad en altura.' },
  { id: 'act13', personId: 'p8', type: 'Llamada', date: '2024-11-18', status: 'Pendiente', outcome: 'Ofrecer promoción de temporada en equipos de elevación (Tijeras y Manlift).' },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord1',
    nombre: 'Pedido Excavación',
    siteId: 'site1',
    clientId: 'c1',
    status: 'SIN_CONFIRMAR',
    fecha: '2026-03-14',
    items: [{ id: 'item1', equipmentId: '1', cantidad: 1, proveedor: 's1' }],
    destino: 'Torre Residencial Horizon',
    cliente: 'ConstruAsociados'
  },
  {
    id: 'ord2',
    nombre: 'Pedido Grúa',
    siteId: 'site2',
    clientId: 'c2',
    status: 'EN_LOGISTICA',
    fecha: '2026-03-13',
    items: [{ id: 'item2', equipmentId: '3', cantidad: 1, proveedor: 's2' }],
    destino: 'Puente Interconector Norte',
    cliente: 'Edificios Mod'
  },
  {
    id: 'ord3',
    nombre: 'Pedido Mantenimiento',
    siteId: 'site3',
    clientId: 'c3',
    status: 'MANTENIMIENTO',
    fecha: '2026-03-12',
    items: [],
    maintenanceInfo: {
        items: [{ id: 'item3', equipmentId: '4', cantidad: 1, proveedorMantenimiento: 's3' }]
    },
    destino: 'Centro Comercial Plaza Sur',
    cliente: 'Urbano XXI'
  }
];

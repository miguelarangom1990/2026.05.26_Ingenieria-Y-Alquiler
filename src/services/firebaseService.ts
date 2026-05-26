import { db, storage } from './firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MOCK_COMPANIES, MOCK_SITES, MOCK_EQUIPMENT, MOCK_PEOPLE, MOCK_ACTIVITIES, MOCK_ORDERS } from '../constants';

// Suscribirse a una colección en tiempo real
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  const q = collection(db, collectionName);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  }, (error) => {
    console.error(`Error escuchando colección ${collectionName}:`, error);
    if (error.code === 'permission-denied') {
      alert(`Error de permisos en la colección ${collectionName}. Por favor verifica las reglas de Firestore en tu consola de Firebase.`);
    } else {
      alert(`Error Firestore (${collectionName}): ${error.message}`);
    }
  });
};

// Función auxiliar para limpiar undefined, funciones y evitar referencias circulares
const sanitizeData = (data: any, seen = new WeakSet()): any => {
  // Primitivos y nulos
  if (data === null || data === undefined) return null; 
  
  const type = typeof data;
  
  // Ignorar funciones y símbolos
  if (type === 'function' || type === 'symbol') return undefined;

  if (type !== 'object') return data;

  // Fechas
  if (data instanceof Date) return data.toISOString();

  // Filtrar nodos DOM y elementos React para evitar errores de serialización masiva
  // La propiedad $$typeof es usada por React, nodeType por el DOM
  if (data.nodeType || (data.$$typeof && typeof data.$$typeof === 'symbol')) return null;

  // Detección de ciclos
  if (seen.has(data)) return null; 
  seen.add(data);

  // Arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, seen));
  }

  // Objetos (solo propiedades propias para evitar prototipos y getters complejos)
  const newObj: any = {};
  try {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = sanitizeData(data[key], seen);
        if (val !== undefined) { 
          newObj[key] = val;
        }
      }
    }
  } catch (e) {
    console.error("Error sanitizando objeto:", e, data);
    return null;
  }
  
  return newObj;
};

// Guardar o Actualizar un documento (Upsert)
export const saveItem = async (collectionName: string, item: any) => {
  try {
    const docRef = doc(db, collectionName, item.id);
    
    // Aseguramos que el objeto sea puramente JSON-safe y sin ciclos
    const cleanData = sanitizeData(item);
    
    // Clonación profunda final para garantizar compatibilidad con Firestore
    // Usamos try-catch para evitar crash si todavía existe un ciclo oculto
    let payload;
    try {
        payload = JSON.parse(JSON.stringify(cleanData));
    } catch (jsonError) {
        console.error("Error serializando datos para Firestore:", jsonError);
        // Fallback: guardar solo ID y error para debug, evitando crash
        payload = { id: item.id, _serializationError: "Failed to process data" };
    }

    await setDoc(docRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`Documento guardado en ${collectionName}`);
  } catch (error: any) {
    console.error(`Error guardando en ${collectionName}:`, error);
    throw new Error(error?.message || "Error al guardar en Firebase");
  }
};

// Eliminar un documento (moviendo a papelera)
export const deleteItem = async (collectionName: string, itemId: string) => {
  try {
    const docRef = doc(db, collectionName, itemId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const itemData = snapshot.data();
      const recycleRef = doc(db, 'recycleBin', itemId);
      await setDoc(recycleRef, {
        originalCollection: collectionName,
        deletedAt: new Date().toISOString(),
        data: itemData
      });
    }

    await deleteDoc(docRef);
    console.log(`Documento ${itemId} eliminado de ${collectionName} y movido a papelera`);
  } catch (error: any) {
    console.error(`Error eliminando de ${collectionName}:`, error);
    throw new Error(error?.message || "Error eliminando documento");
  }
};

// Restaurar un documento de la papelera
export const restoreItem = async (itemId: string) => {
  try {
    const recycleRef = doc(db, 'recycleBin', itemId);
    const snapshot = await getDoc(recycleRef);
    
    if (snapshot.exists()) {
      const { originalCollection, data } = snapshot.data();
      const docRef = doc(db, originalCollection, itemId);
      
      await setDoc(docRef, data);
      await deleteDoc(recycleRef);
      console.log(`Documento ${itemId} restaurado a ${originalCollection}`);
    }
  } catch (error) {
    console.error(`Error restaurando documento ${itemId}:`, error);
    throw error;
  }
};

// Eliminar un documento permanentemente de la papelera
export const deleteItemPermanently = async (itemId: string) => {
  try {
    const recycleRef = doc(db, 'recycleBin', itemId);
    await deleteDoc(recycleRef);
    console.log(`Documento ${itemId} eliminado permanentemente`);
  } catch (error) {
    console.error(`Error eliminando documento permanentemente ${itemId}:`, error);
    throw error;
  }
};

// Subir archivo a Firebase Storage
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  try {
    const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${uniqueName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Error subiendo archivo:", error);
    throw new Error(error?.message || "Error al subir archivo");
  }
};

export const propagateEquipmentNameChange = async (oldName: string, newName: string) => {
  if (!oldName || !newName || oldName === newName) return;
  
  try {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const maintenanceSnapshot = await getDocs(collection(db, 'maintenanceCards'));

    const now = new Date().toISOString();
    let batch = writeBatch(db);
    let count = 0;
    let batchCount = 0;

    const commitBatchIfNeeded = async () => {
      if (batchCount > 400) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    };

    for (const docSnap of ordersSnapshot.docs) {
      const data = docSnap.data();
      let changed = false;
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          if (item.equipo === oldName) {
            item.equipo = newName;
            changed = true;
          }
        });
      }
      if (changed) {
        // Find existing history or create
        if (!data.orderHistory) data.orderHistory = [];
        data.orderHistory.push({
           id: crypto.randomUUID(),
           orderId: docSnap.id,
           action: `Nombre de equipo actualizado (${oldName} → ${newName}) por sistema.`,
           date: now,
           timestamp: Date.now(),
           user: 'Sistema Automático'
        });
        batch.set(doc(db, 'orders', docSnap.id), sanitizeData(data), { merge: true });
        count++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    for (const docSnap of maintenanceSnapshot.docs) {
      const data = docSnap.data();
      let changed = false;
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          if (item.equipo === oldName) {
            item.equipo = newName;
            changed = true;
          }
        });
      }
      if (changed) {
        if (!data.history) data.history = [];
        data.history.push({
           id: crypto.randomUUID(),
           orderId: docSnap.id,
           action: `Nombre de equipo actualizado (${oldName} → ${newName}) por sistema.`,
           date: now,
           timestamp: Date.now(),
           user: 'Sistema Automático'
        });
        batch.set(doc(db, 'maintenanceCards', docSnap.id), sanitizeData(data), { merge: true });
        count++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`Propagado cambio de equipo '${oldName}' a '${newName}' en ${count} documentos.`);
  } catch (error) {
    console.error("Error propagando cambio de nombre de equipo:", error);
  }
};

// Función masiva para cargar los datos de prueba iniciales
export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);

    const addToBatch = (col: string, data: any[]) => {
      data.forEach(item => {
        const ref = doc(db, col, item.id);
        const cleanItem = sanitizeData(item);
        batch.set(ref, JSON.parse(JSON.stringify(cleanItem)));
      });
    };

    addToBatch('companies', MOCK_COMPANIES);
    addToBatch('sites', MOCK_SITES);
    addToBatch('equipment', MOCK_EQUIPMENT);
    addToBatch('people', MOCK_PEOPLE);
    addToBatch('activities', MOCK_ACTIVITIES);
    addToBatch('orders', MOCK_ORDERS);

    await batch.commit();
    console.log("Base de datos poblada con éxito");
    return true;
  } catch (error: any) {
    console.error("Error poblando la base de datos:", error);
    throw new Error(error?.message || "Error al poblar base de datos");
  }
};

// Función para migrar clientes y proveedores existentes a la nueva colección unificada
export const migrateToUnifiedCompanies = async (clients: any[], suppliers: any[]) => {
  console.log("Iniciando migración...", { clientsCount: clients?.length, suppliersCount: suppliers?.length });
  
  try {
    const now = new Date().toISOString();
    const allItems = [
      ...(clients || []).map(c => ({ ...c, _role: 'Cliente' })),
      ...(suppliers || []).map(s => ({ ...s, _role: 'Proveedor' }))
    ];

    if (allItems.length === 0) {
      console.warn("No hay datos para migrar");
      return true;
    }

    // Firestore tiene un límite de 500 operaciones por batch
    const BATCH_SIZE = 400;
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = allItems.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(item => {
        if (!item.id) {
          console.error("Item sin ID encontrado durante migración:", item);
          return;
        }
        
        const { _role, ...data } = item;
        const ref = doc(db, 'companies', item.id);
        
        const companyData = {
          ...data,
          roles: [_role],
          updatedAt: now
        };
        
        batch.set(ref, sanitizeData(companyData), { merge: true });
      });
      
      await batch.commit();
      console.log(`Procesado batch de ${chunk.length} elementos`);
    }

    console.log("Migración a empresas unificadas completada con éxito");
    return true;
  } catch (error: any) {
    console.error("Error crítico en la migración:", error);
    // Intentar dar una pista sobre el error (ej: permisos, cuota, etc)
    if (error.code === 'permission-denied') {
      console.error("Error de permisos: Asegúrate de que las reglas de Firestore permitan escribir en 'companies'");
    }
    return false;
  }
};
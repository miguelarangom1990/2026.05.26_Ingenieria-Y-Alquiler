# Plan de Refactorización y Optimización: OrdersAndMaintenance

Este plan tiene como objetivo desglosar el componente monolítico `OrdersAndMaintenance.tsx` en una estructura modular, escalable y fácil de mantener, aplicando los patrones de diseño modernos de React.

## 🎯 Objetivos
- Reducir el tamaño de `OrdersAndMaintenance.tsx` (actualmente +1500 líneas).
- Separar la lógica de negocio de la interfaz visual.
- Mejorar la reutilización de componentes.
- Mantener la funcionalidad 100% idéntica para el usuario final.

---

## 🛠 Estrategias a Implementar

### 1. Desacoplamiento de Lógica (Custom Hooks)
Mover toda la gestión de estado y efectos a hooks especializados en `/src/hooks/`.
- [x] **1.1 useOrdersState**: Estado de pedidos, filtros y búsqueda.
- [x] **1.2 useMaintenanceState**: Estado de mantenimientos y sus flujos específicos.
- [x] **1.3 useOrdersUI**: Gestión de modales y estados de edición de pedidos.

### 2. Modularización de la Vista (Bento Box)
Dividir el JSX en piezas pequeñas y puras en `/src/components/orders/` y `/src/components/maintenance/`.
- [x] **2.1 Extraer OrdersContent**: La rejilla/lista de pedidos.
- [x] **2.2 Extraer MaintenanceContent**: La vista de mantenimientos.
- [x] **2.3 Refactorizar OrdersHeader**: Asegurarse de que sea independiente.

### 3. Implementación de Contexto (Context API)
Crear un `OrdersContext` para evitar el "Prop Drilling".
- [x] **3.1 Definir OrdersProvider** en `/src/context/`.
- [x] **3.2 Proveer acceso global** a `orders`, `updateOrder`, `setViewingOrder`, etc.

### 4. Enrutamiento Limpio (Nested Routes)
Utilizar el Router para manejar las secciones en lugar de estados internos (`initialSection`).
- [x] **4.1 Configurar rutas en App.tsx**: `/pedidos` y `/mantenimiento`.
- [x] **4.2 Eliminar la lógica de switch manual** basada en props.

### 5. Centralización de Constantes y Utils
- [x] **5.1 Mover configuraciones** de columnas y etiquetas a `/src/constants/orders.ts` (✅ *Completado*).
- [x] **5.2 Mover funciones de formateo** a `/src/lib/orderUtils.ts`.

---

## 📈 Tablero de Progreso

| Tarea | Estado | Notas |
| :--- | :--- | :--- |
| Limpieza de archivos basura | ✅ Hecho | Se eliminaron scripts `.cjs` y archivos `.txt` temporales. |
| Creación de `constants/orders.ts` | ✅ Hecho | Centralización de catálogos y labels. |
| Extracción de Lógica de Pedidos | ⏳ Pendiente | Mover lógica de `OrdersAndMaintenance.tsx` a hooks. |
| Refactorización de Modales | ⏳ Pendiente | Delegar la apertura de modales al contexto o hooks. |
| División de Componentes Visuales | ⏳ Pendiente | Crear archivos pequeños para cada sección de la UI. |

---

## ⚠️ Notas Importantes
- **Regla de Oro**: Ningún archivo de componente debe superar las 300 líneas.
- **Verificación**: Cada fase de refactorización debe pasar el `lint` y `compile` antes de avanzar.
- **Eliminación**: Este archivo debe ser borrado una vez que el componente `OrdersAndMaintenance.tsx` esté debidamente fragmentado.

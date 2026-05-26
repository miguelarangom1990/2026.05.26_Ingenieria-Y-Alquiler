# Plan de Implementación de Roles y Permisos Personalizados

Este documento detalla el plan paso a paso para implementar un sistema robusto de roles y permisos personalizados en ConstruManage. Servirá como guía y registro de progreso para mantener el contexto del proyecto.

## Etapa 1: Arquitectura y Modelado de Datos en Firebase
En esta etapa se preparará la base de datos para soportar el esquema de autenticación y los permisos por roles granulares.

### Subetapa 1.1: Definición de Colecciones
1. [x] Crear la colección `roles` en Firestore. (Ej: Documento con ID `admin`, con un array/map de permisos).
2. [x] Crear la colección `users` en Firestore para almacenar información adicional de cada usuario autenticado.
3. [x] Relacionar cada documento en `users` con un `roleId`.

### Subetapa 1.2: Catálogo de Permisos
1. [x] Definir todos los permisos posibles del sistema (ej: `VER_PEDIDOS`, `CREAR_PEDIDOS`, `EDITAR_PEDIDOS`, `ELIMINAR_PEDIDOS`, `GESTIONAR_ROLES`, etc.).
2. [x] Crear una constante en el código (ej. en `src/constants/permissions.ts`) con el diccionario de permisos permitidos para asegurar tipado estricto.

## Etapa 2: Autenticación y Contexto Global (Frontend)
Aquí se implementará el inicio de sesión y el almacenamiento del estado del usuario logueado en la aplicación.

### Subetapa 2.1: Integración de Firebase Auth
1. [x] Configurar el proveedor de autenticación en Firebase (Google y/o Correo/Contraseña).
2. [x] Crear la vista y componente de Login (`/login`).
3. [x] Implementar un componente `AuthGuard` o enrutador para proteger la aplicación y redirigir al login a los usuarios no autenticados.

### Subetapa 2.2: Contexto de Roles y Permisos
1. [x] Crear el `AuthContext` (o `PermissionsContext`) que escuche los cambios de `onAuthStateChanged`.
2. [x] Al iniciar sesión, hacer fetch del documento en `users` y su correspondiente `role` en Firestore.
3. [x] Exponer la información completa del usuario y sus permisos al resto de la aplicación (ej. `const { user, hasPermission } = useAuth()`).

## Etapa 3: Reglas de Seguridad en Backend (Firestore Rules)
El frontend se puede manipular, por lo que la verdadera seguridad estará en las reglas de la base de datos.

### Subetapa 3.1: Configuración de Security Rules
1. [x] Modificar `firestore.rules` para validar que el usuario que intenta leer/escribir esté autenticado.
2. [x] Escribir funciones auxiliares en las reglas para consultar el rol del usuario que realiza la petición (evaluando su documento en `users` y `roles`).
3. [x] Restringir el CRUD de colecciones sensibles (ej. `orders`, `sites`, `equipment`) dependiente del rol del usuario.

## Etapa 4: Controles de Acceso en Interfaz de Usuario (UI)
En esta fase se ocultan o bloquean botones y vistas a las que el usuario no debería tener acceso.

### Subetapa 4.1: Protección de Vistas (Rutas)
1. [x] Crear un wrapper `ProtectedRoute` o `RoleRoute` que reciba los permisos necesarios para renderizar una ruta completa.
2. [x] Envolver las rutas en `App.tsx` (ej. si no tiene `VER_RRHH`, ocultar la ruta `/rrhh`).

### Subetapa 4.2: Componentes Condicionales (Renderizado granular)
1. [x] Crear un componente genérico `<Can permission="CREAR_PEDIDOS"> ... </Can>` para envolver botones de acción.
2. [x] Modificar barras laterales, menús y formularios para que funcionen con evaluación condicional de permisos.
3. [x] Deshabilitar o esconder campos de edición en Modales según el nivel de acceso (Lectura vs Escritura).

## Etapa 5: Vistas de Gestión y Administración
Creación del panel en el que los administradores pueden añadir usuarios y editar qué hace cada rol.

### Subetapa 5.1: Módulo de Gestión de Roles
1. [x] Crear la ruta y vista `/ajustes/roles` o dentro de `/rrhh`.
2. [x] Listar todos los roles existentes en una tabla o listado.
3. [x] Crear un formulario (Modal) para crear nuevos roles y marcar/desmarcar checkboxes de permisos individualmente.

### Subetapa 5.2: Asignación a Usuarios
1. [x] Modificar la vista existente de Recursos Humanos (o crear `/usuarios`) para invitar / admitir nuevos miembros al sistema.
2. [x] Crear un selector "Asignar Rol" para cada usuario.
3. [x] Implementar lógica frontend segura para que los administradores asuman usuarios que ingresan por primera vez.

---
**Instrucciones para otros agentes:**
- Evaluar siempre este archivo para determinar en qué subetapa nos encontramos.
- Cambiar el estado de los checkboxes de `[ ]` a `[x]` a medida que se completen las implementaciones en el código.
- Actualizar este documento si se requieren nuevos permisos o reglas no contempladas en el blueprint original.

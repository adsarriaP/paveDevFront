# Integración API (`pave-front` → `pave-back`)

## 1. Estrategia de Cliente HTTP

1. **`useApi` (`src/hooks/useApi.ts`)**: Instancia de Axios configurada con `baseURL: import.meta.env.VITE_API_BASE_URL`.
   - Interceptor de request: inyecta `Authorization: Bearer ${localStorage.getItem('token')}`.
   - Manejo de errores centralizado: extrae `response.data.{msg|message|error|errors[0]}` y muestra toast con `Notiflix.Notify.failure`.
2. **Axios directo (sin token)**: `SignInCard.tsx` llama `POST /auth/login` directamente para procesar payloads `403` con detalles de `periodoActivo`.
3. **`fetch` nativo (blobs Excel)**: `ReporteExcelDialog.tsx`, `ReporteSimplificadoDialog.tsx` y `DashboardHistorico.tsx` descargan archivos `.xlsx` vía `response.blob()`.

## 2. Mapa de Consumo de Endpoints

### Autenticación y Periodos de Acceso
- `POST /auth/login` → `SignInCard.tsx`
- `GET /periodos-acceso/publico/fechas-activo` → `SignInSide.tsx`, `SignInCard.tsx`
- `GET /periodos-acceso/activo` → `EditarSolicitudForm.logic.ts`
- `GET /periodos-acceso/todos` → `TablePeriodosAcceso.tsx`
- `POST /periodos-acceso` / `PATCH /periodos-acceso/:id` → `AperturaPlaneacionVacaciones.tsx`, `SwitchEstado`

### Periodos de Causación y Festivos
- `GET /periodos` → `ReporteExcelDialog.tsx`, `ReporteSimplificadoDialog.tsx`, `tablaAdminSolicitudes.tsx`
- `GET /periodos/activo` → `usePeriodoActivo.ts`, `TableAdminSolicitudes.tsx`, `ReporteInfotipoButton.tsx`, `ReporteInfotipoAplazamiento.tsx`
- `POST /periodos/crear-siguiente` → `CrearPeriodoPlaneacionDialog.tsx`
- `GET /festivos/:year` → `useFestivos.ts` (caché 1 año en `localStorage`)

### Usuarios, Roles y Dependencias
- `GET /usuarios?page=&limit=`, `GET /usuarios/buscar?q=`, `PATCH /usuarios/:id/toggle-estado` → `UserDataTable.tsx`
- `GET /usuarios/jefes`, `GET /roles`, `POST /usuarios`, `PATCH /usuarios/:id` → `FormUsuarios.tsx`, `EditarUsuarioForm.tsx`
- `GET /usuarios/:id`, `GET /dependencias/:id` → `useUserProfile.ts`, `useUserDependencia.ts`
- `GET /usuarios/:id/vacaciones` → `CardsPresentacion.tsx`, `useVacacionesUsuario.ts`
- `GET /dependencias/all`, `GET /dependencias/gerencias`, `GET /dependencias/subgerencias/por-gerencia/:gerencia`, `POST /dependencias`, `PATCH /dependencias/:id`, `PATCH /dependencias/:id/toggle-estado` → módulo `Gestion-Administrador/dependencias/`

### Vacaciones y Solicitudes de Planeación
- `GET /vacaciones?periodoId=&usuarioId=`, `POST /vacaciones/calcular-fechas`, `PATCH /vacaciones/:id/fecha-causacion` → `useVacaciones.ts`
- `PATCH /vacaciones/:id/fechas-manuales` → `EditarUsuarioForm.tsx`
- `GET /vacaciones-historico/usuario/:userId` → `CardsNotificacionDisfrute.tsx`
- `POST /solicitudes` → `FormularioSolicitud.logic.ts`
- `PATCH /solicitudes/:id` → `EditarSolicitudForm.logic.ts`
- `GET /solicitudes/usuario/:userId` → `TableSolicitudes.tsx`
- `GET /solicitudes/periodo/:periodoId` → `TableAdminSolicitudes.tsx`, `ReporteInfotipoButton.tsx`
- `GET /solicitudes/jefe/:userId`, `GET /solicitudes/jefe-cb/:userId` → `TableAprobacion.tsx`
- `GET /solicitudes/jefe/:userId/periodo-activo/:periodoId` → `CalendarComponent.tsx`
- `GET /solicitudes/jefe/:userId/periodo-activo/:periodoId/todas` → `TablaHistoricoPlaneacion.tsx`
- `PATCH /solicitudes/:id/aprobar`, `PATCH /solicitudes/:id/rechazar` → `TableAprobacion.tsx`, `CalendarComponent.tsx`

### Solicitudes de Aplazamiento
- `GET /solicitudes-aplazamiento/periodos-validos/:userId`, `POST /solicitudes-aplazamiento` → `FormularioAplazamiento.logic.ts`
- `PATCH /solicitudes-aplazamiento/:id` → `EditarSolicitudAplazamiento.logic.ts`
- `GET /solicitudes-aplazamiento/usuario/:userId` → `TableSolicitudesAplazamiento.tsx`
- `GET /solicitudes-aplazamiento?periodoId=` → `tablaAdminSolicitudes.tsx`, `ReporteInfotipoAplazamiento.tsx`
- `GET /solicitudes-aplazamiento/mis-solicitudes-nivel-jerarquico/:userId`, `POST /solicitudes-aplazamiento/:id/aprobar`, `POST /solicitudes-aplazamiento/:id/rechazar` → `TablaAprobacionesAplazamiento.tsx`, `CalendarComponentAplazamiento.tsx`
- `GET /solicitudes-aplazamiento/rechazadas-por-jefe-cb?fechaInicio=&fechaFin=` → `TableRechazoAplazamientoJefeCB.tsx`

### Reportes Excel (Binarios vía `fetch`)
- `GET /reportes/vacaciones/excel/periodo/:periodoId` → `ReporteExcelDialog.tsx`
- `GET /reportes/vacaciones/simplificado/periodo/:periodoId` → `ReporteSimplificadoDialog.tsx`
- `GET /reportes/vacaciones/excel/jefe/:userId` → `DashboardHistorico.tsx`

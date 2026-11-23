# Rutas y Control de Acceso (RBAC) — `pave-front`

## 1. Roles y Flags de Acceso

- **Roles**: `ADMINISTRADOR`, `USUARIO`, `JEFE_CB` (Jefe de Compensación y Beneficios), `ANALISTA`.
- **Flag de Jefatura**: `user.esJefe === 1` (espejado en `localStorage.esJefe`).
- **Filtro de Planilla (`ANALISTA`)**: `user.planilla` (`string[]`) filtra solicitudes/reportes comparando contra `usuario.planilla_analista`.

## 2. Pipeline de Validación en `ProtectedRoute.tsx`

Al navegar a cualquier ruta protegida, `ProtectedRoute` evalúa en orden:

1. **Autenticación**: Si no existe `user?.rol` → redirige a `/`.
2. **Feature Flag de Grupo (`isRouteDisabled`)**: Consulta `navGroups` en `AppSidebar.tsx`. **Actualmente el grupo `Aplazamientos` tiene `disabled: true`**, bloqueando sus 6 rutas para **todos** los roles (incluido `ADMINISTRADOR`) y redirigiendo a `/inicio` o `/solicitudes`.
3. **Periodo de Acceso Activo**: Si `requiresPeriodoActivo === true`, la fecha actual está fuera de `[periodoAcceso.fecha_inicio, periodoAcceso.fecha_fin]` y `rol !== 'ADMINISTRADOR'` → redirige a `/solicitudes`.
4. **Bypass Administrador**: Si `rol === 'ADMINISTRADOR'`, omite validaciones de `requiresManager` y `allowedRoles`.
5. **Validación de Jefatura**: Si `requiresManager === true` y `!isManager` y `rol !== 'JEFE_CB'` → redirige a `/inicio`.
6. **Lista de Roles Permitidos**: Si `rol` no está en `allowedRoles` → redirige a `/inicio`.

## 3. Matriz Completa de Rutas (`src/routes/Routers.tsx`)

| Ruta | Página | Roles Permitidos | `requiresManager` | `requiresPeriodoActivo` | Grupo / Estado |
|---|---|---|---|---|---|
| `/` | `SignInSide` | Público | No | No | Login |
| `/inicio` | `DashboardInicio` | Todos | No | **Sí** | Planeación |
| `/perfil` | `DashboardPerfil` | Todos | No | No | Menú Usuario |
| `/solicitudes` | `DashboardSolicitudes` | Todos | No | No | Planeación |
| `/aprobacion` | `DashboardAprobacion` | `ADMINISTRADOR`, `USUARIO`, `JEFE_CB` | **Sí** | **Sí** | Planeación |
| `/calendario` | `DashboardCalendario` | `ADMINISTRADOR`, `USUARIO`, `JEFE_CB` | **Sí** | **Sí** | Planeación |
| `/historicoPlaneacion` | `DashboardHistorico` | `ADMINISTRADOR`, `USUARIO`, `JEFE_CB` | **Sí** | No | Planeación |
| `/reportes` | `DashboardAdminSolicitudes` | `ADMINISTRADOR`, `ANALISTA` | No | No | Planeación |
| `/solicitarAplazamiento` | `DashboardAplazamiento` | Todos | No | No | Aplazamientos *(disabled)* |
| `/aplazamientosSolicitudes` | `DashboardSolicitudesAplazamientos` | Todos | No | No | Aplazamientos *(disabled)* |
| `/aplazamientosAprobaciones` | `DashboardAprobacionesAplazamientos` | `ADMINISTRADOR`, `USUARIO`, `JEFE_CB` | **Sí** | No | Aplazamientos *(disabled)* |
| `/calendarioAprobacion` | `DashboardCalendarioAplazamientos` | Todos | **Sí** | No | Aplazamientos *(disabled)* |
| `/adminAplazamientos` | `DashboardAdminAplazamientos` | `ADMINISTRADOR`, `ANALISTA` | No | No | Aplazamientos *(disabled)* |
| `/rechazoAplazamientos` | `DashboardRechazoAplazamiento` | `ADMINISTRADOR` | No | No | Aplazamientos *(disabled)* |
| `/usuarios` | `DashboardUsuarios` | `ADMINISTRADOR` | No | No | Administrar |
| `/jefes` | `DashboardDependencias` | `ADMINISTRADOR` | No | No | Administrar |
| `/periodo-acceso` | `DashboardPeriodoAcceso` | `ADMINISTRADOR` | No | No | Administrar |

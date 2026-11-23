# Arquitectura Técnica — `pave-front`

## 1. Stack Tecnológico

- **Core**: React `19.0.0`, TypeScript `~5.7.2`, Vite `6.2.0` (`@vitejs/plugin-react`, alias `@` → `./src`).
- **Ruteo**: `react-router-dom` `^7.4.0`.
- **Estado Global**: `@reduxjs/toolkit` `^2.6.1` + `react-redux` `^9.2.0` (slice único `auth`).
- **HTTP**: `axios` `^1.8.4` (a través del hook `useApi`) + `fetch` nativo para descargas binarias `.xlsx`.
- **UI y Estilos**: Tailwind CSS `^4.0.16`, **shadcn/ui** (`new-york`, variables CSS OKLCH en `src/index.css`, color primario verde EMCALI `oklch(0.624 0.19 145)`, soporte modo claro/oscuro con clase `.dark`), Radix UI, `lucide-react`.
- **Tablas y Gráficos**: `@tanstack/react-table` v8, `chart.js` / `react-chartjs-2`, `recharts`.
- **Fechas, PDF y Notificaciones**: `date-fns`, `react-day-picker`, `jspdf` + `jspdf-autotable`, `notiflix`.

## 2. Despliegue en Vercel (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
- Garantiza que cualquier ruta profunda (`/solicitudes`, `/aprobacion`, `/usuarios`, etc.) resuelva hacia `index.html` y sea manejada por `BrowserRouter`.
- **Variables de entorno**:
  - `VITE_API_BASE_URL`: URL base del backend (ej. `http://localhost:3002/pav` o URL de producción).
  - *(Nota: `REACT_APP_BACKEND_URL` aparece en `.env.example`, pero no se utiliza en `src/`).*

## 3. Organización de Capas (`src/`)

- **`src/store/`**: Redux store con `authSlice` (`token`, `user`, `isAuthenticated`, `periodoAcceso`), hidratado sincrónicamente desde `localStorage`.
- **`src/routes/`**: `Routers.tsx` (17 rutas) y `ProtectedRoute.tsx` (guardia de autenticación, feature flags, periodo activo, jefatura y roles).
- **`src/hooks/`**: `useApi`, `useFestivos` (caché 1 año en `localStorage` bajo `festivos-colombia-v3-${year}`), `usePeriodoActivo`, `usePermissions`, `useVacaciones`, `usePaginatedTable`, `useDebounce`, `use-mobile`.
- **`src/pages/`**: Vistas agrupadas por dominio:
  - `Generales/`: `login/`, `DashboardInicio`, `DashboardPerfil`.
  - `Planeacion/`: Solicitudes, Aprobación, Calendario, Histórico, Reportes Admin.
  - `Aplazamientos/`: Solicitar, Mis Solicitudes, Aprobaciones, Calendario, Admin, Rechazos Jefe CB.
  - `Administrador/`: Usuarios, Dependencias, Periodos de Acceso.
- **`src/components/`**:
  - Patrón `*.tsx` + `*.logic.ts` en formularios complejos (`FormularioSolicitud`, `EditarSolicitudForm`, `FormularioAplazamiento`, `EditarSolicitudAplazamiento`).
  - `layouts/`: `MainLayout` (shadcn `SidebarProvider`), `AppSidebar`, `ThemeToggle`.
  - `ui/`: 31 primitivos shadcn/ui y componentes compartidos (`SwitchEstado`, `TableSkeleton`, `LoadingState`).
- **`src/lib/date-utils.ts`**: Manipulación segura de fechas `YYYY-MM-DD` sin corrimiento de zona horaria (ancla objetos `Date` al mediodía local `12:00:00`).

## 4. Generación de Documentos en Cliente

1. **Certificado y Memorando de Vacaciones (PDF)**: Generados en navegador con `jsPDF` y `jspdf-autotable` (`CertificadoVacaciones.tsx`, `MemorandoVacaciones.tsx`).
2. **Archivo SAP Infotipo (CSV)**: Generado en cliente (`ReporteInfotipoButton.tsx`, `ReporteInfotipoAplazamiento.tsx`) con columnas `No personal,De,A,Clase presencia` (código constante `9001`, fechas `dd.mm.yyyy`) para solicitudes aprobadas (`estado === 3` en planeación).

## 5. Notas de Mantenimiento

- `front/` en la raíz es una copia local no versionada en Git; no forma parte del build de Vite ni Vercel.
- En `CardsPresentacion.tsx`, los componentes `FormularioSolicitud` y `CardsNotificacionDisfrute` se encuentran temporalmente comentados.

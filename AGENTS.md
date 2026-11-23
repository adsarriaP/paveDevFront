# Reglas del Workspace: `pave-front` (Sistema PAVE — EMCALI)

SPA en **React 19 + TypeScript + Vite 6 + Redux Toolkit + Tailwind CSS v4 + shadcn/ui**, desplegada en **Vercel** (`vercel.json`).

## Arquitectura y Convenciones Clave

- **Ruteo SPA (`vercel.json`)**: Todas las rutas se reescriben a `/` (`{ "source": "/(.*)", "destination": "/" }`). No eliminar esta regla.
- **Control de acceso (`src/routes/ProtectedRoute.tsx` y `AppSidebar.tsx`)**:
  - Roles: `ADMINISTRADOR`, `USUARIO`, `JEFE_CB`, `ANALISTA`.
  - Flag adicional: `esJefe === 1` (almacenado en usuario Redux y `localStorage`).
  - **Feature flag activo**: El grupo `Aplazamientos` en `AppSidebar.tsx` tiene `disabled: true`, bloqueando las 6 rutas de aplazamientos para todos los roles.
- **Fechas sin desfase de zona horaria**:
  - Usar siempre `src/lib/date-utils.ts` para formatear `YYYY-MM-DD` ↔ `DD/MM/YYYY` y anclar fechas de calendario al mediodía local (`12:00:00`). Nunca usar `new Date("YYYY-MM-DD")` directamente para mostrar días.
- **Organización e importaciones**:
  - Usar importaciones absolutas con alias `@/` para `src/` (`vite.config.ts`).
  - Mantener primitivos genéricos de UI (shadcn/ui sobre Radix UI) en `src/components/ui/`.
  - Formularios complejos separan vista (`*.tsx`) de lógica/estado (`*.logic.ts`).
- **Consumo de API**:
  - Usar `useApi()` (`src/hooks/useApi.ts`) para peticiones JSON autenticadas (inyecta `Authorization: Bearer <token>` y muestra errores vía Notiflix).
  - Usar `fetch` nativo solo para descargas binarias `.xlsx` (ver `ReporteExcelDialog.tsx`).
  - Nunca leer ni exponer secretos de `.env`.

## Documentación y Skills del Proyecto

- Documentación técnica completa: `docs/README.md`, `docs/ARQUITECTURA.md`, `docs/RUTAS_Y_PERMISOS.md`, `docs/INTEGRACION_API.md`.
- Diagramas Draw.io: `docs/diagramas/componentes-frontend.drawio`.
- Skills disponibles en `.agents/skills/`: `frontend-feature-workflow`, `pave-orchestrator`.

## Comandos de Verificación

- Compilar (typecheck + bundle): `npm run build` (o `yarn build`)
- Lint: `npm run lint` (o `yarn lint`)
- Desarrollo local: `npm run dev` (o `yarn dev`) — `http://localhost:5173`
- Preview producción: `npm run preview` (o `yarn preview`)

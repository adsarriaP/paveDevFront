---
name: frontend-feature-workflow
description: >-
  Convenciones y lista de verificacion para desarrollar o modificar pantallas,
  rutas, formularios, permisos RBAC y consumo de API en pave-front.
---

# Flujo de Trabajo Frontend (`pave-front`)

## Checklist de Desarrollo
1. **Rutas y Permisos**:
   - Registrar nuevas páginas en `src/routes/Routers.tsx` envueltas en `ProtectedRoute` con `allowedRoles`, `requiresManager` y `requiresPeriodoActivo`.
   - Agregar el ítem al menú correspondiente en `src/components/layouts/AppSidebar.tsx`.
2. **Tipado y Contratos**:
   - Actualizar `src/types/entities.types.ts` y `src/types/api.types.ts` en sincronía con los DTOs de `pave-back`.
3. **Lógica y UI**:
   - Extraer lógica compleja de formularios a un hook en `*.logic.ts`.
   - Usar componentes de `src/components/ui/` (shadcn/ui `new-york`), `@tanstack/react-table` para tablas y `Notiflix` para notificaciones.
   - Usar `src/lib/date-utils.ts` para cualquier manipulación de fechas `YYYY-MM-DD`.
4. **Despliegue Vercel**:
   - Mantener el rewrite SPA en `vercel.json` (`/(.*) -> /`) y usar únicamente `import.meta.env.VITE_API_BASE_URL`.

## Verificación Obligatoria
```powershell
npm run build
npm run lint
```

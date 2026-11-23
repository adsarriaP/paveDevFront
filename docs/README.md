# Documentación Técnica — `pave-front` (Sistema PAVE EMCALI)

Aplicación web SPA de la **Plataforma de Administración de Vacaciones (PAVE)** de **EMCALI**, construida con **React 19**, **TypeScript**, **Vite 6**, **Redux Toolkit** y **Tailwind CSS v4 + shadcn/ui**, desplegada en **Vercel**.

## Índice de Documentación

| Documento | Contenido |
|---|---|
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Stack técnico, estructura de carpetas, estado global (Redux + localStorage), `vercel.json`, manejo de fechas y generación de PDFs / CSV SAP Infotipo. |
| [RUTAS_Y_PERMISOS.md](./RUTAS_Y_PERMISOS.md) | Matriz completa de las 17 rutas, pipeline de `ProtectedRoute`, roles, `esJefe`, `periodoAcceso` y feature flag de `Aplazamientos`. |
| [INTEGRACION_API.md](./INTEGRACION_API.md) | Arquitectura del cliente HTTP (`useApi`, `axios` directo, `fetch` blobs) y mapa completo de pantallas/componentes hacia `pave-back`. |

## Diagramas Draw.io (`docs/diagramas/`)

- **[componentes-frontend.drawio](./diagramas/componentes-frontend.drawio)**: Diagrama de componentes de la SPA, ruteo, estado Redux, módulos funcionales, generación de documentos y despliegue en Vercel.

## Automatización y Agentes (`.agents/`)

- Reglas raíz: [AGENTS.md](../AGENTS.md)
- Hooks de ciclo de vida: [.agents/hooks.json](../.agents/hooks.json)
- Skills: `frontend-feature-workflow`, `pave-orchestrator`.

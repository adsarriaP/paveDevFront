# PAVE Front - Aplicación React TypeScript

## Descripción del Proyecto
**PAVE Front** es una aplicación web basada en React construida con TypeScript y Vite para EMCALI (Empresas Municipales de Cali). Es un sistema de gestión de empleados enfocado en solicitudes y aprobaciones de vacaciones y permisos.

## Stack Tecnológico
- **Framework**: React 19 con TypeScript
- **Herramienta de Build**: Vite 6.2
- **Estilos**: Tailwind CSS 4.0
- **Componentes UI**: Primitivas de Radix UI con componentes personalizados
- **Gestión de Estado**: Redux Toolkit
- **Enrutamiento**: React Router DOM v7
- **Gráficos**: Chart.js + React Chart.js 2, Recharts
- **Cliente HTTP**: Axios
- **Manejo de Fechas**: date-fns, React Day Picker
- **Iconos**: Lucide React
- **Notificaciones**: Notiflix

## Estructura del Proyecto

```
src/
├── components/           # Componentes UI reutilizables
│   ├── aprobacion/      # Componentes relacionados con aprobaciones
│   ├── calendario/      # Componentes de calendario
│   ├── dependencias/    # Gestión de departamentos/dependencias
│   ├── inicio/          # Componentes de inicio/dashboard
│   ├── layouts/         # Componentes de layout (sidebar, tema)
│   ├── perfil/         # Componentes de perfil de usuario
│   ├── solicitudes/    # Gestión de solicitudes
│   ├── ui/             # Componentes UI base (botones, tarjetas, etc.)
│   └── usuarios/       # Gestión de usuarios
├── hooks/              # Hooks personalizados de React
├── pages/              # Componentes de página organizados por funcionalidad
├── routes/             # Configuración de rutas y protección
├── store/              # Store de Redux y slices
└── types/              # Definiciones de tipos TypeScript
```

## Características Principales
- **Gestión de Empleados**: Creación y gestión de usuarios con acceso basado en roles
- **Solicitudes de Vacaciones/Permisos**: Enviar y rastrear solicitudes de vacaciones
- **Sistema de Aprobación**: Flujo de trabajo para aprobaciones de solicitudes
- **Integración de Calendario**: Calendario visual para programación
- **Gestión de Departamentos**: Organizar usuarios por departamentos/dependencias
- **Exportación de Datos**: Funcionalidad de exportación para reportes
- **Gestión de Perfil**: Perfil de usuario y configuraciones
- **Soporte de Temas**: Alternador de modo claro/oscuro

## Scripts de Desarrollo
- `yarn dev` o `yarn start` - Iniciar servidor de desarrollo
- `yarn build` - Construir para producción (ejecuta verificación TypeScript + build Vite)
- `yarn lint` - Ejecutar ESLint
- `yarn preview` - Previsualizar build de producción localmente

## Guías de Desarrollo

### Organización del Código
- Usar importaciones absolutas con alias `@/` para el directorio src
- Seguir organización basada en características en `pages/` y `components/`
- Mantener componentes UI genéricos en `components/ui/`
- Almacenar lógica de negocio en hooks personalizados (`hooks/`)

### Gestión de Estado
- Usar Redux Toolkit para estado global
- Estado de autenticación gestionado en `store/slices/authSlice.ts`
- Llamadas API manejadas a través de `hooks/useApi.ts`

### Estilos
- Tailwind CSS para estilos
- Componentes UI personalizados construidos sobre primitivas Radix UI
- Patrones de diseño responsivo
- Soporte de temas vía variables CSS

### Integración API
- Axios para peticiones HTTP
- Hooks personalizados para llamadas API (`useApi.ts`, `useVacaciones.ts`, etc.)
- Interfaces API type-safe en `types/api.types.ts`

### TypeScript
- Configuración estricta de TypeScript
- Definiciones de tipos organizadas en directorio `types/`
- Definiciones de tipos basadas en interfaces para entidades y respuestas API

## Componentes Clave

### Layout y Navegación
- `MainLayout.tsx` - Layout principal de aplicación con sidebar
- `AppSidebar.tsx` - Sidebar de navegación
- `ThemeToggle.tsx` - Alternador de modo claro/oscuro

### Componentes de Funcionalidad
- `FormularioSolicitud.tsx` - Formulario de solicitud de vacaciones
- `TableSolicitudes.tsx` - Tabla de datos de solicitudes
- `CalendarComponent.tsx` - Vista de calendario
- `UserDataTable.tsx` - Tabla de gestión de usuarios
- `CardsPresentacion.tsx` - Tarjetas del dashboard

### Autenticación
- Rutas protegidas vía `ProtectedRoute.tsx`
- Gestión de estado de auth en Redux
- Componentes de login en `pages/login/`

## Notas de Desarrollo
- El proyecto usa patrones modernos de React (hooks, componentes funcionales)
- Diseño responsivo con enfoque mobile-first
- Manejo de formularios con hooks personalizados
- Tablas de datos con ordenamiento y filtrado
- Visualizaciones de gráficos para analíticas
- Sistema de notificaciones para feedback del usuario

## Configuración del Entorno
1. Instalar dependencias: `yarn install`
2. Iniciar servidor de desarrollo: `yarn dev`
3. Acceder a la aplicación en `http://localhost:5173`

## Build y Despliegue
- Build de producción: `yarn build`
- Archivos construidos se generan en directorio `dist/`
- Compilación TypeScript verificada antes del build
- Assets optimizados por Vite

## Testing y Calidad
- ESLint para linting de código
- TypeScript para verificación de tipos
- Ejecutar `yarn lint` antes de commits
- Usar `yarn build` para verificar preparación para producción
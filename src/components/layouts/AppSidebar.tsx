// src/components/layouts/AppSidebar.tsx
import * as React from 'react';
import {
  Users,
  Home,
  List,
  ListChecks,
  CalendarCheck,
  LayoutGrid,
  KeyRound,
  ChevronRight,
  CalendarX2,
  CalendarSearch,
  History,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NavUser } from '@/components/layouts/nav-user';


export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  roles: string[];
  requiresManager: boolean;
};

export type NavGroup = {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  disabled?: boolean;
  items: NavItem[];
};

// Definición de elementos de navegación agrupados por categorías
export const navGroups: NavGroup[] = [
  {
    title: 'Planeación',
    icon: CalendarSearch,
    items: [
      {
        title: 'Inicio',
        url: '/inicio',
        icon: Home,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA'],
        requiresManager: false,
      },
      {
        title: 'Mis solicitudes',
        url: '/solicitudes',
        icon: List,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA'],
        requiresManager: false,
      },
      {
        title: 'Pendientes por aprobación',
        url: '/aprobacion',
        icon: ListChecks,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB'],
        requiresManager: true,
      },
      {
        title: 'Calendario',
        url: '/calendario',
        icon: CalendarCheck,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB'],
        requiresManager: true,
      },
      {
        title: 'Historico de planeacion',
        url: '/historicoPlaneacion',
        icon: History,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB'],
        requiresManager: true,
      },
      {
        title: 'Reportes e infotipo',
        url: '/reportes',
        icon: CalendarCheck,
        roles: ['ADMINISTRADOR', 'ANALISTA'],
        requiresManager: false,
      },
    ],
  },
  {
    title: 'Aplazamientos',
    icon: CalendarX2,
    disabled: true, // true (bloqueo) false (habilitado) el grupo de Aplazamientos
    items: [
      {
        title: 'Solicitar aplazamiento',
        url: '/solicitarAplazamiento',
        icon: List,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA'],
        requiresManager: false,
      },
      {
        title: 'Solicitudes de aplazamiento',
        url: '/aplazamientosSolicitudes',
        icon: List,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA'],
        requiresManager: false,
      },
      {
        title: 'Pendientes por aprobación',
        url: '/aplazamientosAprobaciones',
        icon: List,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB'],
        requiresManager: true,
      },
      {
        title: 'Calendario de aplazamiento',
        url: '/calendarioAprobacion',
        icon: List,
        roles: ['ADMINISTRADOR', 'USUARIO', 'JEFE_CB'],
        requiresManager: true,
      },
      {
        title: 'Infotipo de aplazamientos',
        url: '/adminAplazamientos',
        icon: List,
        roles: ['ADMINISTRADOR', 'ANALISTA'],
        requiresManager: false,
      },
      {
        title: 'Rechazo de aplazamientos',
        url: '/rechazoAplazamientos',
        icon: List,
        roles: ['ADMINISTRADOR'],
        requiresManager: false,
      },
    ],
  },
];

// Verifica si una ruta pertenece a un grupo deshabilitado (disabled: true)
export const isRouteDisabled = (pathname: string): boolean => {
  return navGroups.some(
    (group) =>
      group.disabled === true &&
      group.items.some(
        (item) => pathname === item.url || pathname.startsWith(`${item.url}/`)
      )
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { setOpenMobile, state } = useSidebar();

  // Obtener información del usuario desde Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const periodoAcceso = useSelector(
    (state: RootState) => state.auth.periodoAcceso
  );
  const userRole = localStorage.getItem('rol') || (user?.rol as string);

  // Simplificado: verificamos directamente el número que viene del backend
  const isManager =
    user?.esJefe === 1 || localStorage.getItem('esJefe') === '1';

  // Verificar si estamos dentro del periodo de acceso
  const isDentroDePeriodo = React.useMemo(() => {
    // Si no hay periodo definido, no está dentro del periodo
    if (!periodoAcceso) {
      console.log('❌ No hay periodo de acceso definido');
      return false;
    }

    const fechaActual = new Date();
    const fechaInicio = new Date(periodoAcceso.fecha_inicio);
    const fechaFin = new Date(periodoAcceso.fecha_fin);

    const dentro = fechaActual >= fechaInicio && fechaActual <= fechaFin;

    console.log('🔍 Verificación de periodo:', {
      periodoAcceso,
      fechaActual: fechaActual.toISOString(),
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      isDentro: dentro,
    });

    // Retorna true si estamos dentro de las fechas
    return dentro;
  }, [periodoAcceso]);

  // Estado para controlar qué grupos están abiertos
  // Inicializar con el primer grupo disponible
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);
  const hasInitialized = React.useRef(false);

  // Función para alternar el estado de un grupo
  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupTitle)
        ? prev.filter((title) => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  // Función reutilizable para filtrar items según permisos
  const filterItemsByPermissions = (items: NavItem[]) => {
    return items.filter((item) => {
      // Si es administrador, mostrar todas las opciones
      if (userRole === 'ADMINISTRADOR') {
        return true;
      }

      // Bloquear rutas específicas si NO hay periodo o está fuera del periodo de acceso
      const rutasBloqueadas = ['/inicio', '/aprobacion', '/calendario'];
      if (rutasBloqueadas.includes(item.url) && !isDentroDePeriodo) {
        return false;
      }

      // Si el ítem requiere ser jefe y el usuario lo es (o es JEFE_CB que no necesita validar esJefe)
      if (item.requiresManager && (isManager || userRole === 'JEFE_CB')) {
        return item.roles && item.roles.includes(userRole);
      }

      // Verificación normal por rol (para opciones que no requieren ser jefe)
      if (
        !item.requiresManager &&
        item.roles &&
        item.roles.includes(userRole)
      ) {
        return true;
      }

      return false;
    });
  };

  // Filtrar grupos de navegación según el rol del usuario y si es jefe
  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: filterItemsByPermissions(group.items as NavItem[]),
    }))
    .filter((group) => group.items.length > 0); // Solo mostrar grupos que tengan elementos

  // Efecto para abrir el grupo de Planeación automáticamente solo al cargar
  React.useEffect(() => {
    if (filteredNavGroups.length > 0 && !hasInitialized.current) {
      // Solo abrir Planeación si existe y no está deshabilitado, de lo contrario dejar todos cerrados
      const planeacionGroup = filteredNavGroups.find(
        (group) => group.title === 'Planeación' && !group.disabled
      );
      if (planeacionGroup) {
        setOpenGroups([planeacionGroup.title]);
      }
      hasInitialized.current = true;
    }
  }, [filteredNavGroups]);

  // Items de administración
  const adminItems = [
    {
      title: 'Usuarios',
      url: '/usuarios',
      icon: Users,
      roles: ['ADMINISTRADOR'],
      requiresManager: false,
    },
    {
      title: 'Dependencias',
      url: '/jefes',
      icon: LayoutGrid,
      roles: ['ADMINISTRADOR'],
      requiresManager: false,
    },
    {
      title: 'Periodos de acceso',
      url: '/periodo-acceso',
      icon: KeyRound,
      roles: ['ADMINISTRADOR'],
      requiresManager: false,
    },
  ];

  // Filtrar items de administración según permisos (usando la misma función)
  const filteredAdminItems = filterItemsByPermissions(adminItems as NavItem[]);

  // Determinar si un elemento está activo
  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  // Función reutilizable para renderizar items (igual que en collapsibles)
  const renderItems = (items: NavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuSubButton asChild isActive={isActive(item.url)}>
          <Link to={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex h-10 items-center justify-center">
            {state !== 'collapsed' ? (
              <>
                <img
                  src="/images/logo-emcali.webp"
                  alt="EMCALI Logo"
                  className="h-auto w-38 dark:hidden"
                />
                <img
                  src="/images/logo-emcali-clear.webp"
                  alt="EMCALI Logo"
                  className="hidden h-auto w-42 dark:block"
                />
              </>
            ) : (
              <>
                <img
                  src="/images/LOGOEMCALIICONO.webp"
                  alt="EMCALI Icon"
                  className="h-8 w-8 dark:hidden"
                />
                <img
                  src="/images/icono-emcali-clear.webp"
                  alt="EMCALI Icon"
                  className="hidden h-8 w-8 dark:block"
                />
              </>
            )}
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {filteredNavGroups.map((group) => {
            const isDisabled = group.disabled === true;

            return (
              <Collapsible
                key={group.title}
                disabled={isDisabled}
                open={!isDisabled && openGroups.includes(group.title)}
                onOpenChange={() => {
                  if (!isDisabled) {
                    toggleGroup(group.title);
                  }
                }}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild disabled={isDisabled}>
                    <SidebarMenuButton
                      tooltip={
                        isDisabled
                          ? `${group.title} (Deshabilitado)`
                          : group.title
                      }
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      className={
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed pointer-events-none select-none'
                          : ''
                      }
                    >
                      {group.icon && <group.icon />}
                      <span>{group.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!isDisabled && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                              onClick={() => setOpenMobile(false)}
                            >
                              <Link to={item.url}>
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>

        {/* Sección Administrar */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Administrar</SidebarGroupLabel>
            <SidebarMenu>{renderItems(filteredAdminItems)}</SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.nombre || 'Usuario',
              user: user.user,
              avatar: '',
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

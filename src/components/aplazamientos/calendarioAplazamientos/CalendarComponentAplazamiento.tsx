import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useApi } from '@/hooks/useApi';
import { RootState } from '@/store/store';
import { ConfirmDialogAplazamiento } from './ConfirmDialogAplazamiento';

// Interfaces para los datos del backend
interface ApiResponseAplazamiento {
  ok: boolean;
  msg: string;
  data: {
    solicitudes: SolicitudAplazamientoBackend[];
    nivelUsuario: string;
    resumen: {
      total: number;
      pendientes: number;
      paraAprobacion: number;
    };
    estadosVisibles: string[];
  };
}

interface SolicitudAplazamientoBackend {
  id: number;
  usuario_id: number;
  periodos_id: number;
  vacacion_id: number;
  estado: number;
  observaciones: string | null;
  fecha_solicitud: string;
  fecha_disfrute_actual: string;
  fecha_retorno_actual: string;
  fecha_disfrute_secundario_actual: string | null;
  fecha_retorno_secundario_actual: string | null;
  fecha_disfrute_nueva: string;
  fecha_retorno_nueva: string;
  fecha_disfrute_secundario_nueva: string | null;
  fecha_retorno_secundario_nueva: string | null;
  dias_principal: number;
  dias_secundario: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  historico: string;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    rol_id: number;
    dependencia_id: number;
    estado: number;
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
  };
  flujoJerarquico: {
    nivel: string;
    aprobacionesRealizadas: Record<string, unknown>[];
    siguienteAprobador: string;
    puedeAprobar: Array<{
      usuario: string;
      nivel: string;
    }>;
  };
  puedeAprobarComo: string;
  estadoGranular: string;
  puedeAprobar: boolean;
}

// Nombres de los meses en español
const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// Función para obtener el badge de estado
const getEstadoBadge = (estado: number) => {
  switch (estado) {
    case 0:
      return <Badge variant="outline">Cancelada</Badge>;
    case 1:
      return <Badge variant="status-pendiente">Pendiente</Badge>;
    case 2:
      return <Badge variant="status-alerta">Rechazada</Badge>;
    case 3:
      return <Badge variant="status-activo">Aprobado Jefe</Badge>;
    case 4:
      return <Badge variant="status-activo">Aprobado Gerente</Badge>;
    case 5:
      return <Badge variant="status-activo">Aprobado Gestor</Badge>;
    case 6:
      return <Badge variant="status-activo">Aprobada Final</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const CalendarComponentAplazamiento = () => {
  // Inicializar con el año siguiente
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 1);
  const [userSchedules, setUserSchedules] = useState<SolicitudCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    solicitud: { id: number; userName: string } | null;
    accion: 'aprobar' | 'rechazar' | null;
  }>({ open: false, solicitud: null, accion: null });

  const { get, post } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);

  // Función para convertir solicitud del backend a formato del calendario
  const convertirSolicitud = (
    solicitud: SolicitudAplazamientoBackend
  ): SolicitudCalendario[] => {
    const vacaciones: SolicitudCalendario[] = [];

    // Período principal
    vacaciones.push({
      id: solicitud.id * 10, // Multiplicar para evitar conflictos con período secundario
      originalId: solicitud.id, // ID original de la solicitud
      userId: solicitud.usuario.id,
      userName: solicitud.usuario.user,
      startDate: new Date(solicitud.fecha_disfrute_nueva + 'T00:00:00'),
      endDate: new Date(solicitud.fecha_retorno_nueva + 'T00:00:00'),
      isPeriodoPrincipal: true,
      estado: solicitud.estado,
      puedeAprobar: solicitud.puedeAprobar,
      periodo: solicitud.periodos.nombre,
    });

    // Período secundario (si existe)
    if (
      solicitud.fecha_disfrute_secundario_nueva &&
      solicitud.fecha_retorno_secundario_nueva
    ) {
      vacaciones.push({
        id: solicitud.id * 10 + 1, // Añadir 1 para período secundario
        originalId: solicitud.id, // Mismo ID original para ambos períodos
        userId: solicitud.usuario.id,
        userName: solicitud.usuario.user,
        startDate: new Date(
          solicitud.fecha_disfrute_secundario_nueva + 'T00:00:00'
        ),
        endDate: new Date(
          solicitud.fecha_retorno_secundario_nueva + 'T00:00:00'
        ),
        isPeriodoPrincipal: false,
        estado: solicitud.estado,
        puedeAprobar: solicitud.puedeAprobar,
        periodo: solicitud.periodos.nombre,
      });
    }

    return vacaciones;
  };

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setUserSchedules([]);
        return;
      }

      // Usar el endpoint de aplazamientos
      const response = await get<ApiResponseAplazamiento>(
        `solicitudes-aplazamiento/mis-solicitudes-nivel-jerarquico/${user.id}`
      );

      // Filtrar solicitudes: pendientes (1), aprobado jefe (3), aprobado gerente (4), aprobado administrador (5)
      const solicitudesFiltradas = response.data.solicitudes.filter(
        (solicitud) =>
          solicitud.estado === 1 ||
          solicitud.estado === 3 ||
          solicitud.estado === 4 ||
          solicitud.estado === 5
      );

      const vacacionesCalendario: SolicitudCalendario[] = [];
      solicitudesFiltradas.forEach((solicitud) => {
        const vacaciones = convertirSolicitud(solicitud);
        vacacionesCalendario.push(...vacaciones);
      });

      setUserSchedules(vacacionesCalendario);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      setUserSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar aprobación y rechazo
  const handleAprobar = async (id: number) => {
    try {
      if (!user?.id) {
        Notify.failure('No hay usuario logueado');
        return;
      }

      await post(`solicitudes-aplazamiento/${id}/aprobar`, {
        usuarioAprobadorId: user.id,
      });

      fetchSolicitudes();
      Notify.success('Solicitud aprobada exitosamente');
    } catch (error) {
      console.error('Error approving solicitud:', error);
      Notify.failure('Error al aprobar la solicitud');
    }
  };

  const handleRechazar = async (id: number, motivoRechazo: string) => {
    try {
      if (!user?.id) {
        Notify.failure('No hay usuario logueado');
        return;
      }

      await post(`solicitudes-aplazamiento/${id}/rechazar`, {
        usuarioRechazadorId: user.id,
        motivoRechazo,
      });

      fetchSolicitudes();
      Notify.success('Solicitud rechazada exitosamente');
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
      Notify.failure('Error al rechazar la solicitud');
    }
  };

  const handleConfirm = async (motivo?: string) => {
    if (confirmDialog.accion === 'aprobar' && confirmDialog.solicitud) {
      await handleAprobar(confirmDialog.solicitud.id);
    }
    if (
      confirmDialog.accion === 'rechazar' &&
      confirmDialog.solicitud &&
      motivo
    ) {
      await handleRechazar(confirmDialog.solicitud.id, motivo);
    }
    setConfirmDialog({ open: false, solicitud: null, accion: null });
  };

  const handleOpenConfirmDialog = (
    solicitud: { id: number; userName: string },
    accion: 'aprobar' | 'rechazar'
  ) => {
    setConfirmDialog({
      open: true,
      solicitud,
      accion,
    });
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    if (user?.id) {
      fetchSolicitudes();
    }
  }, [user?.id]);

  // Construir meses y filtrar usuarios por año actual
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(currentYear, index, 1);
      const monthUsers = userSchedules.filter((schedule) => {
        const scheduleYear = schedule.startDate.getFullYear();
        const scheduleMonth = schedule.startDate.getMonth();
        return scheduleYear === currentYear && scheduleMonth === index;
      });

      return {
        date: monthDate,
        name: monthNames[index],
        users: monthUsers,
      };
    });
  }, [userSchedules, currentYear]);

  const handlePreviousYear = () => {
    setCurrentYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear((prev) => prev + 1);
  };

  const handleYearChange = (year: string) => {
    setCurrentYear(parseInt(year));
  };

  // Generar años para el selector
  const currentYearBase = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, index) => {
    const year = currentYearBase + 1 + index;
    return year.toString();
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md bg-muted/30">
        <CardHeader className=" border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="text-primary h-6 w-6" />
              Calendario de Aplazamientos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousYear}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select
                value={currentYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={currentYear} />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleNextYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Cargando solicitudes...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {months.map((month) => (
                <MonthCard
                  key={month.name}
                  month={month}
                  allSchedules={userSchedules}
                  onOpenConfirmDialog={handleOpenConfirmDialog}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialogAplazamiento
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        accion={confirmDialog.accion ?? 'aprobar'}
        nombre={confirmDialog.solicitud?.userName ?? ''}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

// Definición de tipos
interface SolicitudCalendario {
  id: number;
  originalId: number; // ID original de la solicitud para las acciones
  userId: number;
  userName: string;
  startDate: Date;
  endDate: Date;
  isPeriodoPrincipal: boolean;
  estado: number;
  puedeAprobar: boolean;
  periodo: string;
}

interface Month {
  date: Date;
  name: string;
  users: SolicitudCalendario[];
}

interface MonthCardProps {
  month: Month;
  allSchedules: SolicitudCalendario[];
  onOpenConfirmDialog: (
    solicitud: { id: number; userName: string },
    accion: 'aprobar' | 'rechazar'
  ) => void;
}

// Componente para mostrar un mes individual
const MonthCard = ({
  month,
  allSchedules,
  onOpenConfirmDialog,
}: MonthCardProps) => {
  const hasUsers = month.users.length > 0;

  // Función para formatear la fecha en formato dd/MM
  const formatDateShort = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        hasUsers ? 'ring-1 ring-primary/20' : ''
      }`}
    >
      <CardHeader
        className={`py-2 rounded-t-md ${hasUsers ? 'bg-primary/5' : ''}`}
      >
        <CardTitle className="capitalize text-lg font-semibold">
          {month.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {hasUsers ? (
          <ScrollArea className="h-60">
            <div className="space-y-2 pr-4">
              {month.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-2 text-sm rounded-md p-2 hover:bg-muted border border-gray-200 dark:border-gray-700"
                >
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    {/* Primera fila: Usuario, período y fechas */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <p className="font-medium">{user.userName}</p>
                        {/* Mostrar badge si es vacación dividida */}
                        {allSchedules.some(
                          (u) =>
                            u.originalId === user.originalId &&
                            u.isPeriodoPrincipal !== user.isPeriodoPrincipal
                        ) && (
                          <Badge variant="secondary" className="text-xs">
                            {user.isPeriodoPrincipal
                              ? '1er período'
                              : '2do período'}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDateShort(user.startDate)} -{' '}
                        {formatDateShort(user.endDate)}
                      </Badge>
                    </div>
                    {/* Segunda fila: Estado y botones */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-wrap">
                          {getEstadoBadge(user.estado)}
                        </div>
                        {user.puedeAprobar && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={() =>
                                onOpenConfirmDialog(
                                  {
                                    id: user.originalId,
                                    userName: user.userName,
                                  },
                                  'aprobar'
                                )
                              }
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() =>
                                onOpenConfirmDialog(
                                  {
                                    id: user.originalId,
                                    userName: user.userName,
                                  },
                                  'rechazar'
                                )
                              }
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Período: {user.periodo}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-8">
            No hay solicitudes este mes
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarComponentAplazamiento;

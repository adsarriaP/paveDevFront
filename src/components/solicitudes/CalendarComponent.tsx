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
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo';
import { RootState } from '@/store/store';
import { SolicitudResponse, SolicitudBackend, ApiResponseCalendario } from '@/types';
import { ConfirmDialog } from '@/components/Componentes-Generales/ConfirmDialog';

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
      return <Badge variant="status-inactivo">Inactivo</Badge>;
    case 1:
      return <Badge variant="status-pendiente">Pendiente</Badge>;
    case 2:
      return <Badge variant="status-alerta">Rechazado</Badge>;
    case 3:
      return <Badge variant="status-activo">Aprobado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const CalendarComponent = () => {
  // Inicializar con el año siguiente (igual que FormularioSolicitud)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 1);
  const [userSchedules, setUserSchedules] = useState<User[]>([]);
  const [solicitudesBackend, setSolicitudesBackend] = useState<SolicitudBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    solicitud: { id: number; userName: string; userId: number; fechaInicio: string; fechaFin: string; dias: number; fechaInicioSecundario?: string; fechaFinSecundario?: string; diasSecundario?: number } | null;
    accion: 'aprobar' | 'rechazar' | null;
  }>({ open: false, solicitud: null, accion: null });

  const { get, patch } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);
  const { periodo: periodoActivo, loading: loadingPeriodo } = usePeriodoActivo();

  // Función para convertir solicitud del backend a formato del calendario
  const convertirSolicitud = (solicitud: SolicitudBackend): User[] => {
    const vacaciones: User[] = [];

    // Período principal
    vacaciones.push({
      id: solicitud.id * 10, // Multiplicar para evitar conflictos con período secundario
      originalId: solicitud.id, // ID original de la solicitud
      userId: solicitud.usuario.id,
      userName: solicitud.usuario.user,
      startDate: new Date(solicitud.fecha_inicio_principal + 'T00:00:00'),
      endDate: new Date(solicitud.fecha_fin_principal + 'T00:00:00'),
      isPeriodoPrincipal: true,
      estado: solicitud.estado,
    });

    // Período secundario (si existe)
    if (solicitud.fecha_inicio_secundario && solicitud.fecha_fin_secundario) {
      vacaciones.push({
        id: solicitud.id * 10 + 1, // Añadir 1 para período secundario
        originalId: solicitud.id, // Mismo ID original para ambos períodos
        userId: solicitud.usuario.id,
        userName: solicitud.usuario.user,
        startDate: new Date(solicitud.fecha_inicio_secundario + 'T00:00:00'),
        endDate: new Date(solicitud.fecha_fin_secundario + 'T00:00:00'),
        isPeriodoPrincipal: false,
        estado: solicitud.estado,
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
        setSolicitudesBackend([]);
        return;
      }

      if (!periodoActivo?.id) {
        console.error('No hay período activo');
        setUserSchedules([]);
        setSolicitudesBackend([]);
        return;
      }

      // Usar el nuevo endpoint con período activo
      const response = await get<ApiResponseCalendario>(`solicitudes/jefe/${user.id}/periodo-activo/${periodoActivo.id}`);

      // Filtrar solo solicitudes aprobadas (estado 3) y pendientes (estado 1)
      const solicitudesFiltradas = response.data.solicitudes.filter(
        (solicitud) => solicitud.estado === 1 || solicitud.estado === 3
      );

      // Guardar solicitudes del backend para usar en los correos
      setSolicitudesBackend(solicitudesFiltradas);

      const vacacionesCalendario: User[] = [];
      solicitudesFiltradas.forEach((solicitud) => {
        const vacaciones = convertirSolicitud(solicitud);
        vacacionesCalendario.push(...vacaciones);
      });

      setUserSchedules(vacacionesCalendario);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      setUserSchedules([]);
      setSolicitudesBackend([]);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar aprobación y rechazo
  const handleAprobar = async ({
    id,
    observaciones,
  }: {
    id: number;
    observaciones: string;
  }): Promise<SolicitudResponse | null> => {
    try {
      const response = await patch<SolicitudResponse>(
        `solicitudes/${id}/aprobar`,
        { observaciones }
      );
      fetchSolicitudes();
      Notify.success('Solicitud aprobada exitosamente');

      return response;
    } catch (error) {
      console.error('Error approving solicitud:', error);
      Notify.failure('Error al aprobar la solicitud');
      return null;
    }
  };

  const handleRechazar = async ({
    id,
    motivo,
  }: {
    id: number;
    motivo: string;
  }): Promise<SolicitudResponse | null> => {
    try {
      const response = await patch<SolicitudResponse>(
        `solicitudes/${id}/rechazar`,
        { motivo }
      );
      fetchSolicitudes();
      Notify.success('Solicitud rechazada exitosamente');

      return response;
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
      Notify.failure('Error al rechazar la solicitud');
      return null;
    }
  };

  const handleConfirm = async (inputValue: string) => {
    if (confirmDialog.accion === 'aprobar' && confirmDialog.solicitud) {
      await handleAprobar({
        id: confirmDialog.solicitud.id,
        observaciones: inputValue,
      });
    }
    if (confirmDialog.accion === 'rechazar' && confirmDialog.solicitud) {
      await handleRechazar({
        id: confirmDialog.solicitud.id,
        motivo: inputValue,
      });
    }
    setConfirmDialog({ open: false, solicitud: null, accion: null });
  };

  const handleOpenConfirmDialog = (solicitudId: number, _userName: string, accion: 'aprobar' | 'rechazar') => {
    // Buscar la solicitud completa del backend para obtener todos los datos
    const solicitudCompleta = solicitudesBackend.find(s => s.id === solicitudId);

    if (!solicitudCompleta) {
      console.error('No se encontró la solicitud completa');
      return;
    }

    // Crear objeto con todos los datos necesarios para el correo
    const solicitudParaCorreo = {
      id: solicitudCompleta.id,
      userName: solicitudCompleta.usuario.user,
      userId: solicitudCompleta.usuario.id,
      fechaInicio: solicitudCompleta.fecha_inicio_principal,
      fechaFin: solicitudCompleta.fecha_fin_principal,
      dias: solicitudCompleta.dias_principal,
      fechaInicioSecundario: solicitudCompleta.fecha_inicio_secundario,
      fechaFinSecundario: solicitudCompleta.fecha_fin_secundario,
      diasSecundario: solicitudCompleta.dias_secundario
    };

    setConfirmDialog({
      open: true,
      solicitud: solicitudParaCorreo,
      accion,
    });
  };

  // Cargar datos cuando el componente se monta y cuando el período activo esté disponible
  useEffect(() => {
    if (periodoActivo?.id && user?.id) {
      fetchSolicitudes();
    }
  }, [periodoActivo?.id, user?.id]);

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

  // Generar años para el selector (igual que FormularioSolicitud - desde año siguiente)
  const currentYearBase = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, index) => {
    const year = currentYearBase + 1 + index; // Empezar desde el año siguiente
    return year.toString();
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md bg-muted/30">
        <CardHeader className=" border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="text-primary h-6 w-6" />
              Calendario de Vacaciones
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
          {(loading || loadingPeriodo) ? (
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
                  onOpenConfirmDialog={handleOpenConfirmDialog}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
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
interface User {
  id: number;
  originalId: number; // ID original de la solicitud para las acciones
  userId: number;
  userName: string;
  startDate: Date;
  endDate: Date;
  isPeriodoPrincipal: boolean;
  estado: number;
}

interface Month {
  date: Date;
  name: string;
  users: User[];
}

interface MonthCardProps {
  month: Month;
  onOpenConfirmDialog: (solicitudId: number, userName: string, accion: 'aprobar' | 'rechazar') => void;
}

// Componente para mostrar un mes individual
const MonthCard = ({ month, onOpenConfirmDialog }: MonthCardProps) => {
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
          <ScrollArea className="max-h-60 pr-2">
            <div className="space-y-2">
              {month.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-2 text-sm rounded-md p-2 hover:bg-muted border border-gray-200 dark:border-gray-700"
                >
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    {/* Primera fila: Usuario, 2do período y fechas */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <p className="font-medium">{user.userName}</p>
                        {!user.isPeriodoPrincipal && (
                          <Badge variant="secondary" className="text-xs">
                            2do período
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatDateShort(user.startDate)} -{' '}
                        {formatDateShort(user.endDate)}
                      </Badge>
                    </div>
                    {/* Segunda fila: Estado y botones */}
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1 flex-wrap">
                        {getEstadoBadge(user.estado)}
                      </div>
                      {user.estado === 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() =>
                              onOpenConfirmDialog(
                                user.originalId,
                                user.userName,
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
                                user.originalId,
                                user.userName,
                                'rechazar'
                              )
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
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

export default CalendarComponent;

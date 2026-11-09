import { Label } from '@/components/ui/label';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
// import { FormularioSolicitud } from './FormularioSolicitud'; // Oculto: formulario "Solicitar Cambio de Fechas" deshabilitado en Inicio
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo';
import { useApi } from '@/hooks/useApi';
import { useEffect, useState } from 'react';
import { formatFechaDisplay } from '@/lib/date-utils';
// import CardsNotificacionDisfrute from './CardsNotificacionDisfrute';

interface VacacionUsuario {
  id: number;
  fecha_causacion: string;
  fecha_disfrute: string;
  fecha_retorno: string;
  fecha_disfrute_secundario: string | null;
  fecha_retorno_secundario: string | null;
  periodo: string;
  diasVacaciones: number;
  diasVacacionesSecundario: number | null;
  vacacionesDivididas: boolean;
}

interface VacacionesResponse {
  ok: boolean;
  msg: string;
  data: {
    usuario: {
      id: number;
      nombre: string;
      fecha_causacion_base: string;
      registro: number;
    };
    vacaciones: VacacionUsuario[];
    total: number;
  };
}

const CardsPresentacion = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { periodo } = usePeriodoActivo();
  const { get } = useApi();
  const [vacaciones, setVacaciones] = useState<VacacionUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVacaciones = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setVacaciones([]);
        return;
      }
      const response = await get<VacacionesResponse>(
        `/usuarios/${user.id}/vacaciones`
      );
      setVacaciones(response.data.vacaciones);
    } catch (error) {
      console.error('Error fetching vacaciones:', error);
      setVacaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacaciones();
  }, [user?.id]);

  const formatFecha = formatFechaDisplay;

  return (
    <div className="container mx-auto min-h-[calc(100vh-200px)]">
      {/* HEADER CENTRADO */}
      <div className="text-center mb-12">
        {user && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Bienvenido a P.A.V.E {user.nombre.toUpperCase()}
          </h2>
        )}
        <p className="text-2xl md:text-3xl font-bold mb-4">
          Periodo a planear {periodo?.nombre}
        </p>
      </div>

      {/* LAYOUT DE DASHBOARD - GRID DE CARDS */}
      <div className="space-y-5">
        {/* GRID DE INFORMACIÓN */}
        {loading ? (
          <div className="text-center py-6">
            <p>Cargando información de vacaciones...</p>
          </div>
        ) : vacaciones.length > 0 ? (
          vacaciones.map((vacacion) => (
            <div key={vacacion.id} className="space-y-4">
              {/* Card única compacta */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Período {vacacion.periodo}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Fecha de causación
                      </div>
                      <div className="text-sm font-medium">
                        {formatFecha(vacacion.fecha_causacion)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-xs text-muted-foreground">
                    Fechas Programadas
                  </Label>

                  {vacacion.vacacionesDivididas ? (
                    <div className="rounded-lg border p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primer Período */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium">
                              Primer Período
                            </Label>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {vacacion.diasVacaciones} días
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">
                                Fecha inicio
                              </span>
                              <span className="font-medium">
                                {formatFecha(vacacion.fecha_disfrute)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">
                                Fecha fin
                              </span>
                              <span className="font-medium">
                                {formatFecha(vacacion.fecha_retorno)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Segundo Período */}
                        {vacacion.fecha_disfrute_secundario &&
                          vacacion.fecha_retorno_secundario && (
                            <div className="border-l pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-medium">
                                  Segundo Período
                                </Label>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {vacacion.diasVacacionesSecundario} días
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Fecha inicio
                                  </span>
                                  <span className="font-medium">
                                    {formatFecha(
                                      vacacion.fecha_disfrute_secundario
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    Fecha fin
                                  </span>
                                  <span className="font-medium">
                                    {formatFecha(
                                      vacacion.fecha_retorno_secundario
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 text-sm flex-1">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Fecha inicio
                            </div>
                            <div className="font-medium">
                              {formatFecha(vacacion.fecha_disfrute)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Fecha fin
                            </div>
                            <div className="font-medium">
                              {formatFecha(vacacion.fecha_retorno)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Total días
                          </div>
                          <div className="text-base font-semibold">
                            {vacacion.diasVacaciones}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-6">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold mb-1">
                No hay vacaciones registradas
              </h3>
              <p className="text-sm text-muted-foreground">
                Aún no tienes información de vacaciones para mostrar
              </p>
            </CardContent>
          </Card>
        )}

        {/* FORMULARIO - Oculto para todos los usuarios (solicitud de cambio de fechas deshabilitada en Inicio) */}
        {/* <div className="mt-6">
          <FormularioSolicitud />
        </div> */}
      </div>
      {/* <div className="space-y-6">
        <CardsNotificacionDisfrute />
      </div> */}
    </div>
  );
};

export default CardsPresentacion;

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import useApi from '@/hooks/useApi';
import { RootState } from '@/store/store';

interface PeriodoDisfrute {
  id: number;
  tipo: 'dividido' | 'completo';
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  estado: 'proximo' | 'activo' | 'completado';
  diasRestantes?: number;
}

interface PeriodoDividido extends PeriodoDisfrute {
  tipo: 'dividido';
  primerPeriodo: {
    fechaInicio: string;
    fechaFin: string;
    dias: number;
    disfrutado: boolean;
  };
  segundoPeriodo: {
    fechaInicio: string;
    fechaFin: string;
    dias: number;
    disfrutado: boolean;
  };
}

const CardsNotificacionDisfrute = () => {
  const { get } = useApi();
  const authUser = useSelector((state: RootState) => state?.auth?.user);
  const [periodosDisfrute, setPeriodosDisfrute] = useState<
    (PeriodoDisfrute | PeriodoDividido)[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Utilidades para fechas y estado

  const parseFechaLocal = (valor: string): Date => {
    // Si viene como solo fecha: YYYY-MM-DD, crear fecha local (medianoche local)
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (soloFecha.test(valor)) {
      const [y, m, d] = valor.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    // Cualquier otro formato (con hora/Z) usar parsing nativo
    return new Date(valor);
  };

  const formatFecha = (fecha: string) => {
    return parseFechaLocal(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDiasParaIniciar = (fechaInicio: string) => {
    const msPorDia = 1000 * 60 * 60 * 24;
    const hoy = new Date();
    // normalizar ambas fechas a medianoche para cálculo en días de calendario
    const hoyMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicio = parseFechaLocal(fechaInicio);
    const inicioMid = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate()
    );
    const diff = Math.floor(
      (inicioMid.getTime() - hoyMid.getTime()) / msPorDia
    );
    return diff > 0 ? diff : 0;
  };

  const calcularEstado = (
    inicio: string,
    fin: string
  ): 'proximo' | 'activo' | 'completado' => {
    const hoy = new Date();
    const start = parseFechaLocal(inicio);
    const end = parseFechaLocal(fin);
    if (hoy < start) return 'proximo';
    if (hoy > end) return 'completado';
    return 'activo';
  };

  const getUserIdFromStorage = (): string | null => {
    const possibleKeys = [
      'usuarioId',
      'userId',
      'idUsuario',
      'user_id',
      'usuario_id',
    ];
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  const getUserId = (): string | null => {
    // 1) Redux
    const reduxId = authUser?.id;
    if (reduxId !== undefined && reduxId !== null) {
      return String(reduxId);
    }

    // 2) localStorage.user
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.id !== undefined && userObj?.id !== null) {
          return String(userObj.id);
        }
      }
    } catch { /* ignorar errores de parseo */ }

    // 3) fallback claves sueltas
    return getUserIdFromStorage();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          setPeriodosDisfrute([]);
          setLoading(false);
          return;
        }

        type ApiItem = {
          id: number;
          fecha_disfrute: string;
          fecha_retorno: string;
          fecha_disfrute_secundario: string | null;
          fecha_retorno_secundario: string | null;
          diasVacaciones: number;
          diasVacacionesSecundario: number | null;
          periodos: { nombre: string };
          disfrutado: boolean;
          disfrutado_principal?: boolean;
          disfrutado_secundario?: boolean;
        };

        const url = `/vacaciones-historico/usuario/${userId}`;
        const resp = await get<{ ok: boolean; data: ApiItem[] }>(url);

        const mapped = resp.data
          .filter((item) => !item.disfrutado) // Solo mostrar vacaciones no disfrutadas
          .map((item, idx) => {
            const periodoNombre = item.periodos?.nombre ?? '';
            const estado = calcularEstado(
              item.fecha_disfrute,
              item.fecha_retorno
            );
            const diasRestantes =
              estado === 'proximo'
                ? getDiasParaIniciar(item.fecha_disfrute)
                : undefined;

            const tieneSecundario = Boolean(
              item.fecha_disfrute_secundario && item.fecha_retorno_secundario
            );

            if (tieneSecundario) {
              const dividido: PeriodoDividido = {
                id: item.id ?? idx,
                tipo: 'dividido',
                periodo: periodoNombre,
                fechaInicio: item.fecha_disfrute,
                fechaFin: item.fecha_retorno,
                dias:
                  (item.diasVacaciones ?? 0) +
                  (item.diasVacacionesSecundario ?? 0),
                estado,
                diasRestantes,
                primerPeriodo: {
                  fechaInicio: item.fecha_disfrute,
                  fechaFin: item.fecha_retorno,
                  dias: item.diasVacaciones ?? 0,
                  disfrutado: item.disfrutado_principal ?? false,
                },
                segundoPeriodo: {
                  fechaInicio: item.fecha_disfrute_secundario as string,
                  fechaFin: item.fecha_retorno_secundario as string,
                  dias: item.diasVacacionesSecundario ?? 0,
                  disfrutado: item.disfrutado_secundario ?? false,
                },
              };
              return dividido;
            }

            const completo: PeriodoDisfrute = {
              id: item.id ?? idx,
              tipo: 'completo',
              periodo: periodoNombre,
              fechaInicio: item.fecha_disfrute,
              fechaFin: item.fecha_retorno,
              dias: item.diasVacaciones ?? 0,
              estado,
              diasRestantes,
            };
            return completo;
          })
          .filter((periodo) => periodo.estado !== 'completado') // Filtrar vacaciones completadas
          // Ordenar por fecha de inicio ascendente
          .sort(
            (a, b) =>
              parseFechaLocal(a.fechaInicio).getTime() -
              parseFechaLocal(b.fechaInicio).getTime()
          );
        setPeriodosDisfrute(mapped);
      } catch {
        setPeriodosDisfrute([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'proximo':
        return <Badge variant="status-pendiente">Próximo</Badge>;
      case 'activo':
        return <Badge variant="status-activo">En curso</Badge>;
      case 'completado':
        return <Badge variant="status-activo">Completado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'proximo':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'activo':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left m-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Fechas de Vacaciones Pendientes por disfrutar
        </h2>
        <p className="text-muted-foreground">
          Tus próximos períodos de vacaciones programados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-20 rounded-md bg-muted/30" />
            </CardContent>
          </Card>
        )}
        {!loading && periodosDisfrute.length === 0 && (
          <div className="text-muted-foreground text-sm px-6 py-4">
            No hay períodos de vacaciones programados.
          </div>
        )}
        {!loading &&
          periodosDisfrute.map((periodo) => (
            <Card key={periodo.id} className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Período {periodo.periodo}
                  </CardTitle>
                  {getEstadoBadge(periodo.estado)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {periodo.tipo === 'dividido' ? (
                  <div className="space-y-4">
                    <div className={`rounded-lg border p-4 ${(periodo as PeriodoDividido).primerPeriodo.disfrutado ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Bloque principal</span>
                        <Badge variant={(periodo as PeriodoDividido).primerPeriodo.disfrutado ? 'secondary' : 'default'} className="text-xs">
                          {(periodo as PeriodoDividido).primerPeriodo.disfrutado ? 'Disfrutado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Fecha inicio
                            </div>
                            <div className="font-medium">
                              {formatFecha(
                                (periodo as PeriodoDividido).primerPeriodo
                                  .fechaInicio
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Fecha fin
                            </div>
                            <div className="font-medium">
                              {formatFecha(
                                (periodo as PeriodoDividido).primerPeriodo
                                  .fechaFin
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground text-sm">
                            Total días
                          </div>
                          <div className="font-semibold text-lg">
                            {(periodo as PeriodoDividido).primerPeriodo.dias}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-lg border p-4 ${(periodo as PeriodoDividido).segundoPeriodo.disfrutado ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Bloque secundario</span>
                        <Badge variant={(periodo as PeriodoDividido).segundoPeriodo.disfrutado ? 'secondary' : 'default'} className="text-xs">
                          {(periodo as PeriodoDividido).segundoPeriodo.disfrutado ? 'Disfrutado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Fecha inicio
                            </div>
                            <div className="font-medium">
                              {formatFecha(
                                (periodo as PeriodoDividido).segundoPeriodo
                                  .fechaInicio
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Fecha fin
                            </div>
                            <div className="font-medium">
                              {formatFecha(
                                (periodo as PeriodoDividido).segundoPeriodo
                                  .fechaFin
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground text-sm">
                            Total días
                          </div>
                          <div className="font-semibold text-lg">
                            {(periodo as PeriodoDividido).segundoPeriodo.dias}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm border-t pt-2">
                      {getEstadoIcon(periodo.estado)}
                      <span className="text-muted-foreground">
                        Faltan{' '}
                        {getDiasParaIniciar(
                          (periodo as PeriodoDividido).primerPeriodo.fechaInicio
                        )}{' '}
                        días para iniciar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Fecha inicio
                            </div>
                            <div className="font-medium">
                              {formatFecha(periodo.fechaInicio)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Fecha fin
                            </div>
                            <div className="font-medium">
                              {formatFecha(periodo.fechaFin)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground text-sm">
                            Total días
                          </div>
                          <div className="font-semibold text-lg">
                            {periodo.dias}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm border-t pt-2">
                      {getEstadoIcon(periodo.estado)}
                      <span className="text-muted-foreground">
                        Faltan {getDiasParaIniciar(periodo.fechaInicio)} días
                        para iniciar
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default CardsNotificacionDisfrute;

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { User as UserType } from '@/types/entities.types';
import { useVacacionesUsuario, VacacionDetalle } from './useVacacionesUsuario';
import { formatFechaDisplay } from '@/lib/date-utils';

interface PopoverVacacionesProps {
  userData: UserType;
}

const formatFecha = formatFechaDisplay;

function VacacionCard({ vacacion }: { vacacion: VacacionDetalle }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Causación:</span>
        <span className="font-medium">{formatFecha(vacacion.fecha_causacion)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Disfrute:</span>
        <span className="font-medium">{formatFecha(vacacion.fecha_disfrute)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Retorno:</span>
        <span className="font-medium">{formatFecha(vacacion.fecha_retorno)}</span>
      </div>

      {vacacion.vacacionesDivididas && (
        <>
          <div className="pt-1 border-t border-dashed">
            <p className="text-xs text-muted-foreground mb-1">Bloque secundario:</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Disfrute:</span>
              <span className="font-medium">{formatFecha(vacacion.fecha_disfrute_secundario)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Retorno:</span>
              <span className="font-medium">{formatFecha(vacacion.fecha_retorno_secundario)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PopoverVacaciones({ userData }: PopoverVacacionesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading, fetchData } = useVacacionesUsuario(userData.id);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !data) {
      fetchData();
    }
  };

  const tieneVacacionesActuales = data && Array.isArray(data.vacaciones) && data.vacaciones.length > 0;
  const tieneHistoricoPendiente = data && Array.isArray(data.historico_pendiente) && data.historico_pendiente.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          Ver fechas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[480px] overflow-y-auto">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Información de Vacaciones</h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : !data ? null : !tieneVacacionesActuales && !tieneHistoricoPendiente ? (
            <p className="text-sm text-muted-foreground">
              No hay información de vacaciones disponible
            </p>
          ) : (
            <>
              {/* Período actual */}
              {tieneVacacionesActuales && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      PERÍODO ACTUAL
                    </span>
                  </div>

                  {(data.vacaciones ?? []).map((vacacion) => (
                    <div
                      key={vacacion.id}
                      className="rounded-md border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {vacacion.periodo}
                        </span>
                        {vacacion.vacacionesDivididas && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            Divididas
                          </Badge>
                        )}
                      </div>
                      <VacacionCard vacacion={vacacion} />
                    </div>
                  ))}
                </div>
              )}

              {/* Separador si hay ambos tipos */}
              {tieneVacacionesActuales && tieneHistoricoPendiente && (
                <div className="border-t" />
              )}

              {/* Períodos históricos pendientes */}
              {tieneHistoricoPendiente && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      PERÍODOS ANTERIORES PENDIENTES
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 px-2.5 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Vacaciones de períodos anteriores aún no disfrutadas
                    </p>
                  </div>

                  {(data.historico_pendiente ?? []).map((vacacion) => (
                    <div
                      key={vacacion.id}
                      className="rounded-md border border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          {vacacion.periodo}
                        </span>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-600 dark:text-amber-400"
                          >
                            Pendiente
                          </Badge>
                          {vacacion.vacacionesDivididas && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              Divididas
                            </Badge>
                          )}
                        </div>
                      </div>
                      <VacacionCard vacacion={vacacion} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

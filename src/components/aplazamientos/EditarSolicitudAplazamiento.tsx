import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/Calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  Edit3,
  AlertCircle,
  Calculator,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  useEditarSolicitudAplazamiento,
  EditarSolicitudAplazamientoProps,
} from './EditarSolicitudAplazamiento.logic';

export function EditarSolicitudAplazamiento({
  solicitud,
  onCancel,
  onSuccess,
}: EditarSolicitudAplazamientoProps) {
  // Usar el custom hook para toda la lógica
  const {
    // Estados
    calendarOpen,
    setCalendarOpen,
    selectedDate,
    setSelectedDate,
    fechaFinPrincipal,
    dividirPeriodo,
    calendarOpen2,
    setCalendarOpen2,
    selectedDate2,
    setSelectedDate2,
    fechaFinSecundario,
    diasPeriodo1,
    diasPeriodo2,
    erroresValidacion,
    diasTotales,
    isSubmitting,

    // Configuración
    fromYear,
    toYear,

    // Estados de festivos
    festivos1,
    loadingFestivos1,
    errorFestivos1,
    festivos2,
    loadingFestivos2,
    errorFestivos2,

    // Funciones
    formatDate,
    handleDividirPeriodo,
    handleDiasPeriodo1Change,
    handleDiasPeriodo2Change,
    handleYearChange1,
    handleYearChange2,
    handleSubmit,
  } = useEditarSolicitudAplazamiento(solicitud, onCancel, onSuccess);

  // Función para formatear fechas desde string
  const formatFechaString = (fechaString: string) => {
    const [year, month, day] = fechaString.split('-');
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    ).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Editar Solicitud de Aplazamiento
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Modifica las fechas de tu solicitud de aplazamiento
            </p>
          </div>
        </div>

        {/* Indicadores de estado */}
        {(loadingFestivos1 || loadingFestivos2) && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Cargando días festivos...
          </div>
        )}

        {(errorFestivos1 || errorFestivos2) && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Error al cargar algunos días festivos
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del período */}
          <div className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">
                  Período {solicitud.periodos.nombre}
                </h4>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Fecha de causación
                </div>
                <div className="text-sm font-medium">
                  {formatFechaString(solicitud.usuario.fecha_causacion_base)}
                </div>
              </div>
            </div>

            {/* Fechas actuales programadas */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">
                Fechas Actuales Programadas (Antes del Aplazamiento)
              </Label>

              {solicitud.fecha_disfrute_secundario_actual &&
              solicitud.fecha_retorno_secundario_actual ? (
                <div className="space-y-3">
                  {/* Primer período */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <Label className="text-xs font-medium">
                        Primer Período
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha inicio
                        </div>
                        <div className="font-medium">
                          {formatFechaString(solicitud.fecha_disfrute_actual)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha fin
                        </div>
                        <div className="font-medium">
                          {formatFechaString(solicitud.fecha_retorno_actual)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segundo período */}
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <Label className="text-xs font-medium">
                        Segundo Período
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha inicio
                        </div>
                        <div className="font-medium">
                          {formatFechaString(
                            solicitud.fecha_disfrute_secundario_actual
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha fin
                        </div>
                        <div className="font-medium">
                          {formatFechaString(
                            solicitud.fecha_retorno_secundario_actual
                          )}
                        </div>
                      </div>
                    </div>
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
                          {formatFechaString(solicitud.fecha_disfrute_actual)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Fecha fin
                        </div>
                        <div className="font-medium">
                          {formatFechaString(solicitud.fecha_retorno_actual)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checkbox para dividir período */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dividir-periodo"
              checked={dividirPeriodo}
              onCheckedChange={handleDividirPeriodo}
            />
            <Label
              htmlFor="dividir-periodo"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Dividir período de vacaciones en dos partes
            </Label>
          </div>

          {/* Indicador de días totales */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border-2 ${
              diasTotales === 15
                ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                : diasTotales > 0
                  ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/20'
            }`}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Total de días de vacaciones:
            </span>
            <span
              className={`text-lg font-bold ${
                diasTotales === 15
                  ? 'text-green-700 dark:text-green-400'
                  : diasTotales > 0
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {diasTotales}/15 días
            </span>
          </div>

          {/* Modo simple */}
          {!dividirPeriodo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nueva fecha de inicio</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {selectedDate
                        ? formatDate(selectedDate)
                        : 'Seleccionar fecha'}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      captionLayout="dropdown"
                      disabled={(date) => date < new Date()}
                      fromYear={fromYear}
                      toYear={toYear}
                      festivos={festivos1}
                      onYearChange={handleYearChange1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Nueva fecha de fin
                  <Calculator className="h-4 w-4 text-blue-500" />
                </Label>
                <Input
                  disabled
                  value={fechaFinPrincipal ? formatDate(fechaFinPrincipal) : ''}
                  placeholder="Se calculará automáticamente"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  15 días hábiles desde la fecha de inicio
                </p>
              </div>
            </div>
          )}

          {/* Modo dividido - Dos filas */}
          {dividirPeriodo && (
            <div className="space-y-6">
              {/* Primera fila */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Primer período
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio 1</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {selectedDate
                            ? formatDate(selectedDate)
                            : 'Seleccionar'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }}
                          captionLayout="dropdown"
                          disabled={(date) => date < new Date()}
                          fromYear={fromYear}
                          toYear={toYear}
                          festivos={festivos1}
                          onYearChange={handleYearChange1}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Días 1</Label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={diasPeriodo1}
                      onChange={handleDiasPeriodo1Change}
                      placeholder="Días"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de fin 1</Label>
                    <Input
                      disabled
                      value={
                        fechaFinPrincipal ? formatDate(fechaFinPrincipal) : ''
                      }
                      placeholder="Calculada"
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Segunda fila */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Segundo período
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio 2</Label>
                    <Popover
                      open={calendarOpen2}
                      onOpenChange={setCalendarOpen2}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {selectedDate2
                            ? formatDate(selectedDate2)
                            : 'Seleccionar'}
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={selectedDate2}
                          onSelect={(date) => {
                            setSelectedDate2(date);
                            setCalendarOpen2(false);
                          }}
                          captionLayout="dropdown"
                          disabled={(date) => date < new Date()}
                          fromYear={fromYear}
                          toYear={toYear}
                          festivos={festivos2}
                          onYearChange={handleYearChange2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Días 2</Label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={diasPeriodo2}
                      onChange={handleDiasPeriodo2Change}
                      placeholder="Días"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de fin 2</Label>
                    <Input
                      disabled
                      value={
                        fechaFinSecundario ? formatDate(fechaFinSecundario) : ''
                      }
                      placeholder="Calculada"
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Errores de validación */}
          {erroresValidacion.length > 0 && (
            <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:border-red-400 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ¡Atención! Hay errores que debes corregir:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {erroresValidacion.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                erroresValidacion.length > 0 ||
                loadingFestivos1 ||
                loadingFestivos2 ||
                diasTotales !== 15
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando solicitud...
                </>
              ) : (
                'Actualizar Solicitud de Aplazamiento'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}

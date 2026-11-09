import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/Calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  AlertCircle,
  Calculator,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useFormularioAplazamiento } from './FormularioAplazamiento.logic';

export function FormularioAplazamiento() {
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
    usuarioId,

    // Estados específicos de aplazamiento
    loadingVacaciones,
    errorCargaVacaciones,
    todasLasVacaciones,
    vacacionSeleccionada,
    esAplazamientoParcial,

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
    formatFechaString,
    handleDividirPeriodo,
    handleDiasPeriodo1Change,
    handleDiasPeriodo2Change,
    handleYearChange1,
    handleYearChange2,
    handleVacacionChange,
    handleSubmit,
    handleLimpiar,
  } = useFormularioAplazamiento();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Solicitar Aplazamiento de Vacaciones
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete el formulario para solicitar un aplazamiento de sus
          vacaciones pendientes
        </p>

        {/* Indicadores de estado */}
        {loadingVacaciones && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Cargando vacaciones pendientes...
          </div>
        )}

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

        {errorCargaVacaciones && !loadingVacaciones && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorCargaVacaciones}</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de período de vacaciones */}
          {!loadingVacaciones && todasLasVacaciones.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="periodo-select" className="text-sm font-medium">
                Seleccionar período de vacaciones a aplazar
              </Label>
              <Select
                value={vacacionSeleccionada?.id?.toString() ?? ''}
                onValueChange={handleVacacionChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione el período de vacaciones" />
                </SelectTrigger>
                <SelectContent>
                  {todasLasVacaciones.map((vacacion) => {
                    // Validar que la vacación tenga todos los datos necesarios
                    if (!vacacion?.id || !vacacion?.periodos?.nombre) {
                      console.warn('Vacación inválida en el selector:', vacacion);
                      return null;
                    }

                    return (
                      <SelectItem
                        key={vacacion.id}
                        value={vacacion.id.toString()}
                      >
                        {vacacion.periodos.nombre} ({vacacion.tipo === 'actual' ? 'Actual' : 'Pendiente'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Información de la vacación seleccionada */}
          {vacacionSeleccionada && (
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">
                    Período {vacacionSeleccionada.periodos.nombre}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Fecha de causación
                  </div>
                  <div className="text-sm font-medium">
                    {formatFechaString(vacacionSeleccionada.fecha_causacion)}
                  </div>
                </div>
              </div>

              {/* Fechas actuales programadas */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">
                  Fechas Actuales Programadas
                </Label>

                {vacacionSeleccionada.esDividida ? (
                  <div className="space-y-3">
                    {/* Primer período */}
                    <div className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <Label className="text-xs font-medium">
                          Primer Período
                        </Label>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {vacacionSeleccionada.diasVacaciones} días
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Fecha inicio
                          </div>
                          <div className="font-medium">
                            {formatFechaString(
                              vacacionSeleccionada.fecha_disfrute
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Fecha fin
                          </div>
                          <div className="font-medium">
                            {formatFechaString(
                              vacacionSeleccionada.fecha_retorno
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segundo período */}
                    {vacacionSeleccionada.fecha_disfrute_secundario &&
                      vacacionSeleccionada.fecha_retorno_secundario && (
                        <div className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <Label className="text-xs font-medium">
                              Segundo Período
                            </Label>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {vacacionSeleccionada.diasVacacionesSecundario}{' '}
                              días
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Fecha inicio
                              </div>
                              <div className="font-medium">
                                {formatFechaString(
                                  vacacionSeleccionada.fecha_disfrute_secundario
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Fecha fin
                              </div>
                              <div className="font-medium">
                                {formatFechaString(
                                  vacacionSeleccionada.fecha_retorno_secundario
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                            {formatFechaString(
                              vacacionSeleccionada.fecha_disfrute
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Fecha fin
                          </div>
                          <div className="font-medium">
                            {formatFechaString(
                              vacacionSeleccionada.fecha_retorno
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Total días
                        </div>
                        <div className="text-base font-semibold">
                          {vacacionSeleccionada.diasVacaciones}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic mt-2">
                  Estas son las fechas que se van a cambiar por las nuevas que
                  selecciones
                </p>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay vacaciones válidas */}
          {!loadingVacaciones && todasLasVacaciones.length === 0 && (
            <div className="p-4 border-2 border-amber-200 rounded-lg bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    No hay períodos disponibles para aplazar en este momento
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Esto puede deberse a que:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1 ml-2">
                    <li>La fecha de inicio de tus vacaciones ya pasó</li>
                    <li>No tienes vacaciones programadas actualmente</li>
                  </ul>
                  {errorCargaVacaciones && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 italic mt-2">
                      {errorCargaVacaciones}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* El resto del formulario solo se muestra si hay una vacación seleccionada */}
          {vacacionSeleccionada && (
            <>
              {/* Alerta de aplazamiento parcial */}
              {esAplazamientoParcial && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold mb-1">Aplazamiento parcial</p>
                    <p>
                      El bloque {vacacionSeleccionada.tipoAplazamientoDisponible === 'solo_secundario' ? 'principal' : 'secundario'} ya inició o fue disfrutado.
                      Solo puede aplazar el bloque {vacacionSeleccionada.tipoAplazamientoDisponible === 'solo_secundario' ? 'secundario' : 'principal'} ({vacacionSeleccionada.diasPartePendiente} días hábiles).
                    </p>
                    {vacacionSeleccionada.tipoAplazamientoDisponible === 'solo_secundario' && vacacionSeleccionada.fecha_disfrute && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                        Bloque principal disfrutado: {vacacionSeleccionada.fecha_disfrute} al {vacacionSeleccionada.fecha_retorno}
                      </p>
                    )}
                    {vacacionSeleccionada.tipoAplazamientoDisponible === 'solo_principal' && vacacionSeleccionada.fecha_disfrute_secundario && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                        Bloque secundario disfrutado: {vacacionSeleccionada.fecha_disfrute_secundario} al {vacacionSeleccionada.fecha_retorno_secundario}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Checkbox para dividir período - oculto en aplazamiento parcial */}
              {!esAplazamientoParcial && (
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
              )}

              {/* Indicador de días totales */}
              {(() => {
                const diasRequeridos = vacacionSeleccionada?.diasPartePendiente ?? 15;
                return (
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      diasTotales === diasRequeridos
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
                        diasTotales === diasRequeridos
                          ? 'text-green-700 dark:text-green-400'
                          : diasTotales > 0
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {diasTotales}/{diasRequeridos} días
                    </span>
                  </div>
                );
              })()}

              {/* Modo simple - Una sola fila */}
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
                          disabled={(date) => {
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            return date < hoy;
                          }}
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
                      value={
                        fechaFinPrincipal ? formatDate(fechaFinPrincipal) : ''
                      }
                      placeholder="Se calculará automáticamente"
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      {vacacionSeleccionada?.diasPartePendiente ?? 15} días hábiles desde la fecha de inicio
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
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
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
                              disabled={(date) => {
                                const hoy = new Date();
                                hoy.setHours(0, 0, 0, 0);
                                const fechaCausacion = new Date(
                                  vacacionSeleccionada.fecha_causacion
                                );
                                fechaCausacion.setHours(0, 0, 0, 0);
                                return date < hoy || date < fechaCausacion;
                              }}
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
                            fechaFinPrincipal
                              ? formatDate(fechaFinPrincipal)
                              : ''
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
                              disabled={(date) => {
                                const hoy = new Date();
                                hoy.setHours(0, 0, 0, 0);
                                return date < hoy;
                              }}
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
                            fechaFinSecundario
                              ? formatDate(fechaFinSecundario)
                              : ''
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
                    !vacacionSeleccionada ||
                    !usuarioId ||
                    loadingFestivos1 ||
                    loadingFestivos2 ||
                    diasTotales !== (vacacionSeleccionada?.diasPartePendiente ?? 15)
                  }
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando solicitud...
                    </>
                  ) : (
                    'Enviar Solicitud de Aplazamiento'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLimpiar}
                  disabled={isSubmitting}
                >
                  Limpiar
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

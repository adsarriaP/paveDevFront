import React, { useState, useEffect } from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import useApi from '@/hooks/useApi';
import { Role, User } from '@/types/entities.types';
import { UpdateUserPayload, UpdateVacacionFechasPayload, JefeOption } from '@/types/api.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, ArrowLeft, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useVacacionesUsuario } from './useVacacionesUsuario';
import { Calendar } from '@/components/ui/Calendar';
import { useFestivos } from '@/hooks/useFestivos';
import { extraerFechaYMD, fechaStringToDate, dateToFechaString, formatFechaDisplay } from '@/lib/date-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditarUsuarioFormProps {
  usuario: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditarUsuarioForm({ usuario, onCancel, onSuccess }: EditarUsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingJefes, setLoadingJefes] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [analistaRoleId, setAnalistaRoleId] = useState<number | null>(null);
  const [jefes, setJefes] = useState<JefeOption[]>([]);
  const [popoverOpenJefe, setPopoverOpenJefe] = useState(false);
  const [selectedJefe, setSelectedJefe] = useState<JefeOption | null>(null);

  // Estado para fechas de vacaciones
  const [vacacionId, setVacacionId] = useState<number | null>(null);
  const [vacacionDividida, setVacacionDividida] = useState(false);
  const [fechasVacaciones, setFechasVacaciones] = useState({
    fecha_disfrute: '',
    fecha_retorno: '',
    fecha_disfrute_secundario: '',
    fecha_retorno_secundario: '',
  });
  const [fechasOriginales, setFechasOriginales] = useState({
    fecha_disfrute: '',
    fecha_retorno: '',
    fecha_disfrute_secundario: '',
    fecha_retorno_secundario: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Estados para calendarios con festivos
  const [calendarOpenDisfrute, setCalendarOpenDisfrute] = useState(false);
  const [calendarOpenRetorno, setCalendarOpenRetorno] = useState(false);
  const [calendarOpenDisfruteSec, setCalendarOpenDisfruteSec] = useState(false);
  const [calendarOpenRetornoSec, setCalendarOpenRetornoSec] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { festivos } = useFestivos(currentYear);

  const { data: vacacionesData, fetchData: fetchVacaciones } = useVacacionesUsuario(usuario.id);

  // Convertir planilla de array a string si viene como array
  const planillaInicial = (() => {
    if (!usuario.planilla) return '';
    if (Array.isArray(usuario.planilla)) {
      return usuario.planilla.join(', ');
    }
    return usuario.planilla;
  })();

  // Intentar obtener el jefeId desde diferentes lugares del objeto usuario
  const jefeIdInicial = usuario.dependencia?.jefeUsuario?.id ||
                        usuario.dependencia?.jefe ||
                        null;

  const [formData, setFormData] = useState({
    nombre: usuario.nombre,
    user: usuario.user,
    rol_id: usuario.rol.id,
    registro: usuario.registro.toString(),
    jefeId: jefeIdInicial,
    fechaCausacion: extraerFechaYMD(usuario.fecha_causacion_base) || '',
    planilla: planillaInicial,
    planilla_analista: usuario.planilla_analista || ''
  });

  const { get, patch } = useApi();

  // Cargar información completa del usuario (incluyendo dependencia y jefe)
  useEffect(() => {
    const fetchUsuarioCompleto = async () => {
      try {
        type UsuarioCompletoData = {
          dependencias?: { jefeInfo?: { id?: number }; jefe?: number };
          dependencia?: { jefeUsuario?: { id?: number }; jefe?: number };
        };
        const usuarioCompleto = await get<UsuarioCompletoData>(`/usuarios/${usuario.id}`);

        // Intentar obtener jefeId desde diferentes lugares
        const jefeId = usuarioCompleto.dependencias?.jefeInfo?.id ||  // Respuesta de /usuarios/{id}
                      usuarioCompleto.dependencias?.jefe ||             // Campo directo
                      usuarioCompleto.dependencia?.jefeUsuario?.id ||  // Formato alternativo
                      usuarioCompleto.dependencia?.jefe ||              // Campo directo alternativo
                      null;

        if (jefeId) {
          setFormData(prev => ({ ...prev, jefeId }));
        }
      } catch (error) {
        console.error('Error al cargar información completa del usuario:', error);
      }
    };

    fetchUsuarioCompleto();
    fetchRoles();
    fetchJefes();
    fetchVacaciones();
  }, [usuario.id]);

  // Poblar fechas de vacaciones cuando llegan los datos
  useEffect(() => {
    if (vacacionesData?.vacaciones?.length) {
      const vac = vacacionesData.vacaciones[0];
      setVacacionId(vac.id);
      setVacacionDividida(vac.vacacionesDivididas);
      const fechas = {
        fecha_disfrute: extraerFechaYMD(vac.fecha_disfrute),
        fecha_retorno: extraerFechaYMD(vac.fecha_retorno),
        fecha_disfrute_secundario: extraerFechaYMD(vac.fecha_disfrute_secundario),
        fecha_retorno_secundario: extraerFechaYMD(vac.fecha_retorno_secundario),
      };
      setFechasVacaciones(fechas);
      setFechasOriginales(fechas);
    }
  }, [vacacionesData]);

  // Update selected jefe if formData has jefeId after jefes loaded
  useEffect(() => {
    if (formData.jefeId && jefes.length > 0 && !selectedJefe) {
      const found = jefes.find(j => j.id === formData.jefeId);
      if (found) {
        setSelectedJefe(found);
      }
    }
  }, [formData.jefeId, jefes, selectedJefe]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await get<Role[]>('/roles');
      setRoles(response);
      const analista = response.find(r => r.nombre?.toUpperCase() === 'ANALISTA');
      setAnalistaRoleId(analista ? analista.id : null);
    } catch (e) {
      console.error('Error al cargar roles', e);
      Notify.failure('No se pudieron cargar los roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchJefes = async () => {
    try {
      setLoadingJefes(true);
      const response = await get<JefeOption[]>('/usuarios/jefes');
      setJefes(response);
    } catch (e) {
      console.error('Error al cargar jefes', e);
      Notify.failure('No se pudieron cargar los jefes disponibles');
    } finally {
      setLoadingJefes(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalendarSelect = (field: keyof typeof fechasVacaciones, date: Date | undefined, setOpen: (v: boolean) => void) => {
    if (date) {
      setFechasVacaciones(prev => ({ ...prev, [field]: dateToFechaString(date) }));
    }
    setOpen(false);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  };

  // Detectar si las fechas de vacaciones cambiaron
  const vacacionesCambiaron = vacacionId !== null && (
    fechasVacaciones.fecha_disfrute !== fechasOriginales.fecha_disfrute ||
    fechasVacaciones.fecha_retorno !== fechasOriginales.fecha_retorno ||
    fechasVacaciones.fecha_disfrute_secundario !== fechasOriginales.fecha_disfrute_secundario ||
    fechasVacaciones.fecha_retorno_secundario !== fechasOriginales.fecha_retorno_secundario
  );

  const causacionCambio = formData.fechaCausacion !== (usuario.fecha_causacion_base || '');

  const handleRolChange = (value: string) => {
    setFormData(prev => ({ ...prev, rol_id: parseInt(value) }));
    const nuevoRolId = parseInt(value);

    // Si cambia de ANALISTA a otro rol, limpiar el campo planilla
    if (analistaRoleId && nuevoRolId !== analistaRoleId) {
      setFormData(prev => ({ ...prev, planilla: '' }));
    }

    // Si cambia de otro rol a ANALISTA, limpiar planilla_analista para que se ingrese correctamente
    if (analistaRoleId && nuevoRolId === analistaRoleId) {
      setFormData(prev => ({ ...prev, planilla_analista: '' }));
    }
  };

  const handleJefeSelection = (jefe: JefeOption) => {
    setSelectedJefe(jefe);
    setFormData(prev => ({ ...prev, jefeId: jefe.id }));
    setPopoverOpenJefe(false);
  };

  const clearJefeSelection = () => {
    setSelectedJefe(null);
    setFormData(prev => ({ ...prev, jefeId: null }));
    setPopoverOpenJefe(false);
  };

  // Función para parsear el campo planilla y convertirlo a array
  const parsePlanillas = (input: string): string[] => {
    if (!input || input.trim() === '') return [];

    // Extraer todos los números del input (soporta comas, espacios, o ambos)
    const numeros = input
      .split(/[\s,]+/) // Dividir por espacios, comas, o ambos
      .map(item => item.trim()) // Limpiar espacios
      .filter(item => item !== '' && /^\d+$/.test(item)); // Solo números válidos

    return numeros;
  };

  const validarFormulario = (): boolean => {
    const esAnalista = analistaRoleId !== null && formData.rol_id === analistaRoleId;

    if (!formData.nombre || !formData.user || !formData.registro || !formData.fechaCausacion) {
      Notify.failure('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (esAnalista && (!formData.planilla || !formData.planilla_analista)) {
      Notify.failure('Para el rol ANALISTA, ambos campos de planilla son obligatorios');
      return false;
    }

    if (!esAnalista && !formData.planilla_analista) {
      Notify.failure('El campo Planilla Analista es obligatorio');
      return false;
    }

    const registroNumber = parseInt(formData.registro);
    if (isNaN(registroNumber)) {
      Notify.failure('El registro debe ser un número válido');
      return false;
    }

    return true;
  };

  const ejecutarGuardado = async () => {
    const esAnalista = analistaRoleId !== null && formData.rol_id === analistaRoleId;
    const registroNumber = parseInt(formData.registro);

    setIsLoading(true);
    try {
      const planillasArray = esAnalista ? parsePlanillas(formData.planilla) : null;

      if (esAnalista && (!planillasArray || planillasArray.length === 0)) {
        Notify.failure('Debe ingresar al menos un código de planilla válido');
        setIsLoading(false);
        return;
      }

      // Paso 1: Guardar datos del usuario (recalcula vacaciones si causación cambió)
      const payload: UpdateUserPayload = {
        nombre: formData.nombre,
        user: formData.user,
        rol_id: formData.rol_id,
        registro: registroNumber,
        fecha_causacion_base: formData.fechaCausacion,
        actualizarVacacionesAutomaticamente: true,
        ...(formData.jefeId && { jefeId: formData.jefeId }),
        planilla: planillasArray,
        planilla_analista: formData.planilla_analista || null
      };

      await patch(`/usuarios/${usuario.id}`, payload);

      // Paso 2: Si las fechas de vacaciones fueron editadas manualmente, aplicar overrides
      if (vacacionesCambiaron && vacacionId) {
        const vacPayload: UpdateVacacionFechasPayload = {};
        if (fechasVacaciones.fecha_disfrute !== fechasOriginales.fecha_disfrute) {
          vacPayload.fecha_disfrute = fechasVacaciones.fecha_disfrute;
        }
        if (fechasVacaciones.fecha_retorno !== fechasOriginales.fecha_retorno) {
          vacPayload.fecha_retorno = fechasVacaciones.fecha_retorno;
        }
        if (fechasVacaciones.fecha_disfrute_secundario !== fechasOriginales.fecha_disfrute_secundario) {
          vacPayload.fecha_disfrute_secundario = fechasVacaciones.fecha_disfrute_secundario || null;
        }
        if (fechasVacaciones.fecha_retorno_secundario !== fechasOriginales.fecha_retorno_secundario) {
          vacPayload.fecha_retorno_secundario = fechasVacaciones.fecha_retorno_secundario || null;
        }

        await patch(`/vacaciones/${vacacionId}/fechas-manuales`, vacPayload);
      }

      Notify.success('Usuario actualizado exitosamente');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar usuario:', error);
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = apiError.response?.data?.message || apiError.message || 'Error al actualizar el usuario';
      Notify.failure(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Si la fecha de causación cambió, mostrar confirmación
    if (causacionCambio) {
      setShowConfirmDialog(true);
      return;
    }

    await ejecutarGuardado();
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">Editar Usuario</CardTitle>
            <p className="text-sm text-muted-foreground">Modifica la información del usuario: {usuario.nombre}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Primera fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">Usuario <span className="text-red-500">*</span></Label>
              <Input id="user" name="user" value={formData.user} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro">Número de Registro <span className="text-red-500">*</span></Label>
              <Input id="registro" name="registro" type="number" value={formData.registro} onChange={handleInputChange} required />
            </div>
          </div>
          {/* Segunda fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fechaCausacion">Fecha de Causación <span className="text-red-500">*</span></Label>
              <Input id="fechaCausacion" name="fechaCausacion" type="date" value={formData.fechaCausacion} onChange={handleInputChange} className="cursor-pointer" required />
            </div>
            <div className="space-y-2">
              <Label>Rol <span className="text-red-500">*</span></Label>
              <Select onValueChange={handleRolChange} value={formData.rol_id.toString()}>
                <SelectTrigger><SelectValue placeholder="Seleccione un rol" /></SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">Cargando roles...</div>
                  ) : roles.length ? (
                    roles.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.nombre} - {r.descripcion}</SelectItem>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">No hay roles disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jefe</Label>
              <Popover open={popoverOpenJefe} onOpenChange={setPopoverOpenJefe}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={popoverOpenJefe} className="w-full justify-between">
                    {selectedJefe ? selectedJefe.nombre : 'Seleccione un jefe'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar jefe..." className="h-9" />
                    <CommandEmpty>{loadingJefes ? 'Cargando jefes...' : 'No se encontraron jefes disponibles.'}</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        <CommandItem value="sin-jefe" onSelect={clearJefeSelection} className="cursor-pointer">
                          <Check className={cn('mr-2 h-4 w-4', !selectedJefe ? 'opacity-100' : 'opacity-0')} />
                          <div className="flex flex-col">
                            <span className="font-medium text-muted-foreground">Sin jefe asignado</span>
                          </div>
                        </CommandItem>
                        {jefes.map(j => (
                          <CommandItem key={j.id} value={`${j.nombre} ${j.user}`} onSelect={() => handleJefeSelection(j)} className="cursor-pointer">
                            <Check className={cn('mr-2 h-4 w-4', selectedJefe?.id === j.id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span className="font-medium">{j.nombre}</span>
                              <span className="text-xs text-muted-foreground">{j.user} • {j.rol.nombre} • Reg: {j.registro}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedJefe && <p className="text-sm text-muted-foreground">Jefe: {selectedJefe.nombre} ({selectedJefe.user})</p>}
            </div>
          </div>
          {/* Fechas de Vacaciones (Periodo Actual) */}
          {vacacionId && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                  Fechas de Vacaciones (Periodo Actual)
                </h3>
              </div>
              <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6",
                vacacionDividida && "lg:grid-cols-4"
              )}>
                <div className="space-y-2">
                  <Label>Fecha Disfrute</Label>
                  <Popover open={calendarOpenDisfrute} onOpenChange={setCalendarOpenDisfrute}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {fechasVacaciones.fecha_disfrute ? formatFechaDisplay(fechasVacaciones.fecha_disfrute) : 'Seleccionar fecha'}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaStringToDate(fechasVacaciones.fecha_disfrute)}
                        onSelect={(date) => handleCalendarSelect('fecha_disfrute', date, setCalendarOpenDisfrute)}
                        captionLayout="dropdown"
                        festivos={festivos}
                        onYearChange={handleYearChange}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Fecha Retorno</Label>
                  <Popover open={calendarOpenRetorno} onOpenChange={setCalendarOpenRetorno}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        {fechasVacaciones.fecha_retorno ? formatFechaDisplay(fechasVacaciones.fecha_retorno) : 'Seleccionar fecha'}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaStringToDate(fechasVacaciones.fecha_retorno)}
                        onSelect={(date) => handleCalendarSelect('fecha_retorno', date, setCalendarOpenRetorno)}
                        captionLayout="dropdown"
                        festivos={festivos}
                        onYearChange={handleYearChange}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {vacacionDividida && (
                  <>
                    <div className="space-y-2">
                      <Label>Disfrute Secundario</Label>
                      <Popover open={calendarOpenDisfruteSec} onOpenChange={setCalendarOpenDisfruteSec}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            {fechasVacaciones.fecha_disfrute_secundario ? formatFechaDisplay(fechasVacaciones.fecha_disfrute_secundario) : 'Seleccionar fecha'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaStringToDate(fechasVacaciones.fecha_disfrute_secundario)}
                            onSelect={(date) => handleCalendarSelect('fecha_disfrute_secundario', date, setCalendarOpenDisfruteSec)}
                            captionLayout="dropdown"
                            festivos={festivos}
                            onYearChange={handleYearChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Retorno Secundario</Label>
                      <Popover open={calendarOpenRetornoSec} onOpenChange={setCalendarOpenRetornoSec}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal">
                            {fechasVacaciones.fecha_retorno_secundario ? formatFechaDisplay(fechasVacaciones.fecha_retorno_secundario) : 'Seleccionar fecha'}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaStringToDate(fechasVacaciones.fecha_retorno_secundario)}
                            onSelect={(date) => handleCalendarSelect('fecha_retorno_secundario', date, setCalendarOpenRetornoSec)}
                            captionLayout="dropdown"
                            festivos={festivos}
                            onYearChange={handleYearChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          {/* Tercera fila - planillas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Para ANALISTA: mostrar ambos campos */}
            {analistaRoleId !== null && formData.rol_id === analistaRoleId ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="planilla">
                    Planillas que gestiona <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="planilla"
                    name="planilla"
                    value={formData.planilla}
                    onChange={handleInputChange}
                    placeholder="Ej: 45, 32, 89 o 45 32 89"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingrese los códigos de planilla separados por comas o espacios (puede gestionar varias)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planilla_analista">
                    Planilla del Analista <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="planilla_analista"
                    name="planilla_analista"
                    value={formData.planilla_analista}
                    onChange={handleInputChange}
                    placeholder="Identificador del analista"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador personal del analista
                  </p>
                </div>
              </>
            ) : (
              /* Para otros roles: solo planilla_analista */
              <div className="space-y-2">
                <Label htmlFor="planilla_analista">
                  Planilla Analista <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="planilla_analista"
                  name="planilla_analista"
                  value={formData.planilla_analista}
                  onChange={handleInputChange}
                  placeholder="Código de planilla del analista asignado"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este usuario estará bajo el cargo del analista con esta planilla
                </p>
              </div>
            )}
          </div>
          {/* Botones */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isLoading || loadingRoles}>{isLoading ? 'Actualizando Usuario...' : 'Actualizar Usuario'}</Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          </div>
        </form>
      </CardContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de fecha de causacion</AlertDialogTitle>
            <AlertDialogDescription>
              Al modificar la fecha de causacion, las fechas de disfrute y retorno se recalcularan automaticamente.
              {vacacionesCambiaron && (
                <span className="block mt-2 font-medium text-amber-600">
                  Nota: Tambien ha modificado manualmente las fechas de vacaciones.
                  Las fechas se recalcularan primero y luego se aplicaran sus cambios manuales.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirmDialog(false); ejecutarGuardado(); }}>
              Confirmar y guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

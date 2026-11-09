import { useState, useEffect } from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import useApi from '@/hooks/useApi';
import { Role } from '@/types/entities.types';
import { CreateUserPayload, JefeOption } from '@/types/api.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
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
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';

interface FormUsuariosProps {
  onSuccess?: () => void;
  isVisible: boolean;
}

export default function FormUsuarios({
  onSuccess,
  isVisible,
}: FormUsuariosProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingJefes, setLoadingJefes] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [analistaRoleId, setAnalistaRoleId] = useState<number | null>(null);
  const [jefes, setJefes] = useState<JefeOption[]>([]);
  const [popoverOpenJefe, setPopoverOpenJefe] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    user: '',
    rol_id: 2,
    registro: '',
    jefeId: null as number | null,
    fechaCausacion: '',
    planilla: '',
    planilla_analista: '',
  });

  const [selectedJefe, setSelectedJefe] = useState<JefeOption | null>(null);
  const { post, get } = useApi();

  useEffect(() => {
    if (isVisible) {
      fetchRoles();
      fetchJefes();
    }
  }, [isVisible]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      user: '',
      rol_id: 2,
      registro: '',
      jefeId: null,
      fechaCausacion: '',
      planilla: '',
      planilla_analista: '',
    });
    setSelectedJefe(null);
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await get<Role[]>('/roles');
      setRoles(response);
      const analista = response.find(r => r.nombre?.toUpperCase() === 'ANALISTA');
      setAnalistaRoleId(analista ? analista.id : null);
    } catch (error) {
      console.error('Error al cargar roles:', error);
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
    } catch (error) {
      console.error('Error al cargar jefes:', error);
      Notify.failure('No se pudieron cargar los jefes disponibles');
    } finally {
      setLoadingJefes(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRolChange = (value: string) => {
    setFormData((prev) => ({ ...prev, rol_id: parseInt(value) }));
  };

  const handleJefeSelection = (jefe: JefeOption) => {
    setSelectedJefe(jefe);
    setFormData((prev) => ({ ...prev, jefeId: jefe.id }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const esAnalista = analistaRoleId !== null && formData.rol_id === analistaRoleId;

    // Validaciones según el rol
    if (!formData.nombre ||
        !formData.user ||
        !formData.registro ||
        !formData.fechaCausacion) {
      Notify.failure('Por favor complete todos los campos obligatorios');
      return;
    }

    // Para ANALISTA: ambos campos son obligatorios
    if (esAnalista && (!formData.planilla || !formData.planilla_analista)) {
      Notify.failure('Para el rol ANALISTA, ambos campos de planilla son obligatorios');
      return;
    }

    // Para otros roles: solo planilla_analista es obligatorio
    if (!esAnalista && !formData.planilla_analista) {
      Notify.failure('El campo Planilla Analista es obligatorio');
      return;
    }

    const registroNumber = parseInt(formData.registro);
    if (isNaN(registroNumber)) {
      Notify.failure('El registro debe ser un número válido');
      return;
    }

    setIsLoading(true);

    try {
      const esAnalista = analistaRoleId !== null && formData.rol_id === analistaRoleId;

      // Parsear planillas a array si es analista
      const planillasArray = esAnalista ? parsePlanillas(formData.planilla) : null;

      // Validar que haya al menos una planilla si es analista
      if (esAnalista && (!planillasArray || planillasArray.length === 0)) {
        Notify.failure('Debe ingresar al menos un código de planilla válido');
        setIsLoading(false);
        return;
      }

      const payload: CreateUserPayload = {
        nombre: formData.nombre,
        user: formData.user,
        rol_id: formData.rol_id,
        registro: registroNumber,
        fecha_causacion_base: formData.fechaCausacion,
        crearVacacionesAutomaticamente: true,
        ...(formData.jefeId && { jefeId: formData.jefeId }),
        planilla: planillasArray,
        planilla_analista: formData.planilla_analista,
      };

      const response = (await post('/usuarios', payload)) as {
        passwordGenerada?: string;
      };

      if (response.passwordGenerada) {
        Notify.success(
          `Usuario creado exitosamente. Contraseña generada: ${response.passwordGenerada}`,
          { timeout: 8000 }
        );
      } else {
        Notify.success('Usuario creado exitosamente');
      }

      resetForm();
      if (onSuccess) onSuccess();
    } catch (error: unknown) {
      console.error('Error al crear usuario:', error);
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        apiError.response?.data?.message ||
        apiError.message ||
        'Error al crear el usuario';
      Notify.failure(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Primera fila - 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user">
              Usuario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user"
              name="user"
              value={formData.user}
              onChange={handleInputChange}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro">
              Número de Registro <span className="text-red-500">*</span>
            </Label>
            <Input
              id="registro"
              name="registro"
              type="number"
              value={formData.registro}
              onChange={handleInputChange}
              placeholder="Número de registro"
              required
            />
          </div>
        </div>

        {/* Segunda fila - 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fechaCausacion">
              Fecha de Causación <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fechaCausacion"
              name="fechaCausacion"
              type="date"
              value={formData.fechaCausacion}
              onChange={handleInputChange}
              className="cursor-pointer"
              onClick={(e) => {
                // Activar el date picker en cualquier clic dentro del input
                const input = e.target as HTMLInputElement;
                input.showPicker?.();
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={handleRolChange}
              value={formData.rol_id.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {loadingRoles ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Cargando roles...
                  </div>
                ) : roles.length > 0 ? (
                  roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre} - {rol.descripcion}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No hay roles disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jefe</Label>
            <Popover open={popoverOpenJefe} onOpenChange={setPopoverOpenJefe}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpenJefe}
                  className="w-full justify-between"
                >
                  {selectedJefe ? selectedJefe.nombre : 'Seleccione un jefe'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar jefe..." className="h-9" />
                  <CommandEmpty>
                    {loadingJefes
                      ? 'Cargando jefes...'
                      : 'No se encontraron jefes disponibles.'}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-64">
                      {jefes.map((jefe) => (
                        <CommandItem
                          key={jefe.id}
                          value={`${jefe.nombre} ${jefe.user}`}
                          onSelect={() => handleJefeSelection(jefe)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedJefe?.id === jefe.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{jefe.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              {jefe.user} • {jefe.rol.nombre} • Reg:{' '}
                              {jefe.registro}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedJefe && (
              <p className="text-sm text-muted-foreground">
                Jefe: {selectedJefe.nombre} ({selectedJefe.user})
              </p>
            )}
          </div>
        </div>

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

        {/* Botón de crear usuario que ocupa todo el ancho */}
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading || loadingRoles}>
            {isLoading ? 'Creando Usuario...' : 'Crear Usuario'}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import useApi from '@/hooks/useApi';
import useDebounce from '@/hooks/useDebounce';
import { Dependencia } from '@/types/entities.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Check,
  ChevronsUpDown,
  Building,
  Building2,
  LayoutGrid,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Tipos específicos para este componente
type TipoDependencia = 'gerencia' | 'subgerencia' | 'unidad';

interface JefeOption {
  id: number;
  nombre: string;
  user: string;
  registro: number;
  rol: { nombre: string };
}

interface GerenciaOption {
  id: number;
  gerencia: string;
}

interface SubgerenciaOption {
  id: number;
  gerencia: string;
  subgerencia: string;
}

interface FormData {
  nombreGerencia: string;
  nombreSubgerencia: string;
  nombreUnidad: string;
}

interface UsuariosBuscarResponse {
  ok: boolean;
  data: JefeOption[];
  total: number;
}

interface EditarDependenciaFormProps {
  dependencia: Dependencia;
  onCancel: () => void;
  onSuccess: () => void;
}

const SEARCH_DEBOUNCE_MS = 400;

export default function EditarDependenciaForm({
  dependencia,
  onCancel,
  onSuccess,
}: EditarDependenciaFormProps) {
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [loadingGerencias, setLoadingGerencias] = useState(false);
  const [loadingSubgerencias, setLoadingSubgerencias] = useState(false);

  // Datos del servidor
  const [gerencias, setGerencias] = useState<GerenciaOption[]>([]);
  const [subgerencias, setSubgerencias] = useState<SubgerenciaOption[]>([]);

  // --- Búsqueda de jefe principal ---
  const [searchTermJefe, setSearchTermJefe] = useState('');
  const [searchResultsJefe, setSearchResultsJefe] = useState<JefeOption[]>([]);
  const [isSearchingJefe, setIsSearchingJefe] = useState(false);
  const debouncedSearchJefe = useDebounce(searchTermJefe, SEARCH_DEBOUNCE_MS);

  // --- Búsqueda de jefe secundario ---
  const [searchTermJefeSecundario, setSearchTermJefeSecundario] = useState('');
  const [searchResultsJefeSecundario, setSearchResultsJefeSecundario] = useState<JefeOption[]>([]);
  const [isSearchingJefeSecundario, setIsSearchingJefeSecundario] = useState(false);
  const debouncedSearchJefeSecundario = useDebounce(searchTermJefeSecundario, SEARCH_DEBOUNCE_MS);

  // Estados de UI
  const [popoverOpenJefe, setPopoverOpenJefe] = useState(false);
  const [popoverOpenJefeSecundario, setPopoverOpenJefeSecundario] = useState(false);

  // Estados del formulario - inicializados con los datos de la dependencia
  const [tipoDependencia, setTipoDependencia] = useState<TipoDependencia>(() => {
    if (dependencia.unidad) return 'unidad';
    if (dependencia.subgerencia) return 'subgerencia';
    return 'gerencia';
  });

  // Pre-seleccionar jefe desde jefeInfo sin necesidad de cargar todos los usuarios
  const [selectedJefe, setSelectedJefe] = useState<JefeOption | null>(
    dependencia.jefeInfo
      ? {
          id: dependencia.jefeInfo.id,
          nombre: dependencia.jefeInfo.nombre,
          user: '',
          registro: 0,
          rol: { nombre: '' },
        }
      : null
  );

  const [selectedJefeSecundario, setSelectedJefeSecundario] = useState<JefeOption | null>(
    dependencia.jefeSecundarioInfo
      ? {
          id: dependencia.jefeSecundarioInfo.id,
          nombre: dependencia.jefeSecundarioInfo.nombre,
          user: '',
          registro: 0,
          rol: { nombre: '' },
        }
      : null
  );

  const [gerenciaSeleccionada, setGerenciaSeleccionada] = useState<string>(
    dependencia.gerencia
  );
  const [subgerenciaSeleccionada, setSubgerenciaSeleccionada] = useState<string>(
    dependencia.subgerencia || ''
  );
  const [unidadDirectaAGerencia, setUnidadDirectaAGerencia] = useState<boolean>(
    dependencia.unidad && !dependencia.subgerencia ? true : false
  );

  const [formData, setFormData] = useState<FormData>({
    nombreGerencia: dependencia.gerencia,
    nombreSubgerencia: dependencia.subgerencia || '',
    nombreUnidad: dependencia.unidad || '',
  });

  const { patch, get } = useApi();

  // Carga inicial
  useEffect(() => {
    fetchGerencias();
  }, []);

  useEffect(() => {
    if (gerenciaSeleccionada && tipoDependencia !== 'gerencia' && !unidadDirectaAGerencia) {
      fetchSubgerenciasByGerencia(gerenciaSeleccionada);
    } else {
      setSubgerencias([]);
      if (tipoDependencia === 'gerencia') {
        setSubgerenciaSeleccionada('');
      }
    }
  }, [gerenciaSeleccionada, unidadDirectaAGerencia, tipoDependencia]);

  // --- Búsqueda de jefe: respuesta inmediata al tipear ---
  useEffect(() => {
    if (searchTermJefe.trim()) {
      setIsSearchingJefe(true);
    } else {
      setIsSearchingJefe(false);
      setSearchResultsJefe([]);
    }
  }, [searchTermJefe]);

  // --- Fetch debounced para jefe ---
  useEffect(() => {
    if (!debouncedSearchJefe.trim()) return;

    const fetchJefe = async () => {
      try {
        const response = await get<UsuariosBuscarResponse>(
          `/usuarios/buscar?q=${encodeURIComponent(debouncedSearchJefe.trim())}`
        );
        setSearchResultsJefe(response.data);
      } catch (error) {
        console.error('Error al buscar usuarios:', error);
      } finally {
        setIsSearchingJefe(false);
      }
    };

    fetchJefe();
  }, [debouncedSearchJefe]);

  // --- Búsqueda de jefe secundario: respuesta inmediata ---
  useEffect(() => {
    if (searchTermJefeSecundario.trim()) {
      setIsSearchingJefeSecundario(true);
    } else {
      setIsSearchingJefeSecundario(false);
      setSearchResultsJefeSecundario([]);
    }
  }, [searchTermJefeSecundario]);

  // --- Fetch debounced para jefe secundario ---
  useEffect(() => {
    if (!debouncedSearchJefeSecundario.trim()) return;

    const fetchJefeSecundario = async () => {
      try {
        const response = await get<UsuariosBuscarResponse>(
          `/usuarios/buscar?q=${encodeURIComponent(debouncedSearchJefeSecundario.trim())}`
        );
        setSearchResultsJefeSecundario(response.data);
      } catch (error) {
        console.error('Error al buscar usuarios:', error);
      } finally {
        setIsSearchingJefeSecundario(false);
      }
    };

    fetchJefeSecundario();
  }, [debouncedSearchJefeSecundario]);

  // Funciones de carga de datos
  const fetchGerencias = async () => {
    try {
      setLoadingGerencias(true);
      const response = await get<Dependencia[]>('/dependencias/gerencias');
      const gerenciasFormatted = response.map((dep) => ({
        id: dep.id,
        gerencia: dep.gerencia,
      }));
      setGerencias(gerenciasFormatted);
    } catch (error) {
      console.error('Error al cargar gerencias:', error);
      Notify.failure('No se pudieron cargar las gerencias');
    } finally {
      setLoadingGerencias(false);
    }
  };

  const fetchSubgerenciasByGerencia = async (gerencia: string) => {
    try {
      setLoadingSubgerencias(true);
      const response = await get<Dependencia[]>(
        `/dependencias/subgerencias/por-gerencia/${encodeURIComponent(gerencia)}`
      );
      const subgerenciasFormatted = response.map((dep) => ({
        id: dep.id,
        gerencia: dep.gerencia,
        subgerencia: dep.subgerencia || '',
      }));
      setSubgerencias(subgerenciasFormatted);
    } catch (error) {
      console.error('Error al cargar subgerencias:', error);
      setSubgerencias([]);
    } finally {
      setLoadingSubgerencias(false);
    }
  };

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJefeSelection = (jefe: JefeOption) => {
    setSelectedJefe(jefe);
    setPopoverOpenJefe(false);
    setSearchTermJefe('');
    setSearchResultsJefe([]);
  };

  const handleJefeSecundarioSelection = (jefe: JefeOption) => {
    setSelectedJefeSecundario(jefe);
    setPopoverOpenJefeSecundario(false);
    setSearchTermJefeSecundario('');
    setSearchResultsJefeSecundario([]);
  };

  const handlePopoverJefeChange = (open: boolean) => {
    setPopoverOpenJefe(open);
    if (!open) {
      setSearchTermJefe('');
      setSearchResultsJefe([]);
    }
  };

  const handlePopoverJefeSecundarioChange = (open: boolean) => {
    setPopoverOpenJefeSecundario(open);
    if (!open) {
      setSearchTermJefeSecundario('');
      setSearchResultsJefeSecundario([]);
    }
  };

  const handleTipoChange = (tipo: TipoDependencia) => {
    setTipoDependencia(tipo);
    if (tipo === 'gerencia') {
      setGerenciaSeleccionada(dependencia.gerencia);
      setSubgerenciaSeleccionada('');
      setUnidadDirectaAGerencia(false);
    } else if (tipo === 'subgerencia') {
      setGerenciaSeleccionada(dependencia.gerencia);
      setSubgerenciaSeleccionada(dependencia.subgerencia || '');
      setUnidadDirectaAGerencia(false);
    } else if (tipo === 'unidad') {
      setGerenciaSeleccionada(dependencia.gerencia);
      setSubgerenciaSeleccionada(dependencia.subgerencia || '');
      setUnidadDirectaAGerencia(dependencia.unidad && !dependencia.subgerencia ? true : false);
    }
    setSubgerencias([]);
  };

  // Lógica de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJefe) {
      Notify.failure('Por favor seleccione un jefe');
      return;
    }

    setIsLoading(true);

    try {
      await handleActualizarDependencia();
      onSuccess();
    } catch (error: unknown) {
      console.error('Error al actualizar dependencia:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al actualizar la dependencia';
      Notify.failure(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActualizarDependencia = async () => {
    const payload: Record<string, unknown> = {
      jefe: selectedJefe!.id,
    };

    if (selectedJefeSecundario) {
      payload.jefe_secundario = selectedJefeSecundario.id;
    } else {
      payload.jefe_secundario = null;
    }

    switch (tipoDependencia) {
      case 'gerencia':
        if (!formData.nombreGerencia) {
          throw new Error('Por favor ingrese el nombre de la gerencia');
        }
        payload.gerencia = formData.nombreGerencia;
        payload.subgerencia = null;
        payload.unidad = null;
        break;

      case 'subgerencia':
        if (!gerenciaSeleccionada || !formData.nombreSubgerencia) {
          throw new Error(
            'Por favor seleccione una gerencia e ingrese el nombre de la subgerencia'
          );
        }
        payload.gerencia = gerenciaSeleccionada;
        payload.subgerencia = formData.nombreSubgerencia;
        payload.unidad = null;
        break;

      case 'unidad':
        if (!gerenciaSeleccionada || !formData.nombreUnidad) {
          throw new Error(
            'Por favor seleccione una gerencia e ingrese el nombre de la unidad'
          );
        }

        if (unidadDirectaAGerencia) {
          payload.gerencia = gerenciaSeleccionada;
          payload.unidad = formData.nombreUnidad;
          payload.subgerencia = null;
        } else {
          if (!subgerenciaSeleccionada) {
            throw new Error(
              'Por favor seleccione una subgerencia o marque "Pertenece directamente a la gerencia"'
            );
          }
          payload.gerencia = gerenciaSeleccionada;
          payload.subgerencia = subgerenciaSeleccionada;
          payload.unidad = formData.nombreUnidad;
        }
        break;
    }

    await patch(`/dependencias/${dependencia.id}`, payload);
    Notify.success(
      `${tipoDependencia.charAt(0).toUpperCase() + tipoDependencia.slice(1)} actualizada exitosamente`
    );
  };

  const getTipoDependenciaIcon = (tipo: TipoDependencia) => {
    switch (tipo) {
      case 'gerencia':
        return <Building className="h-5 w-5" />;
      case 'subgerencia':
        return <Building2 className="h-5 w-5" />;
      case 'unidad':
        return <LayoutGrid className="h-5 w-5" />;
    }
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Editar Dependencia
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Modifica la información de la dependencia: {dependencia.gerencia}
              {dependencia.subgerencia && ` - ${dependencia.subgerencia}`}
              {dependencia.unidad && ` - ${dependencia.unidad}`}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primera fila - Tipo de dependencia (full width destacado) */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Tipo de Dependencia <span className="text-red-500">*</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {getTipoDependenciaIcon(tipoDependencia)}
                      <span className="font-medium">
                        {tipoDependencia.charAt(0).toUpperCase() +
                          tipoDependencia.slice(1)}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => handleTipoChange('gerencia')}>
                    <Building className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">Gerencia</div>
                      <div className="text-xs text-muted-foreground">
                        Nivel organizacional superior
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTipoChange('subgerencia')}>
                    <Building2 className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">Subgerencia</div>
                      <div className="text-xs text-muted-foreground">
                        División dentro de una gerencia
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTipoChange('unidad')}>
                    <LayoutGrid className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">Unidad</div>
                      <div className="text-xs text-muted-foreground">
                        Equipo de trabajo específico
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Segunda fila - Selección de dependencias padre */}
          {(tipoDependencia === 'subgerencia' || tipoDependencia === 'unidad') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gerencia-select">
                  Gerencia <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={gerenciaSeleccionada}
                  onValueChange={setGerenciaSeleccionada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una gerencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingGerencias ? (
                      <div className="px-4 py-2 text-sm text-muted-foreground">
                        Cargando gerencias...
                      </div>
                    ) : gerencias.length > 0 ? (
                      gerencias.map((gerencia) => (
                        <SelectItem key={gerencia.id} value={gerencia.gerencia}>
                          {gerencia.gerencia}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-muted-foreground">
                        No hay gerencias disponibles
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {tipoDependencia === 'unidad' && !unidadDirectaAGerencia && (
                <div className="space-y-2">
                  <Label htmlFor="subgerencia-select">
                    Subgerencia <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={subgerenciaSeleccionada}
                    onValueChange={setSubgerenciaSeleccionada}
                    disabled={!gerenciaSeleccionada}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una subgerencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSubgerencias ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Cargando subgerencias...
                        </div>
                      ) : subgerencias.length > 0 ? (
                        subgerencias.map((subgerencia) => (
                          <SelectItem
                            key={subgerencia.id}
                            value={subgerencia.subgerencia}
                          >
                            {subgerencia.subgerencia}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          {gerenciaSeleccionada
                            ? 'No hay subgerencias disponibles para esta gerencia'
                            : 'Seleccione una gerencia primero'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Checkbox para unidades directas */}
          {tipoDependencia === 'unidad' && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Checkbox
                id="unidad-directa"
                checked={unidadDirectaAGerencia}
                onCheckedChange={(checked) => {
                  setUnidadDirectaAGerencia(checked as boolean);
                  if (checked) {
                    setSubgerenciaSeleccionada('');
                  }
                }}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="unidad-directa"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Esta unidad pertenece directamente a la gerencia
                </Label>
                <p className="text-xs text-muted-foreground">
                  Marque esta opción si la unidad no tiene una subgerencia intermedia
                </p>
              </div>
            </div>
          )}

          {/* Tercera fila - Nombre y Jefe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo para nombre */}
            <div className="space-y-2">
              <Label
                htmlFor={`nombre${tipoDependencia.charAt(0).toUpperCase() + tipoDependencia.slice(1)}`}
              >
                Nombre de la{' '}
                {tipoDependencia.charAt(0).toUpperCase() + tipoDependencia.slice(1)}{' '}
                <span className="text-red-500">*</span>
              </Label>
              {tipoDependencia === 'gerencia' && (
                <Input
                  id="nombreGerencia"
                  name="nombreGerencia"
                  value={formData.nombreGerencia}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre de la gerencia"
                  required
                />
              )}
              {tipoDependencia === 'subgerencia' && (
                <Input
                  id="nombreSubgerencia"
                  name="nombreSubgerencia"
                  value={formData.nombreSubgerencia}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre de la subgerencia"
                  required
                />
              )}
              {tipoDependencia === 'unidad' && (
                <Input
                  id="nombreUnidad"
                  name="nombreUnidad"
                  value={formData.nombreUnidad}
                  onChange={handleInputChange}
                  placeholder="Ingrese el nombre de la unidad"
                  required
                />
              )}
            </div>

            {/* Selector de Jefe Principal */}
            <div className="space-y-2">
              <Label>
                Jefe Responsable <span className="text-red-500">*</span>
              </Label>
              <Popover open={popoverOpenJefe} onOpenChange={handlePopoverJefeChange}>
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
                  <Command shouldFilter={false}>
                    <div className="relative">
                      <CommandInput
                        placeholder="Buscar por nombre, usuario o registro..."
                        className="h-9"
                        value={searchTermJefe}
                        onValueChange={setSearchTermJefe}
                      />
                      {isSearchingJefe && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <CommandEmpty>
                      {!searchTermJefe.trim()
                        ? 'Escriba para buscar usuarios'
                        : isSearchingJefe
                        ? 'Buscando...'
                        : 'No se encontraron usuarios.'}
                    </CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {searchResultsJefe.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.id}`}
                            onSelect={() => handleJefeSelection(user)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedJefe?.id === user.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{user.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.user} • {user.rol.nombre} • Reg: {user.registro}
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
                  Jefe: {selectedJefe.nombre}
                  {selectedJefe.user ? ` (${selectedJefe.user})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Cuarta fila - Jefe Secundario (Opcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                Jefe Secundario{' '}
                <span className="text-muted-foreground">(Opcional)</span>
              </Label>
              <Popover
                open={popoverOpenJefeSecundario}
                onOpenChange={handlePopoverJefeSecundarioChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpenJefeSecundario}
                    className="w-full justify-between"
                  >
                    {selectedJefeSecundario
                      ? selectedJefeSecundario.nombre
                      : 'Seleccione un jefe secundario'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <div className="relative">
                      <CommandInput
                        placeholder="Buscar por nombre, usuario o registro..."
                        className="h-9"
                        value={searchTermJefeSecundario}
                        onValueChange={setSearchTermJefeSecundario}
                      />
                      {isSearchingJefeSecundario && (
                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <CommandEmpty>
                      {!searchTermJefeSecundario.trim()
                        ? 'Escriba para buscar usuarios'
                        : isSearchingJefeSecundario
                        ? 'Buscando...'
                        : 'No se encontraron usuarios.'}
                    </CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {searchResultsJefeSecundario.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.id}`}
                            onSelect={() => handleJefeSecundarioSelection(user)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedJefeSecundario?.id === user.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{user.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.user} • {user.rol.nombre} • Reg: {user.registro}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedJefeSecundario && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Jefe Secundario: {selectedJefeSecundario.nombre}
                    {selectedJefeSecundario.user
                      ? ` (${selectedJefeSecundario.user})`
                      : ''}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedJefeSecundario(null)}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Limpiar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading
                ? 'Actualizando Dependencia...'
                : 'Actualizar Dependencia'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}

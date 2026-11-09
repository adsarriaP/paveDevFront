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

import { useFormDependencias } from './useFormDependencias';

interface FormDependenciasProps {
  onSuccess?: () => void;
  isVisible: boolean;
}

export default function FormDependencias({
  onSuccess,
  isVisible,
}: FormDependenciasProps) {
  const {
    // Estados
    isLoading,
    loadingGerencias,
    loadingSubgerencias,

    // Datos
    gerencias,
    subgerencias,

    // Búsqueda de jefe
    searchTermJefe,
    setSearchTermJefe,
    searchResultsJefe,
    isSearchingJefe,

    // Búsqueda de jefe secundario
    searchTermJefeSecundario,
    setSearchTermJefeSecundario,
    searchResultsJefeSecundario,
    isSearchingJefeSecundario,

    // Estados del formulario
    formData,
    selectedJefe,
    selectedJefeSecundario,
    tipoDependencia,
    gerenciaSeleccionada,
    subgerenciaSeleccionada,
    unidadDirectaAGerencia,

    // Estados de UI
    popoverOpenJefe,
    popoverOpenJefeSecundario,

    // Handlers
    handleInputChange,
    handleJefeSelection,
    handleJefeSecundarioSelection,
    handlePopoverJefeChange,
    handlePopoverJefeSecundarioChange,
    handleTipoChange,
    handleSubmit,
    setGerenciaSeleccionada,
    setSubgerenciaSeleccionada,
    setUnidadDirectaAGerencia,
  } = useFormDependencias({ isVisible, onSuccess });

  if (!isVisible) return null;

  return (
    <div className="max-w-6xl mx-auto">
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
                    {tipoDependencia === 'gerencia' && (
                      <Building className="h-5 w-5 " />
                    )}
                    {tipoDependencia === 'subgerencia' && (
                      <Building2 className="h-5 w-5 " />
                    )}
                    {tipoDependencia === 'unidad' && (
                      <LayoutGrid className="h-5 w-5 " />
                    )}
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
                  <Building className="mr-3 h-5 w-5 " />
                  <div>
                    <div className="font-medium">Gerencia</div>
                    <div className="text-xs text-muted-foreground">
                      Nivel organizacional superior
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleTipoChange('subgerencia')}
                >
                  <Building2 className="mr-3 h-5 w-5 " />
                  <div>
                    <div className="font-medium">Subgerencia</div>
                    <div className="text-xs text-muted-foreground">
                      División dentro de una gerencia
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTipoChange('unidad')}>
                  <LayoutGrid className="mr-3 h-5 w-5 " />
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
        {(tipoDependencia === 'subgerencia' ||
          tipoDependencia === 'unidad') && (
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
                Marque esta opción si la unidad no tiene una subgerencia
                intermedia
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
              {tipoDependencia.charAt(0).toUpperCase() +
                tipoDependencia.slice(1)}{' '}
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
                              {user.user} • {user.rol.nombre} • Reg:{' '}
                              {user.registro}
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
                              {user.user} • {user.rol.nombre} • Reg:{' '}
                              {user.registro}
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
              <p className="text-sm text-muted-foreground">
                Jefe Secundario: {selectedJefeSecundario.nombre}
                {selectedJefeSecundario.user
                  ? ` (${selectedJefeSecundario.user})`
                  : ''}
              </p>
            )}
          </div>
        </div>

        {/* Botón de crear */}
        <div className="pt-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? 'Creando Dependencia...'
              : `Crear ${tipoDependencia.charAt(0).toUpperCase() + tipoDependencia.slice(1)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

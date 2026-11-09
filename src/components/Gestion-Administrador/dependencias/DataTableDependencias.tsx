// src/components/dependencias/DataTableDependencias.tsx
import { useState, useEffect } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dependencia, DataTableDependenciasProps } from '@/types';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import SwitchEstado from '../../ui/SwitchEstado';
import EditarDependenciaForm from './EditarDependenciaForm';

export function DataTableDependencias({
  refreshTrigger,
}: DataTableDependenciasProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useApi();
  const [globalFilter, setGlobalFilter] = useState('');

  // Estados para manejar la edición
  const [isEditing, setIsEditing] = useState(false);
  const [dependenciaToEdit, setDependenciaToEdit] =
    useState<Dependencia | null>(null);

  // Funciones para manejar la edición
  const handleEditClick = (dependencia: Dependencia) => {
    setDependenciaToEdit(dependencia);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDependenciaToEdit(null);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    setDependenciaToEdit(null);
    fetchDependencias(); // Recargar los datos
  };

  // Función para cargar dependencias
  const fetchDependencias = async () => {
    try {
      setIsLoading(true);
      const response = await get<Dependencia[]>('/dependencias/all');
      setDependencias(response);
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
      Notify.failure('No se pudieron cargar las dependencias');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar dependencias al montar el componente
  useEffect(() => {
    fetchDependencias();
  }, []);

  // Efecto para actualizar cuando cambie refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchDependencias();
    }
  }, [refreshTrigger]);

  // Definir columnas
  const columns: ColumnDef<Dependencia>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'gerencia',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Gerencia
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue('gerencia')}</div>,
    },
    {
      accessorKey: 'subgerencia',
      header: 'Subgerencia',
      cell: ({ row }) => <div>{row.getValue('subgerencia') || '-'}</div>,
    },
    {
      accessorKey: 'unidad',
      header: 'Unidad',
      cell: ({ row }) => <div>{row.getValue('unidad') || '-'}</div>,
    },
    {
      // 🔧 SOLUCIONADO: Cambiar el accessorKey para que apunte al nombre del jefe
      accessorKey: 'jefeInfo.nombre',
      header: 'Jefe Principal',
      cell: ({ row }) => {
        const dependencia = row.original;
        return (
          <div>
            {dependencia.jefeInfo
              ? dependencia.jefeInfo.nombre
              : 'Sin jefe asignado'}
          </div>
        );
      },
      // 🆕 NUEVO: Función de filtro personalizada para el jefe
      filterFn: (row, _columnId, filterValue) => {
        const dependencia = row.original;
        const jefeNombre = dependencia.jefeInfo?.nombre || 'Sin jefe asignado';
        return jefeNombre.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: 'jefeSecundarioInfo.nombre',
      header: 'Jefe Secundario',
      cell: ({ row }) => {
        const dependencia = row.original;
        return (
          <div>
            {dependencia.jefeSecundarioInfo
              ? dependencia.jefeSecundarioInfo.nombre
              : '-'}
          </div>
        );
      },
      // Función de filtro personalizada para el jefe secundario
      filterFn: (row, _columnId, filterValue) => {
        const dependencia = row.original;
        const jefeSecundarioNombre =
          dependencia.jefeSecundarioInfo?.nombre || '-';
        return jefeSecundarioNombre
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.getValue('estado') as number;

        return (
          <Badge variant={estado === 1 ? 'status-activo' : 'status-inactivo'}>
            {estado === 1 ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const dependencia = row.original;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(dependencia)}
              className="h-8 px-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <SwitchEstado
              id={dependencia.id}
              estado={dependencia.estado ?? 0}
              entityName="dependencia"
              endpoint="dependencias"
              onToggleSuccess={() => {
                // Recargar la tabla cuando se cambie el estado
                fetchDependencias();
              }}
            />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: dependencias,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    // 🔧 SOLUCIONADO: Función de filtro global mejorada
    globalFilterFn: (row, _columnId, filterValue) => {
      const dependencia = row.original;
      const searchValue = String(filterValue).toLowerCase();

      // Buscar en todos los campos relevantes
      const searchFields = [
        dependencia.id?.toString(),
        dependencia.gerencia,
        dependencia.subgerencia,
        dependencia.unidad,
        dependencia.jefeInfo?.nombre || 'Sin jefe asignado', // 🆕 INCLUIR nombre del jefe
        dependencia.jefeSecundarioInfo?.nombre, // 🆕 INCLUIR nombre del jefe secundario
        dependencia.estado === 1 ? 'Activo' : 'Inactivo', // 🆕 INCLUIR estado
      ];

      return searchFields.some(
        (field) => field && String(field).toLowerCase().includes(searchValue)
      );
    },
  });

  // Si estamos editando, mostrar el formulario
  if (isEditing && dependenciaToEdit) {
    return (
      <Card>
        <EditarDependenciaForm
          dependencia={dependenciaToEdit}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">Cargando dependencias...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 pb-0">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Listado de dependencias
            </h2>
          </div>

          <div className="flex items-center py-4">
            <Input
              placeholder="Buscar en todas las columnas..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        <div className="px-5">
          <div className="overflow-x-auto">
            <div className="rounded-md border inline-block min-w-full">
              <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0">
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {table.getFilteredRowModel().rows.length} dependencia(s)
              encontrada(s)
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Filas por página</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataTableDependencias;

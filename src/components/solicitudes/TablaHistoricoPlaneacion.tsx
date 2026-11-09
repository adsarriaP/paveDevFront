import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo';
import { RootState } from '@/store/store';
import { Badge } from '@/components/ui/badge';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '../ui/card';
import type {
  SolicitudExpandida,
} from '@/types/entities.types';

// Tipo específico para la respuesta del endpoint de histórico
interface ApiResponseHistoricoSolicitudes {
  ok: boolean;
  msg: string;
  data: {
    solicitudes: SolicitudUsuario[];
    resumen: {
      totalSolicitudes: number;
      pendientes: number;
      aprobadas: number;
      rechazadas: number;
      canceladas: number;
    };
    dependenciasAsCargo: Array<{
      id: number;
      gerencia: string;
      subgerencia: string | null;
      unidad: string | null;
    }>;
    subordinados: Array<{
      id: number;
      nombre: string;
      user: string;
    }>;
  };
}

export type SolicitudUsuario = {
  id: number;
  usuario_id: number;
  periodos_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  dias_principal: number;
  fecha_inicio_secundario: string | null;
  fecha_fin_secundario: string | null;
  dias_secundario: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    rol_id: number;
    dependencia_id: number;
    ultimo_acceso: string;
    estado: number;
    rol: {
      id: number;
      nombre: string;
      descripcion: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    dependenciaInfo: null;
    jefeInfo: null;
    vacacionesInfo: [];
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
};

const getEstadoBadge = (estado: number) => {
  switch (estado) {
    case 0:
      return <Badge variant="outline">Cancelado</Badge>;
    case 1:
      return <Badge variant="status-pendiente">Pendiente</Badge>;
    case 2:
      return <Badge variant="status-inactivo">Rechazado</Badge>;
    case 3:
      return <Badge variant="status-activo">Aprobado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

// Función para expandir solicitudes en filas múltiples
const expandSolicitudes = (
  solicitudes: SolicitudUsuario[]
): SolicitudExpandida[] => {
  const expandidas: SolicitudExpandida[] = [];

  solicitudes.forEach((solicitud) => {
    const tienePeriodoSecundario =
      solicitud.fecha_inicio_secundario && solicitud.fecha_fin_secundario;

    if (tienePeriodoSecundario) {
      // Período principal (primera fila)
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        periodos_id: solicitud.periodos_id,
        estado: solicitud.estado,
        observaciones: solicitud.observaciones,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo: '1',
        fecha_inicio: solicitud.fecha_inicio_principal,
        fecha_fin: solicitud.fecha_fin_principal,
        dias: solicitud.dias_principal,
        isFirstRow: true,
        isLastRow: false,
        totalRows: 2,
        originalData: solicitud,
      });

      // Período secundario (segunda fila)
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        periodos_id: solicitud.periodos_id,
        estado: solicitud.estado,
        observaciones: solicitud.observaciones,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo: '2',
        fecha_inicio: solicitud.fecha_inicio_secundario!,
        fecha_fin: solicitud.fecha_fin_secundario!,
        dias: solicitud.dias_secundario,
        isFirstRow: false,
        isLastRow: true,
        totalRows: 2,
        originalData: solicitud,
      });
    } else {
      // Período único
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        periodos_id: solicitud.periodos_id,
        estado: solicitud.estado,
        observaciones: solicitud.observaciones,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo: 'Único',
        fecha_inicio: solicitud.fecha_inicio_principal,
        fecha_fin: solicitud.fecha_fin_principal,
        dias: solicitud.dias_principal,
        isFirstRow: true,
        isLastRow: true,
        totalRows: 1,
        originalData: solicitud,
      });
    }
  });

  return expandidas;
};

const getColumns = (): ColumnDef<SolicitudExpandida>[] => [
  {
    id: 'nombre',
    accessorFn: (row) => row.originalData.usuario.nombre,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nombre
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      const nombre = data.originalData.usuario.nombre;
      return (
        <div
          className="text-sm font-medium"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {nombre}
        </div>
      );
    },
  },
  {
    id: 'usuario',
    accessorFn: (row) => row.originalData.usuario.user,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Usuario
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      const usuario = data.originalData.usuario.user;
      return (
        <div
          className="text-sm"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {usuario}
        </div>
      );
    },
  },
  {
    id: 'registro',
    accessorFn: (row) => row.originalData.usuario.registro,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Registro
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      const registro = data.originalData.usuario.registro;
      return (
        <div
          className="text-sm"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {registro}
        </div>
      );
    },
  },
  {
    accessorKey: 'fecha_solicitud',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha Solicitud
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      const fecha = row.getValue('fecha_solicitud') as string;
      const [year, month, day] = fecha.split('T')[0].split('-');
      return (
        <div
          className="text-sm"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          ).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    id: 'periodo_causacion',
    accessorFn: (row) => row.originalData.periodos.nombre,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Período
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      const nombrePeriodo = data.originalData.periodos.nombre;
      return (
        <div
          className="text-sm font-medium text-center"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {nombrePeriodo}
        </div>
      );
    },
  },
  {
    accessorKey: 'periodo',
    header: 'Período',
    cell: ({ row }) => {
      const periodo = row.getValue('periodo') as string;
      return <div className="text-sm font-medium text-center">{periodo}</div>;
    },
  },
  {
    accessorKey: 'fecha_inicio',
    header: 'Fecha Inicio',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_inicio') as string;
      const [year, month, day] = fecha.split('-');
      return (
        <div className="text-sm">
          {new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          ).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'fecha_fin',
    header: 'Fecha Fin',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_fin') as string;
      const [year, month, day] = fecha.split('-');
      return (
        <div className="text-sm">
          {new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          ).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'dias',
    header: 'Días',
    cell: ({ row }) => {
      const dias = row.getValue('dias') as number;
      return <div className="text-sm">{dias}</div>;
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar estado en la primera fila (se extenderá visualmente)
      if (data.isFirstRow) {
        const estado = row.getValue('estado') as number;
        const esRechazado = estado === 2;
        const esCancelado = estado === 0;
        const solicitud = data.originalData;
        const mostrarOjo = (esRechazado || esCancelado) && solicitud.observaciones;

        return (
          <div className="flex items-center gap-2 h-full">
            {getEstadoBadge(estado)}
            {mostrarOjo && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title={esRechazado ? "Ver motivo de rechazo" : "Ver motivo de cancelación"}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {esRechazado ? "Motivo de Rechazo" : "Motivo de Cancelación"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {solicitud.observaciones}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      }
      return <div></div>; // Celda vacía para mantener estructura
    },
  },
];

export function TablaHistoricoPlaneacion() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<SolicitudExpandida[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { get } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);
  const { periodo, loading: loadingPeriodo } = usePeriodoActivo();

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('❌ [TablaHistoricoPlaneacion] No hay usuario logueado');
        setData([]);
        return;
      }

      if (!periodo?.id) {
        console.error('❌ [TablaHistoricoPlaneacion] No hay período activo');
        setData([]);
        return;
      }

      // URL con jefeId y periodoId activo
      const url = `/solicitudes/jefe/${user.id}/periodo-activo/${periodo.id}/todas`;

      console.log('📊 [TablaHistoricoPlaneacion] Fetching solicitudes:', {
        url,
        jefeId: user.id,
        periodoId: periodo.id,
        periodoNombre: periodo.nombre
      });

      const response = await get<ApiResponseHistoricoSolicitudes>(url);
      console.log('✅ [TablaHistoricoPlaneacion] Solicitudes obtenidas:', {
        total: response.data.solicitudes.length,
        resumen: response.data.resumen
      });

      setData(expandSolicitudes(response.data.solicitudes));
    } catch (error) {
      console.error('❌ [TablaHistoricoPlaneacion] Error fetching solicitudes:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Solo hacer fetch cuando tengamos usuario y período activo
    if (user?.id && periodo?.id && !loadingPeriodo) {
      fetchSolicitudes();
    }
  }, [user?.id, periodo?.id, loadingPeriodo]);

  const table = useReactTable({
    data,
    columns: getColumns(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Histórico de Solicitudes de Planeación
          </h2>
        </div>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrar por nombre..."
              value={(table.getColumn('nombre')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('nombre')?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-max">
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
                {loading || loadingPeriodo ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      {loadingPeriodo ? 'Cargando período activo...' : 'Cargando solicitudes...'}
                    </TableCell>
                  </TableRow>
                ) : !periodo ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-yellow-600">
                      No hay período activo configurado
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const data = row.original;
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={`
                          ${data.totalRows === 2 ? 'border-b-0' : ''}
                          ${data.isFirstRow && data.totalRows === 2 ? 'bg-muted/20' : ''}
                          ${data.isLastRow && data.totalRows === 2 ? 'bg-muted/20 border-b' : ''}
                          ${data.totalRows === 2 ? 'relative' : ''}
                        `}
                        style={{
                          position:
                            data.totalRows === 2 ? 'relative' : 'static',
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const columnId = cell.column.id;
                          const isEstadoCol = columnId === 'estado';
                          const isFechaCol = columnId === 'fecha_solicitud';
                          const isPeriodoCausacionCol = columnId === 'periodo_causacion';
                          const isNombreCol = columnId === 'nombre';
                          const isUsuarioCol = columnId === 'usuario';
                          const isRegistroCol = columnId === 'registro';

                          // Columnas que deben tener rowspan
                          const shouldSpan = isEstadoCol || isFechaCol || isPeriodoCausacionCol || isNombreCol || isUsuarioCol || isRegistroCol;

                          // Para solicitudes divididas, algunas celdas no se renderizan en la segunda fila
                          if (
                            data.totalRows === 2 &&
                            data.isLastRow &&
                            shouldSpan
                          ) {
                            return null; // No renderizar estas celdas en la segunda fila
                          }

                          return (
                            <TableCell
                              key={cell.id}
                              rowSpan={
                                data.totalRows === 2 &&
                                data.isFirstRow &&
                                shouldSpan
                                  ? 2
                                  : 1
                              }
                              className={`
                                ${data.totalRows === 2 && data.isLastRow && !shouldSpan ? 'border-t-0' : ''}
                                ${shouldSpan && data.totalRows === 2 && data.isFirstRow ? 'align-middle' : ''}
                              `}
                              style={{
                                verticalAlign:
                                  shouldSpan && data.totalRows === 2
                                    ? 'middle'
                                    : 'inherit',
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No hay solicitudes registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

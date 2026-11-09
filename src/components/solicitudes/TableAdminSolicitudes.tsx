import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
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
import { ArrowUpDown, History } from 'lucide-react';
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
import { Card, CardContent } from '../ui/card';
import type { ApiResponseSolicitudes } from '@/types/entities.types';
import { HistoryDialog, Movimiento } from '../Componentes-Generales/historyDialog';

export type SolicitudAdminUsuario = {
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
  historico?: string;
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
    planilla?: string | null;
    planilla_analista?: string | null;
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

// Tipo específico para la tabla administrativa expandida
export type SolicitudExpandidaAdmin = {
  id: number;
  solicitudId: number;
  usuario_id: number;
  periodos_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  totalRows: number;
  originalData: SolicitudAdminUsuario;
};

const getEstadoBadge = (estado: number) => {
  switch (estado) {
    case 0:
      return <Badge variant="status-inactivo">Inactivo</Badge>;
    case 1:
      return <Badge variant="status-pendiente">Pendiente</Badge>;
    case 2:
      return <Badge variant="status-alerta">Rechazado</Badge>;
    case 3:
      return <Badge variant="status-activo">Aprobado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

// Función para expandir solicitudes en filas múltiples
const expandSolicitudesAdmin = (
  solicitudes: SolicitudAdminUsuario[]
): SolicitudExpandidaAdmin[] => {
  const expandidas: SolicitudExpandidaAdmin[] = [];

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

const getColumns = (
  onHistoricoClick: (solicitud: SolicitudAdminUsuario) => void
): ColumnDef<SolicitudExpandidaAdmin>[] => [
  {
    id: 'solicitudId',
    accessorFn: (row) => row.solicitudId,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          ID
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

      return (
        <div
          className="text-sm font-medium"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {data.solicitudId}
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

      return (
        <div
          className="text-sm"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {data.originalData.usuario.registro}
        </div>
      );
    },
  },
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

      return (
        <div
          className="text-sm font-medium"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {data.originalData.usuario.nombre}
        </div>
      );
    },
  },
  {
    id: 'usuario',
    accessorFn: (row) => row.originalData.usuario.user,
    header: 'Usuario',
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar en la primera fila de cada solicitud
      if (!data.isFirstRow) {
        return null;
      }

      return (
        <div
          className="text-sm"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {data.originalData.usuario.user}
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
        return (
          <div className="flex items-center h-full">
            {getEstadoBadge(row.getValue('estado'))}
          </div>
        );
      }
      return <div></div>; // Celda vacía para mantener estructura
    },
  },
  {
    id: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => {
      const data = row.original;
      // Solo mostrar botón en la primera fila (se extenderá visualmente)
      if (data.isFirstRow) {
        const solicitud = data.originalData;

        return (
          <div className="flex gap-2">
            <div className="flex items-center h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onHistoricoClick(solicitud)}
                className="h-8 px-2"
                title="Ver histórico"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>
            </div>
          </div>
        );
      }
      return <div></div>; // Celda vacía para mantener estructura
    },
  },
];

// Interfaz para el estado de Redux
interface RootState {
  auth: {
    user: {
      id: string | number;
      rol: string;
      planilla?: string | null;
    } | null;
  };
}

export function TableAdminSolicitudes() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<SolicitudExpandidaAdmin[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Estados para el historial
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<Movimiento[]>([]);

  const { get } = useApi();

  // Obtener información del usuario logueado desde Redux
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.rol || '';
  const isAdmin = userRole === 'ADMINISTRADOR';
  const isAnalista = userRole === 'ANALISTA';

  // Convertir planilla a array para soportar múltiples planillas
  const planillasGestionadas = React.useMemo(() => {
    const planilla = currentUser?.planilla;
    if (!planilla) return [];
    return Array.isArray(planilla) ? planilla : [planilla];
  }, [currentUser?.planilla]);

  // Función para manejar el histórico
  const handleHistoricoClick = (solicitud: SolicitudAdminUsuario) => {
    let historico: Movimiento[] = [];
    try {
      historico = solicitud.historico ? JSON.parse(solicitud.historico) : [];
    } catch {
      historico = [];
    }
    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  const fetchAllSolicitudes = React.useCallback(async () => {
    try {
      setLoading(true);

      // Primero obtenemos el período activo
      const periodoActivo = await get<{
        id: number;
        nombre: string;
        anio_causacion: number;
        activo: boolean;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
      }>('/periodos/activo');

      if (!periodoActivo || !periodoActivo.id) {
        console.error('No hay período activo disponible');
        setData([]);
        return;
      }

      console.log('Período activo:', periodoActivo);

      // Luego obtenemos las solicitudes del período activo
      const response = await get<ApiResponseSolicitudes>(
        `/solicitudes/periodo/${periodoActivo.id}`
      );
      const solicitudes = response?.data || [];

      // Filtrar según el rol del usuario (capa adicional de seguridad en frontend)
      let solicitudesFiltradas = solicitudes;

      if (isAdmin) {
        // Administrador: ve todas las solicitudes
        solicitudesFiltradas = solicitudes;
      } else if (isAnalista && planillasGestionadas.length > 0) {
        // Analista: solo ve solicitudes de usuarios cuyo planilla_analista coincide con alguna de las planillas que gestiona
        // LÓGICA: usuario.planilla_analista está incluido en analista.planilla (array)
        solicitudesFiltradas = solicitudes.filter(
          (s) => { const p = (s.usuario as { planilla_analista?: string }).planilla_analista; return p != null && planillasGestionadas.includes(p); }
        );
        console.log('Filtrado ANALISTA - Planillas gestionadas:', planillasGestionadas);
        console.log('Solicitudes totales:', solicitudes.length);
        console.log('Solicitudes filtradas:', solicitudesFiltradas.length);
      } else {
        // Usuario regular: solo ve sus propias solicitudes
        solicitudesFiltradas = solicitudes.filter(
          (s) => s.usuario_id === Number(currentUser?.id)
        );
      }

      setData(expandSolicitudesAdmin(solicitudesFiltradas));
    } catch (error) {
      console.error('Error fetching solicitudes for active period:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [get, isAdmin, isAnalista, planillasGestionadas, currentUser?.id]);

  React.useEffect(() => {
    fetchAllSolicitudes();
  }, [fetchAllSolicitudes]);

  const table = useReactTable({
    data,
    columns: getColumns(handleHistoricoClick),
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
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      // Buscar en todos los campos relevantes
      const searchableValues = [
        row.original.solicitudId?.toString(),
        row.original.originalData.usuario.registro?.toString(),
        row.original.originalData.usuario.nombre,
        row.original.originalData.usuario.user,
        row.original.fecha_inicio,
        row.original.fecha_fin,
        row.original.periodo,
        row.original.dias?.toString(),
      ];

      return searchableValues.some(
        (value) =>
          value &&
          String(value)
            .toLowerCase()
            .includes(String(filterValue).toLowerCase())
      );
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Todas las Solicitudes del Período Actual
          </h2>
        </div>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Buscar en todas las columnas..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Cargando solicitudes...
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
                          const isStatOrAction =
                            columnId === 'estado' || columnId === 'acciones';
                          const isInfoCol =
                            columnId === 'solicitudId' ||
                            columnId === 'registro' ||
                            columnId === 'nombre' ||
                            columnId === 'usuario';

                          // Para solicitudes divididas, algunas celdas no se renderizan en la segunda fila
                          if (
                            data.totalRows === 2 &&
                            data.isLastRow &&
                            (isStatOrAction || isInfoCol)
                          ) {
                            return null; // No renderizar estas celdas en la segunda fila
                          }

                          return (
                            <TableCell
                              key={cell.id}
                              rowSpan={
                                data.totalRows === 2 &&
                                data.isFirstRow &&
                                (isStatOrAction || isInfoCol)
                                  ? 2
                                  : 1
                              }
                              className={`
                                ${data.totalRows === 2 && data.isLastRow && !isStatOrAction && !isInfoCol ? 'border-t-0' : ''}
                                ${(isStatOrAction || isInfoCol) && data.totalRows === 2 && data.isFirstRow ? 'align-middle' : ''}
                              `}
                              style={{
                                verticalAlign:
                                  (isStatOrAction || isInfoCol) &&
                                  data.totalRows === 2
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
      <HistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={historyData}
      />
    </Card>
  );
}

import * as React from 'react';
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
import { ArrowUpDown, Eye, History } from 'lucide-react';
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
import { HistoryDialog, Movimiento } from '../Componentes-Generales/historyDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  SolicitudAplazamientoAdmin,
  SolicitudAplazamientoExpandidaAdmin,
  Periodo,
} from '@/types';
import { ReporteInfotipoAplazamiento } from '@/components/Gestion-Administrador/reportes/ReporteInfotipoAplazamiento';

const getEstadoBadge = (estado: number) => {
  switch (estado) {
    case 0:
      return <Badge variant="outline">Inactivo</Badge>;
    case 1:
      return <Badge variant="status-pendiente">Pendiente</Badge>;
    case 2:
      return <Badge variant="status-inactivo">Rechazado</Badge>;
    case 3:
      return <Badge variant="status-activo">Aprobado Jefe</Badge>;
    case 4:
      return <Badge variant="status-activo">Aprobado Gerente</Badge>;
    case 5:
      return <Badge variant="status-activo">Aprobado Gestor</Badge>;
    case 6:
      return <Badge variant="status-activo">Aprobado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

// Función helper para formatear fechas
const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  ).toLocaleDateString();
};

// Función para expandir solicitudes en filas múltiples
const expandSolicitudes = (
  solicitudes: SolicitudAplazamientoAdmin[]
): SolicitudAplazamientoExpandidaAdmin[] => {
  const expandidas: SolicitudAplazamientoExpandidaAdmin[] = [];

  solicitudes.forEach((solicitud) => {
    const tienePeriodoSecundario =
      solicitud.fecha_disfrute_secundario_nueva &&
      solicitud.fecha_retorno_secundario_nueva;

    if (tienePeriodoSecundario) {
      // Período principal (primera fila)
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        usuario_nombre: solicitud.usuario.nombre,
        usuario_user: solicitud.usuario.user,
        usuario_registro: solicitud.usuario.registro,
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo_nombre: solicitud.periodos.nombre,
        periodo: '1',
        fecha_inicio_nueva: solicitud.fecha_disfrute_nueva,
        fecha_fin_nueva: solicitud.fecha_retorno_nueva,
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
        usuario_nombre: solicitud.usuario.nombre,
        usuario_user: solicitud.usuario.user,
        usuario_registro: solicitud.usuario.registro,
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo_nombre: solicitud.periodos.nombre,
        periodo: '2',
        fecha_inicio_nueva: solicitud.fecha_disfrute_secundario_nueva!,
        fecha_fin_nueva: solicitud.fecha_retorno_secundario_nueva!,
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
        usuario_nombre: solicitud.usuario.nombre,
        usuario_user: solicitud.usuario.user,
        usuario_registro: solicitud.usuario.registro,
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
        periodo_nombre: solicitud.periodos.nombre,
        periodo: 'Único',
        fecha_inicio_nueva: solicitud.fecha_disfrute_nueva,
        fecha_fin_nueva: solicitud.fecha_retorno_nueva,
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

// Componente para el diálogo de información adicional
interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudAplazamientoAdmin;
}

const InfoDialog: React.FC<InfoDialogProps> = ({
  open,
  onClose,
  solicitud,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información Detallada del Aplazamiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Información del usuario */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">
              Información del Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Nombre:</span>{' '}
                {solicitud.usuario.nombre}
              </div>
              <div>
                <span className="font-medium">Usuario:</span>{' '}
                {solicitud.usuario.user}
              </div>
              <div>
                <span className="font-medium">Registro:</span>{' '}
                {solicitud.usuario.registro}
              </div>
            </div>
          </div>

          {/* Información del período */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">
              Información del Período
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Período:</span>{' '}
                {solicitud.periodos.nombre}
              </div>
              <div>
                <span className="font-medium">Año Causación:</span>{' '}
                {solicitud.periodos.anio_causacion}
              </div>
            </div>
          </div>

          {/* Fechas Actuales */}
          <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-900/20">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
              Fechas Actuales Programadas (Antes del Aplazamiento)
            </h3>
            {solicitud.fecha_disfrute_secundario_actual &&
            solicitud.fecha_retorno_secundario_actual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    PRIMER PERÍODO
                  </p>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div>
                      <strong>Inicio:</strong>{' '}
                      {formatDate(solicitud.fecha_disfrute_actual)}
                    </div>
                    <div>
                      <strong>Fin:</strong>{' '}
                      {formatDate(solicitud.fecha_retorno_actual)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    SEGUNDO PERÍODO
                  </p>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div>
                      <strong>Inicio:</strong>{' '}
                      {formatDate(solicitud.fecha_disfrute_secundario_actual)}
                    </div>
                    <div>
                      <strong>Fin:</strong>{' '}
                      {formatDate(solicitud.fecha_retorno_secundario_actual)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-700 dark:text-green-300">
                <div>
                  <strong>Inicio:</strong>{' '}
                  {formatDate(solicitud.fecha_disfrute_actual)}
                </div>
                <div>
                  <strong>Fin:</strong>{' '}
                  {formatDate(solicitud.fecha_retorno_actual)}
                </div>
              </div>
            )}
          </div>

          {/* Fechas Nuevas */}
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              Nuevas Fechas Solicitadas (Después del Aplazamiento)
            </h3>
            {solicitud.fecha_disfrute_secundario_nueva &&
            solicitud.fecha_retorno_secundario_nueva ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    PRIMER PERÍODO ({solicitud.dias_principal} días)
                  </p>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>Inicio:</strong>{' '}
                      {formatDate(solicitud.fecha_disfrute_nueva)}
                    </div>
                    <div>
                      <strong>Fin:</strong>{' '}
                      {formatDate(solicitud.fecha_retorno_nueva)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    SEGUNDO PERÍODO ({solicitud.dias_secundario} días)
                  </p>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>Inicio:</strong>{' '}
                      {formatDate(solicitud.fecha_disfrute_secundario_nueva)}
                    </div>
                    <div>
                      <strong>Fin:</strong>{' '}
                      {formatDate(solicitud.fecha_retorno_secundario_nueva)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div>
                  <strong>Inicio:</strong>{' '}
                  {formatDate(solicitud.fecha_disfrute_nueva)}
                </div>
                <div>
                  <strong>Fin:</strong>{' '}
                  {formatDate(solicitud.fecha_retorno_nueva)}
                </div>
                <div>
                  <strong>Total días:</strong> {solicitud.dias_principal}
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {solicitud.observaciones && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="text-sm font-semibold mb-2">Observaciones</h3>
              <p className="text-sm whitespace-pre-wrap">
                {solicitud.observaciones}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getColumns = (
  onInfoClick: (solicitud: SolicitudAplazamientoAdmin) => void,
  onHistoricoClick: (solicitud: SolicitudAplazamientoAdmin) => void
): ColumnDef<SolicitudAplazamientoExpandidaAdmin>[] => [
  {
    accessorKey: 'usuario_nombre',
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
          {data.usuario_nombre}
        </div>
      );
    },
  },
  {
    accessorKey: 'usuario_user',
    header: 'Usuario',
    cell: ({ row }) => {
      const data = row.original;
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
          {data.usuario_user}
        </div>
      );
    },
  },
  {
    accessorKey: 'usuario_registro',
    header: 'Registro',
    cell: ({ row }) => {
      const data = row.original;
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
          {data.usuario_registro}
        </div>
      );
    },
  },
  {
    accessorKey: 'periodo_nombre',
    header: 'Período',
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) {
        return null;
      }

      return (
        <div
          className="text-sm font-medium text-center"
          style={{
            display: 'table-cell',
            verticalAlign: 'middle',
          }}
        >
          {data.periodo_nombre}
        </div>
      );
    },
  },
  {
    accessorKey: 'periodo',
    header: 'Período Disfrute',
    cell: ({ row }) => {
      const periodo = row.getValue('periodo') as string;
      return <div className="text-sm font-medium text-center">{periodo}</div>;
    },
  },
  {
    accessorKey: 'fecha_inicio_nueva',
    header: 'Fecha Inicio',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_inicio_nueva') as string;
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
    accessorKey: 'fecha_fin_nueva',
    header: 'Fecha Fin',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_fin_nueva') as string;
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
      if (data.isFirstRow) {
        return (
          <div className="flex items-center h-full">
            {getEstadoBadge(row.getValue('estado'))}
          </div>
        );
      }
      return <div></div>;
    },
  },
  {
    id: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => {
      const data = row.original;
      if (data.isFirstRow) {
        const solicitud = data.originalData;

        return (
          <div className="flex gap-2">
            <div className="flex items-center h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInfoClick(solicitud)}
                className="h-8 px-2"
                title="Más información"
              >
                <Eye className="h-4 w-4" />
                Más info
              </Button>
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
      return <div></div>;
    },
  },
];

export function TableAdminSolicitudesAplazamiento() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [, setOriginalData] = React.useState<SolicitudAplazamientoAdmin[]>([]);
  const [data, setData] = React.useState<SolicitudAplazamientoExpandidaAdmin[]>(
    []
  );
  const [loading, setLoading] = React.useState(true);
  const [periodos, setPeriodos] = React.useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = React.useState<string>('');

  // Estados para el diálogo de información
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);
  const [selectedSolicitud, setSelectedSolicitud] =
    React.useState<SolicitudAplazamientoAdmin | null>(null);

  // Estados para el historial
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<Movimiento[]>([]);

  const { get } = useApi();

  // Función para manejar el clic en "Más información"
  const handleInfoClick = (solicitud: SolicitudAplazamientoAdmin) => {
    setSelectedSolicitud(solicitud);
    setInfoDialogOpen(true);
  };

  // Función para manejar el histórico
  const handleHistoricoClick = (solicitud: SolicitudAplazamientoAdmin) => {
    let historico: Movimiento[] = [];
    try {
      historico = solicitud.historico ? JSON.parse(solicitud.historico) : [];
    } catch {
      historico = [];
    }
    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  // Cargar períodos
  const fetchPeriodos = async () => {
    try {
      console.log('Fetching períodos...');
      const response = await get<unknown>('/periodos');
      console.log('Response períodos completa:', response);
      console.log('Tipo de response:', typeof response);
      console.log('Es array?:', Array.isArray(response));

      // Manejar diferentes formatos de respuesta
      let periodosData: Periodo[] = [];

      const typedResponse = response as Periodo[] | { data?: Periodo[] };
      if (Array.isArray(typedResponse)) {
        // La respuesta es directamente un array
        periodosData = typedResponse;
      } else if (typedResponse && 'data' in typedResponse && Array.isArray(typedResponse.data)) {
        // La respuesta tiene formato { ok, msg, data }
        periodosData = typedResponse.data;
      }

      console.log('Períodos procesados:', periodosData);
      console.log('Cantidad de períodos:', periodosData.length);

      setPeriodos(periodosData);

      // Seleccionar el período activo por defecto
      const periodoActivo = periodosData.find((p: Periodo) => p.activo);
      console.log('Período activo encontrado:', periodoActivo);

      if (periodoActivo) {
        setSelectedPeriodo(periodoActivo.id.toString());
        console.log('Período seleccionado (activo):', periodoActivo.id);
      } else if (periodosData.length > 0) {
        // Si no hay período activo, seleccionar el primero
        setSelectedPeriodo(periodosData[0].id.toString());
        console.log('Período seleccionado (primero):', periodosData[0].id);
      } else {
        console.log('No hay períodos disponibles');
      }
    } catch (error) {
      console.error('Error fetching períodos:', error);
      setPeriodos([]);
    }
  };

  // Cargar solicitudes según el período seleccionado
  const fetchSolicitudes = async (periodoId: string) => {
    try {
      setLoading(true);
      if (!periodoId) {
        setOriginalData([]);
        setData([]);
        return;
      }
      console.log('Fetching solicitudes for periodo:', periodoId);
      const response = await get<SolicitudAplazamientoAdmin[] | { data?: SolicitudAplazamientoAdmin[] }>(
        `/solicitudes-aplazamiento?periodoId=${periodoId}`
      );
      console.log('Response solicitudes completa:', response);
      console.log('Tipo de response:', typeof response);

      // Manejar diferentes formatos de respuesta
      let solicitudesData: SolicitudAplazamientoAdmin[] = [];

      if (Array.isArray(response)) {
        // La respuesta es directamente un array
        solicitudesData = response;
      } else if (response && typeof response === 'object' && response.data) {
        // La respuesta tiene formato { ok, msg, data }
        solicitudesData = Array.isArray(response.data) ? response.data : [];
      }

      console.log('Solicitudes procesadas:', solicitudesData);
      console.log('Cantidad de solicitudes:', solicitudesData.length);

      setOriginalData(solicitudesData);
      setData(expandSolicitudes(solicitudesData));
    } catch (error) {
      console.error('Error fetching solicitudes de aplazamiento:', error);
      setOriginalData([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPeriodos();
  }, []);

  React.useEffect(() => {
    if (selectedPeriodo) {
      fetchSolicitudes(selectedPeriodo);
    }
  }, [selectedPeriodo]);

  const table = useReactTable({
    data,
    columns: getColumns(handleInfoClick, handleHistoricoClick),
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Solicitudes de Aplazamiento
          </h2>
          <ReporteInfotipoAplazamiento periodoId={selectedPeriodo} />
        </div>
        <div className="w-full">
          <div className="flex items-center gap-4 py-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Período:</label>
              <Select
                value={selectedPeriodo}
                onValueChange={setSelectedPeriodo}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccione un período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      {periodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Filtrar por nombre..."
              value={
                (table
                  .getColumn('usuario_nombre')
                  ?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table
                  .getColumn('usuario_nombre')
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
          <div className="overflow-hidden rounded-md border">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Cargando solicitudes de aplazamiento...
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
                          const isUsuarioCol =
                            columnId === 'usuario_nombre' ||
                            columnId === 'usuario_user' ||
                            columnId === 'usuario_registro';
                          const isPeriodoCol = columnId === 'periodo_nombre';

                          // Para solicitudes divididas, algunas celdas no se renderizan en la segunda fila
                          if (
                            data.totalRows === 2 &&
                            data.isLastRow &&
                            (isStatOrAction || isUsuarioCol || isPeriodoCol)
                          ) {
                            return null;
                          }

                          return (
                            <TableCell
                              key={cell.id}
                              rowSpan={
                                data.totalRows === 2 &&
                                data.isFirstRow &&
                                (isStatOrAction || isUsuarioCol || isPeriodoCol)
                                  ? 2
                                  : 1
                              }
                              className={`
                                ${data.totalRows === 2 && data.isLastRow && !isStatOrAction && !isUsuarioCol && !isPeriodoCol ? 'border-t-0' : ''}
                                ${(isStatOrAction || isUsuarioCol || isPeriodoCol) && data.totalRows === 2 && data.isFirstRow ? 'align-middle' : ''}
                              `}
                              style={{
                                verticalAlign:
                                  (isStatOrAction ||
                                    isUsuarioCol ||
                                    isPeriodoCol) &&
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
                      No hay solicitudes de aplazamiento registradas.
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
      {selectedSolicitud && (
        <InfoDialog
          open={infoDialogOpen}
          onClose={() => setInfoDialogOpen(false)}
          solicitud={selectedSolicitud}
        />
      )}
    </Card>
  );
}

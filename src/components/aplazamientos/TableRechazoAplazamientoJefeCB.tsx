import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon, Eye, History, Search } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';
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
import { ArrowUpDown } from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HistoryDialog } from '@/components/Componentes-Generales/historyDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  SolicitudAplazamientoRechazadaJefeCB,
  SolicitudRechazadaJefeCBExpandida,
  ApiResponseRechazadasJefeCB,
} from '@/types';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  ).toLocaleDateString('es-CO');
};

const expandSolicitudes = (
  solicitudes: SolicitudAplazamientoRechazadaJefeCB[]
): SolicitudRechazadaJefeCBExpandida[] => {
  const expandidas: SolicitudRechazadaJefeCBExpandida[] = [];

  solicitudes.forEach((solicitud) => {
    const tienePeriodoSecundario =
      solicitud.fecha_disfrute_secundario_nueva &&
      solicitud.fecha_retorno_secundario_nueva;

    if (tienePeriodoSecundario) {
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        usuario_nombre: solicitud.usuario.nombre,
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
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        usuario_nombre: solicitud.usuario.nombre,
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
      expandidas.push({
        id: expandidas.length,
        solicitudId: solicitud.id,
        usuario_id: solicitud.usuario_id,
        usuario_nombre: solicitud.usuario.nombre,
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

// ─── InfoDialog ───────────────────────────────────────────────────────────────

interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudAplazamientoRechazadaJefeCB;
}

const InfoDialog: React.FC<InfoDialogProps> = ({ open, onClose, solicitud }) => {
  // Extraer el motivo de rechazo del histórico si existe
  const motivoRechazo = React.useMemo(() => {
    if (!solicitud.historico) return solicitud.observaciones;
    try {
      const historico = JSON.parse(solicitud.historico);
      const rechazo = historico.find(
        (h: { tipomovimiento: string; motivoRechazo?: string }) =>
          h.tipomovimiento === 'Rechazo jefe cb'
      );
      return rechazo?.motivoRechazo ?? solicitud.observaciones;
    } catch {
      return solicitud.observaciones;
    }
  }, [solicitud]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Aplazamiento Rechazado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Información del empleado */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">Empleado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Nombre: </span>
                {solicitud.usuario.nombre}
              </div>
              <div>
                <span className="font-medium">Registro: </span>
                {solicitud.usuario.registro}
              </div>
            </div>
          </div>

          {/* Información del período */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Período: </span>
                {solicitud.periodos.nombre}
              </div>
              <div>
                <span className="font-medium">Año causación: </span>
                {solicitud.periodos.anio_causacion}
              </div>
            </div>
          </div>

          {/* Fechas actuales */}
          <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-900/20">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
              Fechas Programadas (Antes del Aplazamiento)
            </h3>
            {solicitud.fecha_disfrute_secundario_actual &&
            solicitud.fecha_retorno_secundario_actual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    PRIMER PERÍODO
                  </p>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div>
                      <strong>Inicio: </strong>
                      {formatDate(solicitud.fecha_disfrute_actual)}
                    </div>
                    <div>
                      <strong>Fin: </strong>
                      {formatDate(solicitud.fecha_retorno_actual)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    SEGUNDO PERÍODO
                  </p>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div>
                      <strong>Inicio: </strong>
                      {formatDate(solicitud.fecha_disfrute_secundario_actual)}
                    </div>
                    <div>
                      <strong>Fin: </strong>
                      {formatDate(solicitud.fecha_retorno_secundario_actual)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <div>
                  <strong>Inicio: </strong>
                  {formatDate(solicitud.fecha_disfrute_actual)}
                </div>
                <div>
                  <strong>Fin: </strong>
                  {formatDate(solicitud.fecha_retorno_actual)}
                </div>
              </div>
            )}
          </div>

          {/* Fechas nuevas solicitadas */}
          <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
              Nuevas Fechas Solicitadas (Rechazadas)
            </h3>
            {solicitud.fecha_disfrute_secundario_nueva &&
            solicitud.fecha_retorno_secundario_nueva ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    PRIMER PERÍODO ({solicitud.dias_principal} días)
                  </p>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>Inicio: </strong>
                      {formatDate(solicitud.fecha_disfrute_nueva)}
                    </div>
                    <div>
                      <strong>Fin: </strong>
                      {formatDate(solicitud.fecha_retorno_nueva)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    SEGUNDO PERÍODO ({solicitud.dias_secundario} días)
                  </p>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>Inicio: </strong>
                      {formatDate(solicitud.fecha_disfrute_secundario_nueva)}
                    </div>
                    <div>
                      <strong>Fin: </strong>
                      {formatDate(solicitud.fecha_retorno_secundario_nueva)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div>
                  <strong>Inicio: </strong>
                  {formatDate(solicitud.fecha_disfrute_nueva)}
                </div>
                <div>
                  <strong>Fin: </strong>
                  {formatDate(solicitud.fecha_retorno_nueva)}
                </div>
                <div>
                  <strong>Total días: </strong>
                  {solicitud.dias_principal}
                </div>
              </div>
            )}
          </div>

          {/* Motivo de rechazo */}
          <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50 dark:border-red-700 dark:bg-red-900/20">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
              Motivo de Rechazo
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {motivoRechazo || '—'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Columnas ─────────────────────────────────────────────────────────────────

const getColumns = (
  onInfoClick: (solicitud: SolicitudAplazamientoRechazadaJefeCB) => void,
  onHistoricoClick: (solicitud: SolicitudAplazamientoRechazadaJefeCB) => void
): ColumnDef<SolicitudRechazadaJefeCBExpandida>[] => [
  {
    accessorKey: 'fecha_solicitud',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Fecha Solicitud
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) return null;
      const fecha = (row.getValue('fecha_solicitud') as string).split('T')[0];
      const [year, month, day] = fecha.split('-');
      return (
        <div className="text-sm">
          {new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-CO')}
        </div>
      );
    },
  },
  {
    id: 'usuario_nombre',
    accessorKey: 'usuario_nombre',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Empleado
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) return null;
      return (
        <div className="text-sm font-medium capitalize">
          {data.usuario_nombre}
        </div>
      );
    },
  },
  {
    id: 'usuario_registro',
    accessorKey: 'usuario_registro',
    header: 'Registro',
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) return null;
      return <div className="text-sm">{data.usuario_registro}</div>;
    },
  },
  {
    id: 'periodo_nombre',
    accessorKey: 'periodo_nombre',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Período
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) return null;
      return <div className="text-sm text-center">{data.periodo_nombre}</div>;
    },
  },
  {
    accessorKey: 'periodo',
    header: 'Nº Per.',
    cell: ({ row }) => (
      <div className="text-sm text-center">
        {row.getValue('periodo') as string}
      </div>
    ),
  },
  {
    accessorKey: 'fecha_inicio_nueva',
    header: 'Inicio Nueva',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_inicio_nueva') as string;
      const [year, month, day] = fecha.split('-');
      return (
        <div className="text-sm">
          {new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-CO')}
        </div>
      );
    },
  },
  {
    accessorKey: 'fecha_fin_nueva',
    header: 'Fin Nueva',
    cell: ({ row }) => {
      const fecha = row.getValue('fecha_fin_nueva') as string;
      const [year, month, day] = fecha.split('-');
      return (
        <div className="text-sm">
          {new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('es-CO')}
        </div>
      );
    },
  },
  {
    accessorKey: 'dias',
    header: 'Días',
    cell: ({ row }) => (
      <div className="text-sm text-center">{row.getValue('dias') as number}</div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      if (!row.original.isFirstRow) return <div />;
      return (
        <div className="flex items-center h-full">
          <Badge variant="status-inactivo">Rechazado</Badge>
        </div>
      );
    },
  },
  {
    id: 'acciones',
    header: 'Acciones',
    cell: ({ row }) => {
      const data = row.original;
      if (!data.isFirstRow) return <div />;
      const solicitud = data.originalData;
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInfoClick(solicitud)}
            className="h-8 px-2"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
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
      );
    },
  },
];

// ─── DateRangePicker ──────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);

  const label = React.useMemo(() => {
    if (!value?.from) return 'Seleccionar rango de fechas';
    if (!value.to)
      return format(value.from, 'd MMM yyyy');
    return `${format(value.from, 'd MMM yyyy')} – ${format(value.to, 'd MMM yyyy')}`;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal min-w-[260px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className={!value?.from ? 'text-muted-foreground' : ''}>
            {label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => onChange(range)}
          numberOfMonths={2}
          disabled={false}
        />
      </PopoverContent>
    </Popover>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function TableRechazoAplazamientoJefeCB() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<SolicitudRechazadaJefeCBExpandida[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [apiMsg, setApiMsg] = React.useState<string>('');

  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);
  const [selectedSolicitud, setSelectedSolicitud] =
    React.useState<SolicitudAplazamientoRechazadaJefeCB | null>(null);

  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<unknown[]>([]);

  const { get } = useApi();

  const handleInfoClick = (solicitud: SolicitudAplazamientoRechazadaJefeCB) => {
    setSelectedSolicitud(solicitud);
    setInfoDialogOpen(true);
  };

  const handleHistoricoClick = (solicitud: SolicitudAplazamientoRechazadaJefeCB) => {
    let historico: unknown[] = [];

    try {
      if (solicitud.historico) {
        if (Array.isArray(solicitud.historico)) {
          historico = solicitud.historico;
        } else if (typeof solicitud.historico === 'string') {
          let str = solicitud.historico.trim();
          if (!str.endsWith(']')) {
            const lastBrace = str.lastIndexOf('}');
            if (lastBrace !== -1) str = str.substring(0, lastBrace + 1) + ']';
          }
          historico = JSON.parse(str);
        }
      }
    } catch (e) {
      console.error('Error al parsear histórico:', e);
      Notify.warning('No se pudo cargar el histórico completo.', {
        timeout: 4000,
        width: '360px',
      });
    }

    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  const fetchRechazadas = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      Notify.warning('Selecciona un rango de fechas válido.', { timeout: 3000 });
      return;
    }

    const fechaInicio = format(dateRange.from, 'yyyy-MM-dd');
    const fechaFin = format(dateRange.to, 'yyyy-MM-dd');

    try {
      setLoading(true);
      setApiMsg('');
      const response = await get<ApiResponseRechazadasJefeCB>(
        '/solicitudes-aplazamiento/rechazadas-por-jefe-cb',
        { params: { fechaInicio, fechaFin } }
      );
      setApiMsg(response.msg);
      setData(expandSolicitudes(response.data));
    } catch {
      setData([]);
      setApiMsg('');
    } finally {
      setLoading(false);
    }
  };

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
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight mb-4">
            Aplazamientos rechazados por Jefe CB
          </h2>

          {/* Filtro de fechas */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Rango de fechas
              </span>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <Button onClick={fetchRechazadas} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          {/* Mensaje de respuesta del API */}
          {apiMsg && (
            <p className="mt-3 text-sm text-muted-foreground">{apiMsg}</p>
          )}
        </div>

        <div className="w-full">
          {/* Filtro de texto */}
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrar por empleado..."
              value={
                (table.getColumn('usuario_nombre')?.getFilterValue() as string) ?? ''
              }
              onChange={(e) =>
                table.getColumn('usuario_nombre')?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Buscando solicitudes rechazadas...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const rowData = row.original;
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={`
                          ${rowData.totalRows === 2 ? 'border-b-0' : ''}
                          ${rowData.isFirstRow && rowData.totalRows === 2 ? 'bg-muted/20' : ''}
                          ${rowData.isLastRow && rowData.totalRows === 2 ? 'bg-muted/20 border-b' : ''}
                        `}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const colId = cell.column.id;
                          const isSharedCol =
                            colId === 'fecha_solicitud' ||
                            colId === 'usuario_nombre' ||
                            colId === 'usuario_registro' ||
                            colId === 'periodo_nombre' ||
                            colId === 'estado' ||
                            colId === 'acciones';

                          // Segunda fila de solicitudes divididas: omitir celdas compartidas
                          if (
                            rowData.totalRows === 2 &&
                            rowData.isLastRow &&
                            isSharedCol
                          ) {
                            return null;
                          }

                          return (
                            <TableCell
                              key={cell.id}
                              rowSpan={
                                rowData.totalRows === 2 &&
                                rowData.isFirstRow &&
                                isSharedCol
                                  ? 2
                                  : 1
                              }
                              className={`
                                ${rowData.totalRows === 2 && rowData.isLastRow && !isSharedCol ? 'border-t-0' : ''}
                                ${isSharedCol && rowData.totalRows === 2 && rowData.isFirstRow ? 'align-middle' : ''}
                              `}
                              style={{
                                verticalAlign:
                                  isSharedCol && rowData.totalRows === 2
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
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      {apiMsg
                        ? 'No se encontraron solicitudes en el rango seleccionado.'
                        : 'Selecciona un rango de fechas y presiona Buscar.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-muted-foreground mr-auto">
              {table.getFilteredRowModel().rows.length > 0 &&
                `${table.getFilteredRowModel().rows.length} registro(s)`}
            </div>
            <div className="space-x-2">
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
      </CardContent>

      <HistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={historyData as Parameters<typeof HistoryDialog>[0]['history']}
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

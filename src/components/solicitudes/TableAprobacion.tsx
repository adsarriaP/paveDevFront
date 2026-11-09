'use client';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { RootState } from '@/store/store';
import {
  SolicitudResponse,
  SolicitudAprobacion,
  ApiResponseAprobaciones,
} from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ConfirmDialog } from '@/components/Componentes-Generales/ConfirmDialog';
import { HistoryDialog, Movimiento } from '../Componentes-Generales/historyDialog';
import { Card, CardContent } from '../ui/card';

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
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

export function TableAprobacion() {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    solicitud: SolicitudAprobacion | null;
    accion: 'aprobar' | 'rechazar' | null;
  }>({ open: false, solicitud: null, accion: null });
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<Movimiento[]>([]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [data, setData] = React.useState<SolicitudAprobacion[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { get, patch } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setData([]);
        return;
      }

      // Petición normal para solicitudes de subordinados
      const response = await get<ApiResponseAprobaciones>(
        `solicitudes/jefe/${user.id}`
      );

      let todasLasSolicitudes = response.data.solicitudes.map(sol => ({
        ...sol,
        esDelGG: false // Marcar como NO del GG
      }));

      // Si el usuario tiene rol JEFE_CB, hacer petición adicional
      if (user.rol === 'JEFE_CB') {
        try {
          const responseGG = await get<ApiResponseAprobaciones>(
            `solicitudes/jefe-cb/${user.id}`
          );

          // Marcar las solicitudes del GG y combinarlas
          const solicitudesGG = responseGG.data.solicitudes.map(sol => ({
            ...sol,
            esDelGG: true // Marcar como del GG
          }));

          todasLasSolicitudes = [...todasLasSolicitudes, ...solicitudesGG];
        } catch (errorGG) {
          console.error('Error fetching solicitudes del Gerente General:', errorGG);
          // No fallar si esta petición falla, solo mostrar las solicitudes normales
        }
      }

      setData(todasLasSolicitudes);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoricoClick = (solicitud: SolicitudAprobacion) => {
    let historico: Movimiento[] = [];
    try {
      historico = solicitud.historico ? JSON.parse(solicitud.historico) : [];
    } catch {
      historico = [];
    }
    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  const columns: ColumnDef<SolicitudAprobacion>[] = [
    {
      id: 'nombre',
      accessorFn: (row) => row.usuario.nombre,
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.usuario.nombre}</span>
          {row.original.esDelGG && (
            <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white dark:text-white">
              Gerente General
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'usuario',
      accessorFn: (row) => row.usuario.user,
      header: 'Usuario',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.usuario.user}</div>
      ),
    },
    {
      id: 'registro',
      accessorFn: (row) => row.usuario.registro,
      header: 'Registro',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.usuario.registro}</div>
      ),
    },
    {
      id: 'fecha_inicio',
      accessorFn: (row) => row.fecha_inicio_principal,
      header: 'Fecha Inicio',
      cell: ({ row }) => {
        const fechaPrincipal = row.original.fecha_inicio_principal;
        const fechaSecundaria = row.original.fecha_inicio_secundario;
        console.log('row.original:', row.original);
        const formatDate = (fecha?: string) => {
          if (!fecha) return null;
          const [year, month, day] = fecha.split('-');
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          ).toLocaleDateString();
        };
        return (
          <div className="text-sm">
            {formatDate(fechaPrincipal)}
            {fechaSecundaria && (
              <>
                <br />
                <span className="text-sm">{formatDate(fechaSecundaria)}</span>
              </>
            )}
          </div>
        );
      },
    },

    {
      id: 'fecha_fin',
      accessorFn: (row) => row.fecha_fin_principal,
      header: 'Fecha Fin',
      cell: ({ row }) => {
        const fechaPrincipal = row.original.fecha_fin_principal;
        const fechaSecundaria = row.original.fecha_fin_secundario;
        const formatDate = (fecha?: string) => {
          if (!fecha) return null;
          const [year, month, day] = fecha.split('-');
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          ).toLocaleDateString();
        };
        return (
          <div className="text-sm">
            {formatDate(fechaPrincipal)}
            {fechaSecundaria && (
              <>
                <br />
                <span className="text-sm">{formatDate(fechaSecundaria)}</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'dias',
      header: 'Días',
      cell: ({ row }) => {
        const diasPrincipal = row.original.dias_principal;
        const diasSecundario = row.original.dias_secundario;
        return (
          <div className="text-sm">
            {diasPrincipal !== undefined && <div>{diasPrincipal}</div>}
            {diasSecundario !== undefined && diasSecundario > 0 && (
              <div>{diasSecundario}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => getEstadoBadge(row.getValue('estado')),
    },
    {
      id: 'accion',
      header: 'Acción',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() =>
              setConfirmDialog({
                open: true,
                solicitud: row.original,
                accion: 'aprobar',
              })
            }
          >
            <Check className="w-4 h-4 mr-1" />
            Aprobar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() =>
              setConfirmDialog({
                open: true,
                solicitud: row.original,
                accion: 'rechazar',
              })
            }
          >
            <X className="w-4 h-4 mr-1" />
            Rechazar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleHistoricoClick(row.original)}
            className="h-8 px-2"
            title="Ver histórico"
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>
      ),
    },
  ];

  async function handleConfirm(inputValue: string) {
    if (confirmDialog.accion === 'aprobar' && confirmDialog.solicitud) {
      await handleAprobar({
        id: confirmDialog.solicitud.id,
        observaciones: 'Aprobado',
      });
    }
    if (confirmDialog.accion === 'rechazar' && confirmDialog.solicitud) {
      await handleRechazar({
        id: confirmDialog.solicitud.id,
        motivo: inputValue,
      });
    }
    setConfirmDialog({ open: false, solicitud: null, accion: null });
  }

  const handleAprobar = async ({
    id,
    observaciones,
  }: {
    id: number;
    observaciones: string;
  }): Promise<SolicitudResponse | null> => {
    try {
      const response = await patch<SolicitudResponse>(
        `solicitudes/${id}/aprobar`,
        { observaciones }
      );
      fetchSolicitudes();
      Notify.success('Solicitud aprobada exitosamente');

      return response;
    } catch (error) {
      console.error('Error approving solicitud:', error);
      return null;
    }
  };

  const handleRechazar = async ({
    id,
    motivo,
  }: {
    id: number;
    motivo: string;
  }): Promise<SolicitudResponse | null> => {
    try {
      const response = await patch<SolicitudResponse>(
        `solicitudes/${id}/rechazar`,
        { motivo }
      );
      fetchSolicitudes();
      Notify.success('Solicitud rechazada exitosamente');

      return response;
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
      return null;
    }
  };

  React.useEffect(() => {
    fetchSolicitudes();
  }, []);

  const table = useReactTable({
    data,
    columns,
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
            Solicitudes de vacaciones pendientes de aprobación
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
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Cargando solicitudes...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      No hay solicitudes pendientes.
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
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        accion={confirmDialog.accion ?? 'aprobar'}
        nombre={confirmDialog.solicitud?.usuario.nombre ?? ''}
        onConfirm={handleConfirm}
      />
      <HistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        history={historyData}
      />
    </Card>
  );
}

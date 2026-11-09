'use client';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { RootState } from '@/store/store';
import { SolicitudResponse } from '@/types/entities.types';
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

interface ApiResponse {
  ok: boolean;
  msg: string;
  data: {
    solicitudes: Solicitud[];
    resumen: {
      totalSolicitudes: number;
      pendientes: number;
    };
  };
}

export type Solicitud = {
  id: number;
  usuario_id: number;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    registro: number;
    planilla?: string | null;
    planilla_analista?: string | null;
  };
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  estado: number;
  historico?: string; // Added the 'historico' property
  fecha_inicio_secundario?: string; // Added the 'fecha_inicio_secundario' property
  fecha_disfrute_nueva?: string; // Added the 'fecha_disfrute_nueva' property
  dias_secundario?: number; // Added the 'dias_secundario' property
  dias_principal?: number; // Added the 'dias_principal' property
  fecha_disfrute_secundario_nueva?: string; // Added the 'fecha_disfrute_secundario_nueva' property
  fecha_retorno_nueva?: string; // Added the 'fecha_retorno_nueva' property
  fecha_retorno_secundario_nueva?: string; // Added the 'fecha_retorno_secundario_nueva' property
};

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
      return <Badge variant="status-activo">Aprobada Final</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

export function TablaAprobacionesAplazamiento() {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    solicitud: Solicitud | null;
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
  const [data, setData] = React.useState<Solicitud[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { get, post } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setData([]);
        return;
      }
      const response = await get<ApiResponse>(
        `solicitudes-aplazamiento/mis-solicitudes-nivel-jerarquico/${user.id}`
      );
      setData(response.data.solicitudes);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoricoClick = (solicitud: Solicitud) => {
    let historico: Movimiento[] = [];
    let errorMessage = '';

    try {
      console.log('=== DEBUG HISTÓRICO (Aprobaciones) ===');
      console.log('Estado de la solicitud:', solicitud.estado);
      console.log('Campo historico (raw):', solicitud.historico);
      console.log('Tipo de historico:', typeof solicitud.historico);

      if (solicitud.historico) {
        // Si historico ya es un array, usarlo directamente
        if (Array.isArray(solicitud.historico)) {
          historico = solicitud.historico;
          console.log('Histórico es array directo:', historico);
        } else if (typeof solicitud.historico === 'string') {
          // Intentar reparar JSON truncado antes de parsear
          let historicoStr = solicitud.historico.trim();

          // Si no termina con ], intentar reparar el JSON
          if (!historicoStr.endsWith(']')) {
            console.warn('⚠️ JSON TRUNCADO: Intentando reparar...');

            // Encontrar el último objeto completo
            const lastValidIndex = historicoStr.lastIndexOf('}');
            if (lastValidIndex !== -1) {
              // Cortar hasta el último objeto válido y cerrar el array
              historicoStr =
                historicoStr.substring(0, lastValidIndex + 1) + ']';
              console.log('JSON reparado:', historicoStr);
            }
          }

          // Parsear el JSON (reparado o no)
          historico = JSON.parse(historicoStr);
          console.log('Histórico parseado desde string:', historico);
        }
      }

      console.log('Histórico final a mostrar:', historico);
      console.log('Cantidad de movimientos:', historico.length);
    } catch (e) {
      console.error('Error al parsear histórico:', e);
      console.error(
        'Contenido del histórico que causó error:',
        solicitud.historico
      );

      // Verificar si el JSON está truncado
      if (
        typeof solicitud.historico === 'string' &&
        !solicitud.historico.trim().endsWith(']')
      ) {
        errorMessage =
          'El histórico está incompleto debido a limitaciones de almacenamiento. Se mostrarán los registros disponibles. Por favor, contacte al administrador para aumentar la capacidad del campo.';
        console.error('⚠️ JSON TRUNCADO: El campo historico está incompleto');
      } else {
        errorMessage =
          'Error al cargar el histórico. El formato de datos no es válido.';
      }

      historico = [];
    }

    // Si hay error, mostrar notificación
    if (errorMessage) {
      Notify.warning(errorMessage, {
        timeout: 5000,
        width: '400px',
      });
    }

    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  const columns: ColumnDef<Solicitud>[] = [
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
        <div className="font-medium">{row.original.usuario.nombre}</div>
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
      accessorKey: 'fecha_inicio_principal',
      header: 'Fecha Inicio',
      cell: ({ row }) => {
        const fechaPrincipal = row.original.fecha_disfrute_nueva;
        const fechaSecundaria = row.original.fecha_disfrute_secundario_nueva;
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
      accessorKey: 'fecha_fin_principal',
      header: 'Fecha Fin',
      cell: ({ row }) => {
        const fechaPrincipal = row.original.fecha_retorno_nueva;
        const fechaSecundaria = row.original.fecha_retorno_secundario_nueva;
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
      cell: ({ row }) => {
        const estado = row.getValue('estado') as number;
        return getEstadoBadge(estado);
      },
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
        motivoRechazo: inputValue,
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
      const response = await post<SolicitudResponse>(
        `solicitudes-aplazamiento/${id}/aprobar`,
        {
          observaciones,
          usuarioAprobadorId: user?.id,
        }
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
    motivoRechazo,
  }: {
    id: number;
    motivoRechazo: string;
  }): Promise<SolicitudResponse | null> => {
    try {
      const response = await post<SolicitudResponse>(
        `solicitudes-aplazamiento/${id}/rechazar`,
        {
          motivoRechazo,
          usuarioRechazadorId: user?.id,
        }
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
            Solicitudes de aplazamiento pendientes de aprobación
          </h2>
        </div>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrar por nombre..."
              value={
                (table.getColumn('nombre')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('nombre')?.setFilterValue(event.target.value)
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

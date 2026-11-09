import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { RootState } from '@/store/store';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
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
import { ArrowUpDown, Edit, History, Eye, FileText } from 'lucide-react';
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
import { EditarSolicitudForm } from './EditarSolicitudForm';
import type {
  SolicitudExpandida,
  ApiResponseSolicitudes,
} from '@/types/entities.types';
import CertificadoVacaciones from './CertificadoVacaciones';
import { HistoryDialog, Movimiento } from '../Componentes-Generales/historyDialog';

// Interfaz para los datos de vacaciones usados en el memorando
interface Vacacion {
  periodo: string;
  diasPendientes: number;
  diasPendientesSecundarios?: number;
  fechaDisfrute: string;
  fechaDisfruteSecundario?: string;
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
  historico?: string; // Added this property
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

// Agregar esta función helper al inicio del archivo, después de los imports
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

const getColumns = (
  onEditClick: (solicitud: SolicitudUsuario) => void,
  onHistoricoClick: (solicitud: SolicitudUsuario) => void
): ColumnDef<SolicitudExpandida>[] => [
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
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const data = row.original;
        // Solo mostrar botón en la primera fila (se extenderá visualmente)
        if (data.isFirstRow) {
          const estado = data.estado;
          const puedeEditar = estado === 1; // Pendiente
          const esAprobado = estado === 3; // Aprobado
          const solicitud = data.originalData;

          // Datos para el certificado de vacaciones
          const vacaciones = [
            {
              periodo: solicitud.periodos?.nombre || '',
              diasPendientes: solicitud.dias_principal || 0,
              diasPendientesSecundarios: solicitud.dias_secundario > 0 ? solicitud.dias_secundario : undefined,
              fechaDisfrute: solicitud.fecha_inicio_principal,
              fechaRetorno: solicitud.fecha_fin_principal,
              fechaDisfruteSecundario: solicitud.fecha_inicio_secundario || undefined,
              fechaRetornoSecundario: solicitud.fecha_fin_secundario || undefined,
            },
          ];

          return (
            <div className="flex gap-2">
              <div className="flex items-center h-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditClick(data.originalData)}
                  disabled={!puedeEditar}
                  className="h-8 px-2"
                >
                  <Edit className="h-4 w-4" />
                  {puedeEditar ? 'Editar' : 'No editable'}
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
                {esAprobado && (
                  <CertificadoVacaciones
                    nombre={solicitud.usuario.nombre} // e.g., "adrian jose iriarte"
                    registro={solicitud.usuario.registro.toString()} // e.g., "222000"
                    vacaciones={vacaciones}
                    renderAsButton
                  />
                )}
              </div>
            </div>
          );
        }
        return <div></div>; // Celda vacía para mantener estructura
      },
    },
  ];

export function TableSolicitudes() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [, setOriginalData] = React.useState<SolicitudUsuario[]>([]);
  const [data, setData] = React.useState<SolicitudExpandida[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Estados para manejar la edición
  const [isEditing, setIsEditing] = React.useState(false);
  const [solicitudToEdit, setSolicitudToEdit] =
    React.useState<SolicitudUsuario | null>(null);

  // Estados para el historial - movidos del cell function
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<Movimiento[]>([]);

  const { get } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);

  // Funciones para manejar la edición
  const handleEditClick = (solicitud: SolicitudUsuario) => {
    setSolicitudToEdit(solicitud);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSolicitudToEdit(null);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    setSolicitudToEdit(null);
    fetchSolicitudes(); // Recargar los datos
  };

  // Función para manejar el histórico - movida desde cell function
  const handleHistoricoClick = (solicitud: SolicitudUsuario) => {
    let historico: Movimiento[] = [];
    try {
      historico = solicitud.historico ? JSON.parse(solicitud.historico) : [];
    } catch {
      historico = [];
    }
    setHistoryData(historico);
    setHistoryDialogOpen(true);
  };

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setOriginalData([]);
        setData([]);
        return;
      }
      const response = await get<ApiResponseSolicitudes>(
        `/solicitudes/usuario/${user.id}`
      );
      setOriginalData(response.data);
      setData(expandSolicitudes(response.data));
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      setOriginalData([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Función para manejar la descarga del memorando general
  const handleDescargarMemorandoGeneral = () => {
    // Filtrar solicitudes en estado aprobado (3)
    const solicitudesAprobadas = data.filter(
      item => item.isFirstRow && item.estado === 3
    );

    if (solicitudesAprobadas.length === 0) {
      return;
    }

    // Obtener la información del usuario de la primera solicitud
    const primeraAprobada = solicitudesAprobadas[0];
    const nombreUsuario = primeraAprobada.originalData.usuario.nombre;
    const registroUsuario = primeraAprobada.originalData.usuario.registro.toString();

    // Preparar los datos para el memorando
    const vacacionesData = solicitudesAprobadas.map(solicitud => {
      // Extraer la solicitud original
      const original = solicitud.originalData;

      return {
        periodo: original.periodos?.nombre || '',
        diasPendientes: original.dias_principal || 0,
        diasPendientesSecundarios: original.dias_secundario || 0,
        fechaDisfrute: `${formatDate(original.fecha_inicio_principal)} - ${formatDate(original.fecha_fin_principal)}`,
        fechaDisfruteSecundario:
          original.fecha_inicio_secundario && original.fecha_fin_secundario
            ? `${formatDate(original.fecha_inicio_secundario)} - ${formatDate(original.fecha_fin_secundario)}`
            : 'N/A',
      };
    });

    // Importar directamente la función de generación de PDF
    // Usamos un enfoque alternativo llamando a una función adaptadora
    generarPDFMemorandoGeneral(nombreUsuario, registroUsuario, vacacionesData, false);
  };

  // Función adaptadora para generar PDF
  const generarPDFMemorandoGeneral = (nombre: string, registro: string, vacaciones: Vacacion[], esAplazamiento: boolean) => {
    // Crear una instancia de jsPDF directamente
    const doc = new jsPDF();

    // Añadir logo
    const logoUrl = '/images/company_logo.png';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = logoUrl;

    // Definir la función que genera el contenido
    const generateContent = () => {
      const pageWidth = doc.internal.pageSize.width;

      // Formatear la fecha actual
      const fechaActual = new Date();
      const dia = fechaActual.getDate().toString().padStart(2, '0');
      const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaActual);
      const anio = fechaActual.getFullYear();

      doc.setFontSize(12);
      doc.setFont('helvetica');

      // Encabezado con el logo - Título simple MEMORANDO
      const memorandoText = 'MEMORANDO';
      const memorandoWidth = doc.getTextWidth(memorandoText);
      doc.text(memorandoText, (pageWidth - memorandoWidth) / 2, 50);

      const consecutivoText = 'Consecutivo ';
      // Posición en la izquierda (30 es el margen izquierdo)
      doc.text(consecutivoText, 30, 60);

      const ciudadText = 'Santiago de Cali, ' + `${dia} de ${mes} de ${anio}`;
      // Posición en la izquierda (30 es el margen izquierdo)
      doc.text(ciudadText, 30, 65);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Sección PARA
      doc.text('PARA', 30, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(nombre.toUpperCase(), 70, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Registro laboral ${registro} - CAM PISO 8`, 70, 88);

      // Sección DE
      doc.text('DE', 30, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('UNIDAD GESTION, COMPENSACION Y BENEFICIOS', 70, 100);
      doc.setFont('helvetica', 'normal');

      // Sección ASUNTO
      doc.text('ASUNTO', 30, 110);
      doc.setFont('helvetica', 'normal');
      const asuntoText = 'Novedad Vacaciones';
      doc.text(asuntoText, 70, 110);
      doc.setFont('helvetica', 'normal');

      // Párrafo introductorio
      doc.text(`En atención a su solicitud con visto bueno de Gerente Area Abastecimiento Empresarial, mediante oficio 9000014742025, me permito dar respuesta al disfrute de sus vacaciones así:`,
        30, 120, { maxWidth: pageWidth - 60 }
      );

      // En lugar de tabla, formatear el texto para cada período de vacaciones
      let yPosition = 140;

      // Configurar estilo para los items
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);

      vacaciones.forEach((v) => {
        // Dividir la fecha de disfrute para obtener inicio y fin
        const [fechaInicio, fechaFin] = v.fechaDisfrute.split(' - ');

        // Formatear el texto principal para cada período
        const textoVacacion = `• ${v.diasPendientes} días hábiles de vacaciones del período ${v.periodo}, a disfrutar del ${fechaInicio} al ${fechaFin}.`;

        doc.text(
          textoVacacion,
          30,
          yPosition,
          { maxWidth: pageWidth - 60 }
        );

        yPosition += 15; // Espacio entre items

        // Añadir el segundo período si existe
        if (
          v.diasPendientesSecundarios &&
          v.diasPendientesSecundarios > 0 &&
          v.fechaDisfruteSecundario &&
          v.fechaDisfruteSecundario !== 'N/A'
        ) {
          const [fechaInicioSec, fechaFinSec] = v.fechaDisfruteSecundario.split(' - ');

          const textoVacacionSecundario = `• ${v.diasPendientesSecundarios} días hábiles de vacaciones del período ${v.periodo}, a disfrutar del ${fechaInicioSec} al ${fechaFinSec}.`;

          doc.text(
            textoVacacionSecundario,
            30,
            yPosition,
            { maxWidth: pageWidth - 60 }
          );

          yPosition += 15;
        }
      });

      // Guardar la posición final para usar en elementos posteriores
      const finalY = yPosition + 10;

      // Agregar texto explicativo adicional
      const textoAdicional = "Cordialmente,";

      doc.text(
        textoAdicional,
        30,
        finalY,
        { maxWidth: pageWidth - 60 }
      );





      // Nombre del firmante
      doc.setFont('helvetica', 'normal');
      doc.text(
        'LINA MARIA ALVAREZ SIERRA',
        30,
        finalY + 50
      );



      // Agregar sección de elaboración
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Jefe Unidad',
        30,
        finalY + 55
      );


      // Fecha de generación en la parte inferior

      doc.setFontSize(8);
      doc.text(
        `Copia: Historia laboral, Analista Jorge Caicedo`,
        30,
        finalY + 60
      );

      // doc.setFontSize(8);
      // doc.text(
      //   `Copia: Historia laboral, Analista Jorge Caicedo`,
      //   30,
      //   pageHeight - 20
      // );


      // Guardar el PDF con un nombre adecuado
      const nombreArchivo = esAplazamiento
        ? 'certificado_aplazamiento_vacaciones.pdf'
        : 'memorando_general_vacaciones.pdf';
      doc.save(nombreArchivo);
    };

    // Si la imagen carga correctamente
    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);
      generateContent();
    };

    // Si hay error al cargar la imagen
    img.onerror = () => {
      generateContent();
    };
  };

  const table = useReactTable({
    data,
    columns: getColumns(handleEditClick, handleHistoricoClick),
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

  // Si estamos editando, mostrar el formulario
  if (isEditing && solicitudToEdit) {
    return (
      <Card>
        <EditarSolicitudForm
          solicitud={solicitudToEdit}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </Card>
    );
  }

  // Mostrar la tabla normalmente
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Mis solicitudes
          </h2>
          {data.some(item => item.estado === 3) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDescargarMemorandoGeneral()}
              className="h-8 px-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
              title="Descargar memorando general de solicitudes aprobadas"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              Memorando General
            </Button>
          )}
        </div>
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filtrar por fecha..."
              value={
                (table
                  .getColumn('fecha_solicitud')
                  ?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table
                  .getColumn('fecha_solicitud')
                  ?.setFilterValue(event.target.value)
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
                    <TableCell colSpan={7} className="h-24 text-center">
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
                          const isFechaCol = columnId === 'fecha_solicitud';
                          const isPeriodoCausacionCol =
                            columnId === 'periodo_causacion';

                          // Para solicitudes divididas, algunas celdas no se renderizan en la segunda fila
                          if (
                            data.totalRows === 2 &&
                            data.isLastRow &&
                            (isStatOrAction ||
                              isFechaCol ||
                              isPeriodoCausacionCol)
                          ) {
                            return null; // No renderizar estas celdas en la segunda fila
                          }

                          return (
                            <TableCell
                              key={cell.id}
                              rowSpan={
                                data.totalRows === 2 &&
                                  data.isFirstRow &&
                                  (isStatOrAction ||
                                    isFechaCol ||
                                    isPeriodoCausacionCol)
                                  ? 2
                                  : 1
                              }
                              className={`
                                ${data.totalRows === 2 && data.isLastRow && !isStatOrAction && !isFechaCol && !isPeriodoCausacionCol ? 'border-t-0' : ''}
                                ${(isStatOrAction || isFechaCol || isPeriodoCausacionCol) && data.totalRows === 2 && data.isFirstRow ? 'align-middle' : ''}
                              `}
                              style={{
                                verticalAlign:
                                  (isStatOrAction ||
                                    isFechaCol ||
                                    isPeriodoCausacionCol) &&
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
                    <TableCell colSpan={7} className="h-24 text-center">
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

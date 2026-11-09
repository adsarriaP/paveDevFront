import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
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
import { ArrowUpDown, Eye, History, Edit, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
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
  SolicitudAplazamiento,
  SolicitudAplazamientoExpandida,
  ApiResponseSolicitudesAplazamiento,
} from '@/types';
import { EditarSolicitudAplazamiento } from './EditarSolicitudAplazamiento';
import CertificadoVacaciones from '../solicitudes/CertificadoVacaciones';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

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
  solicitudes: SolicitudAplazamiento[]
): SolicitudAplazamientoExpandida[] => {
  const expandidas: SolicitudAplazamientoExpandida[] = [];

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
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
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
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
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
        vacacion_id: solicitud.vacacion_id,
        estado: solicitud.estado,
        fecha_solicitud: solicitud.fecha_solicitud,
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

// Interfaz para los datos de aplazamiento en el PDF
interface AplazamientoData {
  periodo: string;
  diasPrincipal: number;
  diasSecundario?: number;
  fechaOriginalInicio: string;
  fechaOriginalFin: string;
  fechaNuevaInicio: string;
  fechaNuevaFin: string;
  fechaOriginalSecundarioInicio?: string;
  fechaOriginalSecundarioFin?: string;
  fechaNuevaSecundarioInicio?: string;
  fechaNuevaSecundarioFin?: string;
}

// Función para generar el PDF de Memorando General de Aplazamientos
const generarPDFMemorandoGeneralAplazamiento = (
  nombre: string,
  registro: string,
  aplazamientos: AplazamientoData[]
) => {
  const doc = new jsPDF();

  // Añadir logo
  const logoUrl = '/images/company_logo.png';
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = logoUrl;

  const generateContent = () => {
    const pageWidth = doc.internal.pageSize.width;

    // Formatear la fecha actual
    const fechaActual = new Date();
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaActual);
    const anio = fechaActual.getFullYear();

    doc.setFontSize(12);
    doc.setFont('helvetica');

    // Encabezado - Título MEMORANDO
    const memorandoText = 'MEMORANDO';
    const memorandoWidth = doc.getTextWidth(memorandoText);
    doc.text(memorandoText, (pageWidth - memorandoWidth) / 2, 50);

    const consecutivoText = 'Consecutivo ';
    doc.text(consecutivoText, 30, 60);

    const ciudadText = 'Santiago de Cali, ' + `${dia} de ${mes} de ${anio}`;
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
    const asuntoText = 'Aplazamiento de Vacaciones';
    doc.text(asuntoText, 70, 110);
    doc.setFont('helvetica', 'normal');

    // Párrafo introductorio
    doc.text(
      `En atención a su solicitud de aplazamiento, se confirma la aprobación del cambio en las fechas de disfrute de sus vacaciones. Estas son las fechas de su aplazamiento:`,
      30,
      120,
      { maxWidth: pageWidth - 60 }
    );

    let yPosition = 140;

    // Configurar estilo para los items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    aplazamientos.forEach((apl, index) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      // Título del período
      doc.setFont('helvetica', 'bold');
      doc.text(`Período ${apl.periodo}:`, 30, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');

      // Período principal (fechas originales deshabilitadas)
      // const textoOriginal = `  • Fechas originales: ${apl.fechaOriginalInicio} al ${apl.fechaOriginalFin} (${apl.diasPrincipal} días)`;
      // doc.text(textoOriginal, 30, yPosition, { maxWidth: pageWidth - 60 });
      // yPosition += 7;

      const textoNuevo = `  • Fechas de su aplazamiento: ${apl.fechaNuevaInicio} al ${apl.fechaNuevaFin} (${apl.diasPrincipal} días)`;
      doc.text(textoNuevo, 30, yPosition, { maxWidth: pageWidth - 60 });
      yPosition += 10;

      // Período secundario si existe (garantizando validar solo las nuevas fechas secundarias)
      if (
        apl.diasSecundario &&
        apl.diasSecundario > 0 &&
        apl.fechaNuevaSecundarioInicio &&
        apl.fechaNuevaSecundarioFin
      ) {
        // const textoOriginalSec = `  • Fechas originales (2do período): ${apl.fechaOriginalSecundarioInicio} al ${apl.fechaOriginalSecundarioFin} (${apl.diasSecundario} días)`;
        // doc.text(textoOriginalSec, 30, yPosition, { maxWidth: pageWidth - 60 });
        // yPosition += 7;

        const textoNuevoSec = `  • Fechas de su aplazamiento (2do período): ${apl.fechaNuevaSecundarioInicio} al ${apl.fechaNuevaSecundarioFin} (${apl.diasSecundario} días)`;
        doc.text(textoNuevoSec, 30, yPosition, { maxWidth: pageWidth - 60 });
        yPosition += 10;
      }

      // Espacio entre períodos
      if (index < aplazamientos.length - 1) {
        yPosition += 5;
      }
    });

    // Guardar la posición final
    const finalY = yPosition + 10;

    // Verificar si necesitamos nueva página para la firma
    if (finalY > 240) {
      doc.addPage();
      const textoAdicional = 'Cordialmente,';
      doc.text(textoAdicional, 30, 30, { maxWidth: pageWidth - 60 });

      doc.setFont('helvetica', 'normal');
      doc.text('LINA MARIA ALVAREZ SIERRA', 30, 80);
      doc.text('Jefe Unidad', 30, 85);

      doc.setFontSize(8);
      doc.text('Copia: Historia laboral, Analista Jorge Caicedo', 30, 90);
    } else {
      const textoAdicional = 'Cordialmente,';
      doc.text(textoAdicional, 30, finalY, { maxWidth: pageWidth - 60 });

      doc.setFont('helvetica', 'normal');
      doc.text('LINA MARIA ALVAREZ SIERRA', 30, finalY + 50);
      doc.text('Jefe Unidad', 30, finalY + 55);

      doc.setFontSize(8);
      doc.text('Copia: Historia laboral, Analista Jorge Caicedo', 30, finalY + 60);
    }

    // Guardar el PDF
    doc.save('memorando_general_aplazamientos.pdf');
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

// Componente para el diálogo de información adicional
interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  solicitud: SolicitudAplazamiento;
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
  onInfoClick: (solicitud: SolicitudAplazamiento) => void,
  onHistoricoClick: (solicitud: SolicitudAplazamiento) => void,
  onEditClick: (solicitud: SolicitudAplazamiento) => void
): ColumnDef<SolicitudAplazamientoExpandida>[] => [
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
    accessorKey: 'fecha_inicio_nueva',
    header: 'Fecha Inicio Nueva',
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
    header: 'Fecha Fin Nueva',
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
      // Solo mostrar estado en la primera fila (se extenderá visualmente)
      if (data.isFirstRow) {
        const tipoAplaz = data.originalData?.tipo_aplazamiento;
        const esParcial = tipoAplaz && tipoAplaz !== 'completo';
        return (
          <div className="flex flex-col items-start gap-1 h-full">
            {getEstadoBadge(row.getValue('estado'))}
            {esParcial && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
                {tipoAplaz === 'solo_principal' ? 'Solo principal' : 'Solo secundario'}
              </span>
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
      // Solo mostrar botones en la primera fila (se extenderá visualmente)
      if (data.isFirstRow) {
        const solicitud = data.originalData;
        const estado = data.estado;
        const puedeEditar = estado === 1; // Solo pendiente

         const esAprobado = solicitud.estado === 6; // Estado 2 = Aprobado

          // Preparar datos de vacaciones para el certificado
          const vacaciones = [
            {
              periodo: solicitud.periodos.nombre,
              diasPendientes: solicitud.dias_principal,
              diasPendientesSecundarios: solicitud.dias_secundario > 0 ? solicitud.dias_secundario : undefined,
              fechaDisfrute: solicitud.fecha_disfrute_nueva,
              fechaRetorno: solicitud.fecha_retorno_nueva,
              fechaDisfruteSecundario: solicitud.fecha_disfrute_secundario_nueva || undefined,
              fechaRetornoSecundario: solicitud.fecha_retorno_secundario_nueva || undefined,
            }
          ];

        return (
          <div className="flex gap-2">
            <div className="flex items-center h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditClick(solicitud)}
                disabled={!puedeEditar}
                className="h-8 px-2"
                title={puedeEditar ? 'Editar' : 'No editable'}
              >
                <Edit className="h-4 w-4" />
                {puedeEditar ? 'Editar' : 'No editable'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInfoClick(solicitud)}
                className="h-8 px-2"
                title="Más información"
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
              {esAprobado && (
                  <CertificadoVacaciones
                    nombre={solicitud.usuario.nombre}
                    registro={solicitud.usuario.registro.toString()}
                    vacaciones={vacaciones}
                    renderAsButton
                    esAplazamiento={true}
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

export function TableSolicitudesAplazamiento() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [, setOriginalData] = React.useState<SolicitudAplazamiento[]>([]);
  const [data, setData] = React.useState<SolicitudAplazamientoExpandida[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Estados para el diálogo de información
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);
  const [selectedSolicitud, setSelectedSolicitud] =
    React.useState<SolicitudAplazamiento | null>(null);

  // Estados para el historial
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [historyData, setHistoryData] = React.useState<Movimiento[]>([]);

  // Estados para manejar la edición
  const [isEditing, setIsEditing] = React.useState(false);
  const [solicitudToEdit, setSolicitudToEdit] =
    React.useState<SolicitudAplazamiento | null>(null);

  const { get } = useApi();
  const user = useSelector((state: RootState) => state.auth.user);

  // Función para manejar el clic en "Más información"
  const handleInfoClick = (solicitud: SolicitudAplazamiento) => {
    setSelectedSolicitud(solicitud);
    setInfoDialogOpen(true);
  };

  // Función para manejar el histórico
  const handleHistoricoClick = (solicitud: SolicitudAplazamiento) => {
    let historico: Movimiento[] = [];
    let errorMessage = '';

    try {
      console.log('=== DEBUG HISTÓRICO ===');
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
              historicoStr = historicoStr.substring(0, lastValidIndex + 1) + ']';
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
      console.error('Contenido del histórico que causó error:', solicitud.historico);

      // Verificar si el JSON está truncado
      if (typeof solicitud.historico === 'string' &&
          !solicitud.historico.trim().endsWith(']')) {
        errorMessage = 'El histórico está incompleto debido a limitaciones de almacenamiento. Se mostrarán los registros disponibles. Por favor, contacte al administrador para aumentar la capacidad del campo.';
        console.error('⚠️ JSON TRUNCADO: El campo historico está incompleto');
      } else {
        errorMessage = 'Error al cargar el histórico. El formato de datos no es válido.';
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

  // Funciones para manejar la edición
  const handleEditClick = (solicitud: SolicitudAplazamiento) => {
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

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        console.error('No hay usuario logueado');
        setOriginalData([]);
        setData([]);
        return;
      }
      const response = await get<ApiResponseSolicitudesAplazamiento>(
        `/solicitudes-aplazamiento/usuario/${user.id}`
      );
      setOriginalData(response.data);
      setData(expandSolicitudes(response.data));
    } catch (error) {
      console.error('Error fetching solicitudes de aplazamiento:', error);
      setOriginalData([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Función para manejar la descarga del memorando general de aplazamientos
  const handleDescargarMemorandoGeneralAplazamiento = () => {
    // Filtrar solicitudes en estado aprobado final (6)
    const solicitudesAprobadas = data.filter(
      (item) => item.isFirstRow && item.estado === 6
    );

    if (solicitudesAprobadas.length === 0) {
      return;
    }

    // Obtener la información del usuario de la primera solicitud
    const primeraAprobada = solicitudesAprobadas[0];
    const nombreUsuario = primeraAprobada.originalData.usuario.nombre;
    const registroUsuario =
      primeraAprobada.originalData.usuario.registro.toString();

    // Preparar los datos para el memorando
    const aplazamientosData: AplazamientoData[] = solicitudesAprobadas.map(
      (solicitud) => {
        const original = solicitud.originalData;

        return {
          periodo: original.periodos.nombre,
          diasPrincipal: original.dias_principal,
          diasSecundario:
            original.dias_secundario > 0 ? original.dias_secundario : undefined,
          fechaOriginalInicio: formatDate(original.fecha_disfrute_actual),
          fechaOriginalFin: formatDate(original.fecha_retorno_actual),
          fechaNuevaInicio: formatDate(original.fecha_disfrute_nueva),
          fechaNuevaFin: formatDate(original.fecha_retorno_nueva),
          fechaOriginalSecundarioInicio: original.fecha_disfrute_secundario_actual
            ? formatDate(original.fecha_disfrute_secundario_actual)
            : undefined,
          fechaOriginalSecundarioFin: original.fecha_retorno_secundario_actual
            ? formatDate(original.fecha_retorno_secundario_actual)
            : undefined,
          fechaNuevaSecundarioInicio: original.fecha_disfrute_secundario_nueva
            ? formatDate(original.fecha_disfrute_secundario_nueva)
            : undefined,
          fechaNuevaSecundarioFin: original.fecha_retorno_secundario_nueva
            ? formatDate(original.fecha_retorno_secundario_nueva)
            : undefined,
        };
      }
    );

    // Generar el PDF
    generarPDFMemorandoGeneralAplazamiento(
      nombreUsuario,
      registroUsuario,
      aplazamientosData
    );
  };

  const table = useReactTable({
    data,
    columns: getColumns(handleInfoClick, handleHistoricoClick, handleEditClick),
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
        <EditarSolicitudAplazamiento
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
            Mis solicitudes de aplazamiento
          </h2>
          {data.some((item) => item.estado === 6) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDescargarMemorandoGeneralAplazamiento()}
              className="h-8 px-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
              title="Descargar memorando general de aplazamientos aprobados"
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
                    <TableCell colSpan={8} className="h-24 text-center">
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
                    <TableCell colSpan={8} className="h-24 text-center">
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

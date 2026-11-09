import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SolicitudAdminUsuario } from '@/components/solicitudes/TableAdminSolicitudes';
import type { ApiResponseSolicitudes } from '@/types/entities.types';

interface ReporteInfotipoButtonProps {
  className?: string;
}

// Definir el tipo del estado de Redux
interface RootState {
  auth: {
    user: {
      id: string | number;
      rol: string;
      planilla?: string | null;
    } | null;
  };
}

export function ReporteInfotipoButton({ className }: ReporteInfotipoButtonProps) {
  const [originalData, setOriginalData] = React.useState<SolicitudAdminUsuario[]>([]);
  const [isGeneratingInfotipo, setIsGeneratingInfotipo] = React.useState(false);

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

  // Función para obtener las solicitudes del período activo (misma lógica que en la tabla)
  const fetchAllSolicitudes = React.useCallback(async () => {
    try {
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
        setOriginalData([]);
        return;
      }

      // Luego obtenemos las solicitudes del período activo
      const response = await get<ApiResponseSolicitudes>(`/solicitudes/periodo/${periodoActivo.id}`);
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
          (s) => ((v) => v != null && planillasGestionadas.includes(v))((s.usuario as { planilla_analista?: string }).planilla_analista)
        );
        console.log('[ReporteInfotipo] Filtrado ANALISTA - Planillas gestionadas:', planillasGestionadas);
        console.log('[ReporteInfotipo] Solicitudes totales:', solicitudes.length);
        console.log('[ReporteInfotipo] Solicitudes filtradas:', solicitudesFiltradas.length);
      } else {
        // Usuario regular: solo ve sus propias solicitudes
        solicitudesFiltradas = solicitudes.filter(
          (s) => s.usuario_id === Number(currentUser?.id)
        );
      }

      setOriginalData(solicitudesFiltradas);
    } catch (error) {
      console.error('Error fetching solicitudes for active period:', error);
      setOriginalData([]);
    }
  }, [get, isAdmin, isAnalista, planillasGestionadas, currentUser?.id]);

  // Función para descargar el reporte de "Infotipo" (CSV simple compatible con Excel)
  // EXACTAMENTE la misma lógica que en TableAdminSolicitudes
  const handleDownloadInfotipo = React.useCallback(() => {
    try {
      setIsGeneratingInfotipo(true);

      // Filtrar solicitudes aprobadas (estado === 3)
      const aprobadas = originalData.filter((s) => s.estado === 3);

      if (aprobadas.length === 0) {
        alert('No hay solicitudes aprobadas para exportar.');
        return;
      }

      // Construir filas: una por período principal y otra por secundario (si existe)
      // Nuevos encabezados solicitados:
      //   registro        -> "No personal"
      //   fecha_inicio    -> "De"
      //   fecha_fin       -> "A"
      //   codigo (9001)   -> "Clase presencia"
      const CLASE_PRESENCIA_CONSTANTE = 9001;
      const rows: string[] = [];
      rows.push('No personal,De,A,Clase presencia');

      // Helper para formatear fechas a dd.mm.yyyy y evitar que Excel las convierta a otro formato
      const formatCsvDate = (iso: string) => {
        if (!iso) return '';
        // Esperado formato ISO corto YYYY-MM-DD
        const parts = iso.split('-');
        if (parts.length < 3) {
          // Si viniera con otro formato, devolver como texto literal protegido
          return `="${iso}"`;
        }
        const [year, month, day] = parts;
        const dd = day.padStart(2, '0');
        const mm = month.padStart(2, '0');
        // Usamos ="..." para que Excel lo trate como texto y respete los puntos
        return `="${dd}.${mm}.${year}"`;
      };

      aprobadas.forEach((sol) => {
        // Período principal
        rows.push([
          sol.usuario.registro,
          formatCsvDate(sol.fecha_inicio_principal),
          formatCsvDate(sol.fecha_fin_principal),
          CLASE_PRESENCIA_CONSTANTE,
        ].join(','));

        // Período secundario (si existe completo)
        if (sol.fecha_inicio_secundario && sol.fecha_fin_secundario) {
          rows.push([
            sol.usuario.registro,
            formatCsvDate(sol.fecha_inicio_secundario),
            formatCsvDate(sol.fecha_fin_secundario),
            CLASE_PRESENCIA_CONSTANTE,
          ].join(','));
        }
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `infotipo-solicitudes-aprobadas-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error generando archivo Infotipo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al generar el archivo Infotipo: ${errorMessage}`);
    } finally {
      setIsGeneratingInfotipo(false);
    }
  }, [originalData]);

  // Cargar datos al montar el componente
  React.useEffect(() => {
    fetchAllSolicitudes();
  }, [fetchAllSolicitudes]);

  return (
    <Button
      variant="secondary"
      onClick={handleDownloadInfotipo}
      disabled={isGeneratingInfotipo || originalData.filter(s => s.estado === 3).length === 0}
      className={`flex items-center gap-2 ${className}`}
      title="Exportar registro, fechas y código 9001 de solicitudes aprobadas"
    >
      <Download className="h-4 w-4" />
      {isGeneratingInfotipo ? 'Generando...' : 'Infotipo'}
    </Button>
  );
}
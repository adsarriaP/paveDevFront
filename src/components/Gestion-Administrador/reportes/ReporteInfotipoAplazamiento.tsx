import * as React from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '@/hooks/useApi';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SolicitudAplazamientoAdmin } from '@/types/entities.types';
import type { ApiResponseSolicitudesAplazamientoAdmin } from '@/types/entities.types';

interface ReporteInfotipoAplazamientoProps {
  className?: string;
  periodoId?: string;
}

// Definir el tipo del estado de Redux
interface RootState {
  auth: {
    user: {
      id: string | number;
      nombre: string;
      user: string;
      rol: string;
      esJefe?: number;
      planilla?: string | null;
      planilla_analista?: string | null;
    } | null;
  };
}

export function ReporteInfotipoAplazamiento({
  className,
  periodoId,
}: ReporteInfotipoAplazamientoProps) {
  const [originalData, setOriginalData] = React.useState<
    SolicitudAplazamientoAdmin[]
  >([]);
  const [isGeneratingInfotipo, setIsGeneratingInfotipo] = React.useState(false);

  const { get } = useApi();

  // Obtener información del usuario logueado desde Redux
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Determinar el rol del usuario
  const userRole = currentUser?.rol || '';
  const isAdmin = userRole === 'ADMINISTRADOR';
  const isAnalista = userRole === 'ANALISTA';

  // Convertir planilla a array para soportar múltiples planillas
  const planillasGestionadas = React.useMemo(() => {
    const planilla = currentUser?.planilla;
    if (!planilla) return [];
    return Array.isArray(planilla) ? planilla : [planilla];
  }, [currentUser?.planilla]);

  // Función para obtener las solicitudes de aplazamiento del período seleccionado o activo
  const fetchAllSolicitudesAplazamiento = React.useCallback(async () => {
    try {
      let periodoIdToUse = periodoId;

      // Si no se proporciona periodoId, obtener el período activo
      if (!periodoIdToUse) {
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

        periodoIdToUse = periodoActivo.id.toString();
      }

      // Obtener las solicitudes de aplazamiento del período
      const response = await get<ApiResponseSolicitudesAplazamientoAdmin>(
        `/solicitudes-aplazamiento?periodoId=${periodoIdToUse}`
      );

      // Manejar diferentes formatos de respuesta
      let solicitudes: SolicitudAplazamientoAdmin[] = [];

      if (Array.isArray(response)) {
        solicitudes = response;
      } else if (response && typeof response === 'object' && response.data) {
        solicitudes = Array.isArray(response.data) ? response.data : [];
      }

      // Filtrar según el rol del usuario
      let solicitudesFiltradas = solicitudes;

      if (isAdmin) {
        // Administrador: ve todas las solicitudes
        solicitudesFiltradas = solicitudes;
      } else if (isAnalista && planillasGestionadas.length > 0) {
        // Analista: solo ve solicitudes de usuarios cuyo planilla_analista coincide con alguna de las planillas que gestiona
        // LÓGICA: usuario.planilla_analista está incluido en analista.planilla (array)
        solicitudesFiltradas = solicitudes.filter(
          (s) => s.usuario.planilla_analista && planillasGestionadas.includes(s.usuario.planilla_analista)
        );
      } else {
        // Usuario regular: solo ve sus propias solicitudes
        solicitudesFiltradas = solicitudes.filter(
          (s) => s.usuario_id === Number(currentUser?.id)
        );
      }

      setOriginalData(solicitudesFiltradas);
    } catch (error) {
      console.error('Error fetching solicitudes de aplazamiento:', error);
      setOriginalData([]);
    }
  }, [get, isAdmin, isAnalista, planillasGestionadas, currentUser?.id, periodoId]);

  // Función para descargar el reporte de "Infotipo" para aplazamientos
  const handleDownloadInfotipo = React.useCallback(() => {
    try {
      setIsGeneratingInfotipo(true);

      // Filtrar solicitudes con estado === 6 (listas para infotipo)
      const aprobadas = originalData.filter((s) => s.estado === 6);

      if (aprobadas.length === 0) {
        alert('No hay solicitudes de aplazamiento aprobadas para exportar.');
        return;
      }

      // Construir filas: una por período principal y otra por secundario (si existe)
      // Encabezados:
      //   No personal (registro)
      //   De (fecha_disfrute_nueva)
      //   A (fecha_retorno_nueva)
      //   Clase presencia (9001)
      const CLASE_PRESENCIA_CONSTANTE = 9001;
      const rows: string[] = [];
      rows.push('No personal,De,A,Clase presencia');

      // Helper para formatear fechas a dd.mm.yyyy y evitar que Excel las convierta
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
        rows.push(
          [
            sol.usuario.registro,
            formatCsvDate(sol.fecha_disfrute_nueva),
            formatCsvDate(sol.fecha_retorno_nueva),
            CLASE_PRESENCIA_CONSTANTE,
          ].join(',')
        );

        // Período secundario (si existe completo)
        if (
          sol.fecha_disfrute_secundario_nueva &&
          sol.fecha_retorno_secundario_nueva
        ) {
          rows.push(
            [
              sol.usuario.registro,
              formatCsvDate(sol.fecha_disfrute_secundario_nueva),
              formatCsvDate(sol.fecha_retorno_secundario_nueva),
              CLASE_PRESENCIA_CONSTANTE,
            ].join(',')
          );
        }
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `infotipo-aplazamientos-aprobados-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(
        'Error generando archivo Infotipo de aplazamientos:',
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert(
        `Error al generar el archivo Infotipo de aplazamientos: ${errorMessage}`
      );
    } finally {
      setIsGeneratingInfotipo(false);
    }
  }, [originalData]);

  // Cargar datos al montar el componente
  React.useEffect(() => {
    fetchAllSolicitudesAplazamiento();
  }, [fetchAllSolicitudesAplazamiento]);

  // Texto del botón según el rol
  const buttonText = React.useMemo(() => {
    if (isAdmin) {
      return 'Infotipo Aplazamiento';
    } else if (isAnalista) {
      return 'Infotipo Aplazamiento';
    } else {
      return 'Infotipo Aplazamiento';
    }
  }, [isAdmin, isAnalista]);

  // Título del botón según el rol
  const buttonTitle = React.useMemo(() => {
    if (isAdmin) {
      return 'Exportar todas las solicitudes de aplazamiento aprobadas (Administrador)';
    } else if (isAnalista) {
      return 'Exportar todas las solicitudes de aplazamiento aprobadas (Analista)';
    } else {
      return 'Exportar tus solicitudes de aplazamiento aprobadas';
    }
  }, [isAdmin, isAnalista]);

  return (
    <Button
      variant="default"
      onClick={handleDownloadInfotipo}
      disabled={
        isGeneratingInfotipo ||
        originalData.filter((s) => s.estado === 6).length === 0
      }
      className={`flex items-center cursor-pointer gap-2 ${className}`}
      title={buttonTitle}
    >
      <Download className="h-4 w-4" />
      {isGeneratingInfotipo ? 'Generando...' : buttonText}
    </Button>
  );
}

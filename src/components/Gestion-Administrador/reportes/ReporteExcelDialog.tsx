import * as React from 'react';
import { useApi } from '@/hooks/useApi';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import type { Periodo } from '@/types/entities.types';

interface ReporteExcelDialogProps {
  className?: string;
}

export function ReporteExcelDialog({ className }: ReporteExcelDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [periodos, setPeriodos] = React.useState<Periodo[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = React.useState<string>('');
  const [isLoadingPeriodos, setIsLoadingPeriodos] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const { get } = useApi();

  // Cargar períodos cuando se abre el dialog
  const fetchPeriodos = React.useCallback(async () => {
    try {
      setIsLoadingPeriodos(true);
      const response = await get<Periodo[]>('/periodos');
      setPeriodos(response || []);
    } catch (error) {
      console.error('Error fetching períodos:', error);
      setPeriodos([]);
    } finally {
      setIsLoadingPeriodos(false);
    }
  }, [get]);

  React.useEffect(() => {
    if (open) {
      fetchPeriodos();
    }
  }, [open, fetchPeriodos]);

  // Función para descargar el reporte de Excel
  const handleDownloadExcel = React.useCallback(async () => {
    if (!selectedPeriodoId) {
      alert('Por favor selecciona un período');
      return;
    }

    console.log('Iniciando descarga de Excel para período:', selectedPeriodoId);
    try {
      setIsDownloading(true);

      // Usar exactamente la misma configuración que useApi
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const url = `${baseUrl}/reportes/vacaciones/excel/periodo/${selectedPeriodoId}`;

      console.log('URL de descarga:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(
        'Respuesta del servidor:',
        response.status,
        response.statusText
      );
      console.log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Obtener el blob (archivo binario)
      const blob = await response.blob();
      console.log('Blob recibido:', blob.size, 'bytes, tipo:', blob.type);

      // Crear y descargar el archivo
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Buscar el nombre del período seleccionado para incluirlo en el nombre del archivo
      const periodoSeleccionado = periodos.find(
        (p) => p.id.toString() === selectedPeriodoId
      );
      const nombrePeriodo = periodoSeleccionado
        ? `-${periodoSeleccionado.nombre}`
        : '';

      link.download = `reporte-vacaciones${nombrePeriodo}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Limpieza de memoria
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      console.log('Descarga completada exitosamente');

      // Cerrar el dialog después de la descarga exitosa
      setOpen(false);
      setSelectedPeriodoId('');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al descargar el reporte: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedPeriodoId, periodos]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={className}
          title="Descargar reporte completo en Excel por período"
        >
          <Download className="h-4 w-4 mr-2" />
          Reporte Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Descargar Reporte Excel</DialogTitle>
          <DialogDescription>
            Selecciona el período del cual deseas generar el reporte de
            vacaciones en Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="periodo-select" className="text-sm font-medium">
              Período
            </label>
            <Select
              value={selectedPeriodoId}
              onValueChange={setSelectedPeriodoId}
              disabled={isLoadingPeriodos}
            >
              <SelectTrigger id="periodo-select">
                <SelectValue
                  placeholder={
                    isLoadingPeriodos
                      ? 'Cargando períodos...'
                      : 'Selecciona un período'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {periodo.nombre}
                    {periodo.activo && ' (Activo)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedPeriodoId('');
            }}
            disabled={isDownloading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDownloadExcel}
            disabled={isDownloading || !selectedPeriodoId || isLoadingPeriodos}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

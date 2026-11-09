import * as React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { TablaHistoricoPlaneacion } from '@/components/solicitudes/TablaHistoricoPlaneacion';
import { Card, CardContent } from '@/components/ui/card';
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
import { CalendarDays, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function DashboardHistorico() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.rol === 'ADMINISTRADOR';

  const [open, setOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = React.useCallback(async () => {
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(`${baseUrl}/reportes/vacaciones/excel/jefe/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      a.download = fileNameMatch
        ? fileNameMatch[1].replace(/['"]/g, '')
        : `reporte_vacaciones_dependencia_${new Date().toISOString().split('T')[0]}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error('Error al descargar el reporte:', error);
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al descargar el reporte: ${msg}`);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera con título */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Historico de Solicitudes de Planeacion
            </h1>
            <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
              <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
              {formattedDate}
            </p>
          </div>

          {!isAdmin && <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Descargar reporte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Descargar reporte de vacaciones</DialogTitle>
                <DialogDescription>
                  El archivo que se descargará a continuación contiene las fechas
                  de vacaciones de todos los trabajadores asignados a la
                  dependencia de la cual usted es jefe.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isDownloading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Descargando...' : 'Descargar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>}
        </CardContent>
      </Card>

      {/* Tabla de histórico de solicitudes */}
      <TablaHistoricoPlaneacion />
    </div>
  );
}

export default DashboardHistorico;

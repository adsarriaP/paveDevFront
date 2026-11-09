import { TableAdminSolicitudes } from '@/components/solicitudes/TableAdminSolicitudes';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReporteExcelDialog } from '@/components/Gestion-Administrador/reportes/ReporteExcelDialog';
import { ReporteSimplificadoDialog } from '@/components/Gestion-Administrador/reportes/ReporteSimplificadoDialog';
import { ReporteInfotipoButton } from '@/components/Gestion-Administrador/reportes/ReporteInfotipoButton';

function DashboardAdminSolicitudes() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera con título */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Administración de Solicitudes
            </h1>
            <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
              <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
              {formattedDate}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <ReporteInfotipoButton />
              <ReporteSimplificadoDialog />
            </div>
            <ReporteExcelDialog />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de solicitudes administrativas */}
      <TableAdminSolicitudes />
    </div>
  );
}

export default DashboardAdminSolicitudes;

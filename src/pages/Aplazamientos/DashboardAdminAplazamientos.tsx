import { TableAdminSolicitudesAplazamiento } from '@/components/aplazamientos/tablaAdminSolicitudes';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';

const DashboardCalendarioAplazamientos = () => {
  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Gestión de Aplazamientos
            </h1>

            <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
              <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
              {formattedDate}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* <ReporteExcelDialog /> */}
          </div>
        </CardContent>
      </Card>
      <div>
        <h1 className="text-2xl font-bold tracking-tight"></h1>
      </div>
      <TableAdminSolicitudesAplazamiento />
    </div>
  );
};

export default DashboardCalendarioAplazamientos;

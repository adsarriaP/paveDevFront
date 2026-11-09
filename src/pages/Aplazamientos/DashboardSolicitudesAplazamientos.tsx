import { TableSolicitudesAplazamiento } from '@/components/aplazamientos/TableSolicitudesAplazamiento';

function DashboardSolicitudesAplazamientos() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Solicitudes de Aplazamientos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona las solicitudes de aplazamiento de vacaciones
        </p>
      </div>

      <TableSolicitudesAplazamiento />
    </div>
  );
}

export default DashboardSolicitudesAplazamientos;

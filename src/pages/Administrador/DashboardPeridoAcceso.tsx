import React, { useState, useCallback } from 'react';
import TablePeriodosAcceso from '@/components/Gestion-Administrador/periodo-acceso/TablePeriodosAcceso';
import AperturaPlaneacionVacaciones from '@/components/Gestion-Administrador/periodo-acceso/AperturaPlaneacionVacaciones';
import CrearPeriodoPlaneacionDialog from '@/components/Gestion-Administrador/periodo-acceso/CrearPeriodoPlaneacionDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';


const DashboardPeriodoAcceso: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  // Cuando se crea/actualiza un periodo, refresca la tabla y oculta el form
  const handlePeriodoChanged = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setShowForm(false);
  }, []);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera con título y botón para mostrar/ocultar formulario */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Configuración de Periodos de Acceso
            </h1>
            <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
              <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
              {formattedDate}
            </p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <Button
              onClick={toggleForm}
              variant={showForm ? 'outline' : 'default'}
              className="flex items-center gap-2 transition-all duration-200"
            >
              {showForm ? (
                <>
                  <X className="h-4 w-4" />
                  Ocultar Formulario
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Nuevo Período
                </>
              )}
            </Button>

            <CrearPeriodoPlaneacionDialog
              onPeriodoCreado={handlePeriodoChanged}
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulario de creación con animación expandible */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          showForm ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 border-b pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                {refreshKey === 0 ? 'Crear Nuevo Periodo' : 'Actualizar Periodo'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Registrar un nuevo periodo de acceso en el sistema
              </p>
            </div>
            {showForm && (
              <AperturaPlaneacionVacaciones onClose={handlePeriodoChanged} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* DataTable de periodos */}
      <TablePeriodosAcceso key={refreshKey} />
    </div>
  );
};


export default DashboardPeriodoAcceso;

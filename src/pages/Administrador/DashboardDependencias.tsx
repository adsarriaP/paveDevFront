// src/pages/dependecias-jefes/DashboardDependenciasActualizado.tsx
import { useState, useCallback } from 'react';
import DataTableDependencias from '@/components/Gestion-Administrador/dependencias/DataTableDependencias';
import FormDependencias from '@/components/Gestion-Administrador/dependencias/FormDependencias';
import HeaderDependencias from '@/components/Gestion-Administrador/dependencias/HeaderDependencias';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

function DashboardDependencias() {
  // Estado para forzar la actualización de la tabla
  const [refreshKey, setRefreshKey] = useState(0);
  // Estado para mostrar/ocultar el formulario
  const [showForm, setShowForm] = useState(false);

  // Función callback que será llamada cuando se cree o actualice una dependencia
  const handleDependenciaChanged = useCallback(() => {
    // Incrementar el refreshKey para forzar la actualización de la tabla
    setRefreshKey((prev) => prev + 1);
    // Ocultar el formulario después de una operación exitosa
    setShowForm(false);
  }, []);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Cabecera con título y botón para mostrar/ocultar formulario */}
      <HeaderDependencias showForm={showForm} onToggleForm={toggleForm} />

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
                Crear Nueva Dependencia
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Registrar una nueva dependencia en el sistema
              </p>
            </div>
            {showForm && (
              <FormDependencias
                onSuccess={handleDependenciaChanged}
                isVisible={showForm}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* DataTable de dependencias */}
      <DataTableDependencias key={refreshKey} refreshTrigger={refreshKey} />
    </div>
  );
}

export default DashboardDependencias;

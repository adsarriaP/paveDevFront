// src/pages/CrearUsuarios/DashboardUsuarios.tsx
import React, { useState, useCallback } from 'react';
import UserDataTable from '@/components/Gestion-Administrador/usuarios/UserDataTable';
import FormUsuarios from '@/components/Gestion-Administrador/usuarios/FormUsuarios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DashboardUsuarios: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  // Función callback que será llamada cuando se cree o actualice un usuario
  const handleUsuarioChanged = useCallback(() => {
    // Incrementar el refreshKey para forzar la actualización de la tabla
    setRefreshKey((prev) => prev + 1);
    // Ocultar el formulario después de una operación exitosa
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
              Configuración de Usuarios
            </h1>
            <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
              <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
              {formattedDate}
            </p>
          </div>
          <div className="w-full sm:w-auto">
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
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de creación con animación expandible */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          showForm ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 border-b pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Crear Nuevo Usuario
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Registrar un nuevo usuario en el sistema
              </p>
            </div>
            {showForm && (
              <FormUsuarios
                onSuccess={handleUsuarioChanged}
                isVisible={showForm}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* DataTable de usuarios */}
      <UserDataTable key={refreshKey} refreshTrigger={refreshKey} />
    </div>
  );
};

export default DashboardUsuarios;

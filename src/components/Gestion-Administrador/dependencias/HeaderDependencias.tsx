// src/components/dependencias/HeaderDependencias.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderDependenciasProps {
  showForm: boolean;
  onToggleForm: () => void;
}

const HeaderDependencias: React.FC<HeaderDependenciasProps> = ({
  showForm,
  onToggleForm,
}) => {
  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Gestión de Dependencias
          </h1>
          <p className="text-muted-foreground flex items-center mt-1 text-sm sm:text-base">
            <CalendarDays className="mr-1 h-4 w-4 text-foreground" />
            {formattedDate}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={onToggleForm}
            variant={showForm ? 'outline' : 'default'}
            className="flex items-center gap-2"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                Ocultar Formulario
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Gestionar Dependencias
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeaderDependencias;

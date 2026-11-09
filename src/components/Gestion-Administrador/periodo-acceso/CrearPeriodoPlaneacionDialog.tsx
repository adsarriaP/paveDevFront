import { useState } from 'react';
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
import { Calendar, Plus } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

interface CrearPeriodoPlaneacionDialogProps {
  onPeriodoCreado?: () => void;
}

export default function CrearPeriodoPlaneacionDialog({
  onPeriodoCreado,
}: CrearPeriodoPlaneacionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { post } = useApi();

  const handleCrearPeriodo = async () => {
    try {
      setIsCreating(true);
      // Timeout extendido a 2 minutos (120000ms) para soportar operaciones con +2800 usuarios
      await post('/periodos/crear-siguiente', {}, {
        timeout: 120000
      });

      Notify.success('Período de planeación creado exitosamente');
      setOpen(false);

      // Llamar callback para refrescar la tabla
      if (onPeriodoCreado) {
        onPeriodoCreado();
      }
    } catch (error) {
      console.error('Error al crear período de planeación:', error);
      // El error ya se muestra por el hook useApi
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 transition-all duration-200"
        >
          <Calendar className="h-4 w-4" />
          Nuevo Período de Planeación
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Crear Período de Planeación
          </DialogTitle>
          <DialogDescription>
            Al confirmar, se creará automáticamente un nuevo período de
            planeación en el sistema. Esta acción puede tardar hasta 2 minutos
            dependiendo de la cantidad de usuarios. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nota:</strong> El nuevo período de planeación se generará
              automáticamente con las fechas correspondientes al siguiente
              ciclo.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrearPeriodo}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Confirmar y Crear
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogAplazamientoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accion: 'aprobar' | 'rechazar';
  nombre: string;
  onConfirm: (motivo?: string) => void;
}

export function ConfirmDialogAplazamiento({
  open,
  onOpenChange,
  accion,
  nombre,
  onConfirm,
}: ConfirmDialogAplazamientoProps) {
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivoRechazo('');
      setTouched(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (accion === 'aprobar') {
      onConfirm();
    } else {
      setTouched(true);
      if (motivoRechazo.trim()) {
        onConfirm(motivoRechazo.trim());
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {accion === 'aprobar' ? (
              <span className="flex items-center gap-2 text-green-600">
                <Check className="w-6 h-6" /> Confirmar aprobación
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-600">
                <X className="w-6 h-6" /> Confirmar rechazo
              </span>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea {accion === 'aprobar' ? 'aprobar' : 'rechazar'} la solicitud de aplazamiento de <strong>{nombre}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {accion === 'rechazar' && (
          <div className="my-2">
            <label className="block font-medium mb-1">
              Motivo del rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border rounded p-2"
              placeholder="Ingrese el motivo del rechazo..."
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              required
            />
            {touched && !motivoRechazo.trim() && (
              <span className="text-red-500 text-sm">Este campo es obligatorio.</span>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={accion === 'rechazar' && !motivoRechazo.trim()}
          >
            Sí, {accion === 'aprobar' ? 'aprobar' : 'rechazar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

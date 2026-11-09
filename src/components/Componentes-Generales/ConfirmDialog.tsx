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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accion: 'aprobar' | 'rechazar';
  nombre: string;
  onConfirm: (inputValue: string) => void; // Cambia para recibir el valor
}

export function ConfirmDialog({
  open,
  onOpenChange,
  accion,
  nombre,
  onConfirm,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setInputValue('');
      setTouched(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (accion === 'aprobar') {
      onConfirm('Aprobado'); // texto quemado
    } else {
      setTouched(true);
      if (inputValue.trim()) {
        onConfirm(inputValue.trim());
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
            ¿Está seguro que desea {accion === 'aprobar' ? 'aprobar' : 'rechazar'} la solicitud de <strong>{nombre}</strong>?
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
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              required
            />
            {touched && !inputValue.trim() && (
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
            disabled={accion === 'rechazar' && !inputValue.trim()}
          >
            Sí, {accion === 'aprobar' ? 'aprobar' : 'rechazar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
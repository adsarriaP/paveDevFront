import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export type Movimiento = {
  tipomovimiento: string;
  estado: number;
  fechademovimiento: string;
  idusuario?: number;
  nombreusuario?: string;
  usuarioAprobador?: number;
  nombreUsuarioAprobador?: string;
  usuarioRechazador?: number;
  nombreUsuarioRechazador?: string;
  usuario?: {
    nombre: string;
    user?: string;
  };
  motivoRechazo?: string;
  observaciones?: string;
  nivel?: string;
};

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  history: Movimiento[];
}

const estadoLabel = (estado: number) => {
  switch (estado) {
    case 1:
      return 'Pendiente';
    case 2:
      return 'Rechazado';
    case 3:
      return 'Aprobado por Jefe';
    case 4:
      return 'Aprobado por Gerente';
    case 5:
      return 'Aprobado por Gestor';
    case 6:
      return 'Aprobada Final';
    default:
      return 'Desconocido';
  }
};

// Helper para formatear fechas sin problemas de timezone
const formatDate = (dateString: string): string => {
  // Si la fecha viene con hora (ISO 8601), extraer solo la fecha
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  ).toLocaleDateString();
};

export const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onClose,
  history,
}) => (
  <AlertDialog open={open} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Histórico de movimientos</AlertDialogTitle>
      </AlertDialogHeader>
      <div className="space-y-2">
        {history.length === 0 ? (
          <div>No hay movimientos registrados.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Movimiento</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {history.map((mov, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td className="p-2">
                      {formatDate(mov.fechademovimiento)}
                    </td>
                    <td className="p-2">{mov.tipomovimiento}</td>
                    <td className="p-2">{estadoLabel(mov.estado)}</td>
                    <td className="p-2">
                      {mov.nombreusuario ||
                        mov.nombreUsuarioAprobador ||
                        mov.nombreUsuarioRechazador ||
                        mov.usuario?.nombre ||
                        (mov.idusuario
                          ? `Usuario ID: ${mov.idusuario}`
                          : mov.usuarioAprobador
                            ? `Usuario ID: ${mov.usuarioAprobador}`
                            : mov.usuarioRechazador
                              ? `Usuario ID: ${mov.usuarioRechazador}`
                              : 'N/A')}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AlertDialogFooter>
        <Button onClick={onClose}>Cerrar</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

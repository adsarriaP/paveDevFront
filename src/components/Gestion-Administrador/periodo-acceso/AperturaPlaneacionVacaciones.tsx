import { useState, useEffect } from 'react';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix';
import { PeriodoAcceso } from '@/types';

interface AperturaPlaneacionVacacionesProps {
  onClose?: () => void;
  initialData?: PeriodoAcceso | null;
  isEdit?: boolean;
}

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  // datetime-local espera 'YYYY-MM-DDTHH:mm'
  // Obtener los componentes de fecha en la zona horaria local del navegador
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convierte el valor del input datetime-local a un ISO string con timezone
const formatDateForBackend = (datetimeLocal: string) => {
  if (!datetimeLocal) return '';
  // Crear fecha interpretando el string como hora local
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Crear fecha en zona horaria local
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // Convertir a ISO string (esto incluye el timezone automáticamente)
  return date.toISOString();
};

const AperturaPlaneacionVacaciones = ({
  onClose,
  initialData,
  isEdit,
}: AperturaPlaneacionVacacionesProps) => {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(
    initialData?.descripcion ?? ''
  );
  const [fechaInicio, setFechaInicio] = useState(
    isEdit ? formatDateForInput(initialData?.fecha_inicio) : ''
  );
  const [fechaFin, setFechaFin] = useState(
    isEdit ? formatDateForInput(initialData?.fecha_fin) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { post, patch } = useApi();

  useEffect(() => {
    if (isEdit && initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setFechaInicio(formatDateForInput(initialData.fecha_inicio));
      setFechaFin(formatDateForInput(initialData.fecha_fin));
    }
  }, [isEdit, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre || !descripcion || !fechaInicio || !fechaFin) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (fechaInicio >= fechaFin) {
      setError('La fecha/hora de inicio debe ser anterior a la de cierre.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && initialData?.id) {
        await patch(`/periodos-acceso/${initialData.id}`, {
          nombre,
          descripcion,
          fecha_inicio: formatDateForBackend(fechaInicio),
          fecha_fin: formatDateForBackend(fechaFin),
          activo: true,
          permitir_fines_semana: true,
        });
        Notify.success('Periodo de acceso actualizado correctamente');
      } else {
        await post('/periodos-acceso', {
          nombre,
          descripcion,
          fecha_inicio: formatDateForBackend(fechaInicio),
          fecha_fin: formatDateForBackend(fechaFin),
          activo: true,
          permitir_fines_semana: true,
        });
        Notify.success('Periodo de acceso creado correctamente');
        setNombre('');
        setDescripcion('');
        setFechaInicio('');
        setFechaFin('');
      }
      if (onClose) onClose();
    } catch {
      setError(
        isEdit
          ? 'Error al actualizar el periodo.'
          : 'Error al guardar el periodo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Primera fila - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del periodo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción"
              required
            />
          </div>
        </div>

        {/* Segunda fila - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fecha-inicio">
              Fecha y hora de inicio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fecha-inicio"
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha-fin">
              Fecha y hora de cierre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fecha-fin"
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Error y botón */}
        {error && (
          <div className="p-3 rounded bg-red-100 text-red-700 text-sm border border-red-300">
            {error}
          </div>
        )}
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isEdit
                ? 'Actualizando...'
                : 'Guardando...'
              : isEdit
                ? 'Actualizar período'
                : 'Crear período'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AperturaPlaneacionVacaciones;

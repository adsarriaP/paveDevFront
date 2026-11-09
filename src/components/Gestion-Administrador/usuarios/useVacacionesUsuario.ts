import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

export interface VacacionDetalle {
  id: number;
  fecha_causacion: string | null;
  fecha_disfrute: string | null;
  fecha_retorno: string | null;
  fecha_disfrute_secundario: string | null;
  fecha_retorno_secundario: string | null;
  periodo: string;
  diasVacaciones: number | null;
  diasVacacionesSecundario: number | null;
  vacacionesDivididas: boolean;
}

export interface VacacionesUsuarioData {
  usuario: {
    id: number;
    nombre: string;
    fecha_causacion_base: string | null;
    registro: number;
  };
  vacaciones: VacacionDetalle[];
  historico_pendiente: VacacionDetalle[];
  total: number;
}

interface UseVacacionesUsuarioReturn {
  data: VacacionesUsuarioData | null;
  isLoading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
}

export const useVacacionesUsuario = (userId: number): UseVacacionesUsuarioReturn => {
  const [data, setData] = useState<VacacionesUsuarioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { get } = useApi();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await get<{ ok: boolean; data: VacacionesUsuarioData }>(
        `/usuarios/${userId}/vacaciones`
      );

      setData(response.data);
    } catch (err) {
      console.error('Error al cargar vacaciones del usuario:', err);
      setError(err as Error);
      Notify.failure('No se pudo cargar la información de vacaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, fetchData };
};

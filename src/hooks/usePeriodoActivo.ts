// src/hooks/usePeriodoActivo.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { Periodo } from '@/types/entities.types';

interface UsePeriodoActivoReturn {
  periodo: Periodo | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook personalizado para obtener el período activo actual
 * Se recarga automáticamente cuando el componente se monta
 */
export const usePeriodoActivo = (): UsePeriodoActivoReturn => {
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  const loadPeriodoActivo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando período activo...');
      const response = await get<Periodo>('/periodos/activo');
      
      setPeriodo(response);
      console.log('Período activo cargado:', response);
      
    } catch (error: unknown) {
      console.error('Error cargando período activo:', error);
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };

      // Manejar diferentes tipos de errores
      if (err.response?.status === 404) {
        setError('No hay período activo configurado');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al cargar el período activo');
      }
      
      setPeriodo(null);
      
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPeriodoActivo();
  };

  useEffect(() => {
    loadPeriodoActivo();
  }, []);

  return {
    periodo,
    loading,
    error,
    refresh,
  };
};

export default usePeriodoActivo;
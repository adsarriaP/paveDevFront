// src/hooks/useVacaciones.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { 
  Vacacion, 
  GetVacacionesDto, 
  FechasVacacionesCalculadas,
  ActualizarFechaCausacionDto,
  CalcularFechasDto 
} from '@/types/entities.types';

interface UseVacacionesReturn {
  vacaciones: Vacacion[];
  loading: boolean;
  error: string | null;
  // Métodos para gestionar vacaciones
  obtenerVacaciones: (filtros?: GetVacacionesDto) => Promise<void>;
  calcularFechas: (fechaCausacion: string) => Promise<FechasVacacionesCalculadas | null>;
  actualizarFechaCausacion: (vacacionId: number, datos: ActualizarFechaCausacionDto) => Promise<Vacacion | null>;
  refresh: () => void;
}

/**
 * Hook personalizado para gestionar vacaciones
 * Permite obtener, calcular y actualizar vacaciones
 */
export const useVacaciones = (filtrosIniciales?: GetVacacionesDto): UseVacacionesReturn => {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get, patch, post } = useApi();

  /**
   * Obtiene vacaciones con filtros opcionales
   */
  const obtenerVacaciones = async (filtros?: GetVacacionesDto) => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      if (filtros?.periodoId) params.append('periodoId', filtros.periodoId.toString());
      if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId.toString());
      
      const queryString = params.toString();
      const url = queryString ? `/vacaciones?${queryString}` : '/vacaciones';
      
      console.log('Obteniendo vacaciones:', url);
      const response = await get<Vacacion[]>(url);
      
      setVacaciones(response);
      console.log('Vacaciones obtenidas:', response.length);
      
    } catch (error: unknown) {
      console.error('Error obteniendo vacaciones:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al obtener vacaciones');
      setVacaciones([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcula fechas de vacaciones (simulación)
   */
  const calcularFechas = async (fechaCausacion: string): Promise<FechasVacacionesCalculadas | null> => {
    try {
      setError(null);
      
      const datos: CalcularFechasDto = { fechaCausacion };
      console.log('Calculando fechas para:', fechaCausacion);
      
      const response = await post<FechasVacacionesCalculadas>('/vacaciones/calcular-fechas', datos);
      
      console.log('Fechas calculadas:', response);
      return response;
      
    } catch (error: unknown) {
      console.error('Error calculando fechas:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al calcular fechas');
      return null;
    }
  };

  /**
   * Actualiza la fecha de causación de una vacación
   */
  const actualizarFechaCausacion = async (
    vacacionId: number, 
    datos: ActualizarFechaCausacionDto
  ): Promise<Vacacion | null> => {
    try {
      setError(null);
      
      console.log('Actualizando fecha de causación:', { vacacionId, datos });
      const response = await patch<Vacacion>(`/vacaciones/${vacacionId}/fecha-causacion`, datos);
      
      // Actualizar la lista local si la vacación existe
      setVacaciones(prev => 
        prev.map(v => v.id === vacacionId ? response : v)
      );
      
      console.log('Fecha de causación actualizada:', response);
      return response;
      
    } catch (error: unknown) {
      console.error('Error actualizando fecha de causación:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al actualizar fecha de causación');
      return null;
    }
  };

  /**
   * Refresca la lista de vacaciones con los filtros actuales
   */
  const refresh = () => {
    obtenerVacaciones(filtrosIniciales);
  };

  // Cargar vacaciones al montar el componente
  useEffect(() => {
    if (filtrosIniciales) {
      obtenerVacaciones(filtrosIniciales);
    }
  }, []);

  return {
    vacaciones,
    loading,
    error,
    obtenerVacaciones,
    calcularFechas,
    actualizarFechaCausacion,
    refresh,
  };
};

export default useVacaciones;
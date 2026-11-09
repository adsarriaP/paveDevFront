// src/hooks/useFestivos.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface Festivo {
  date: string; // "2025-01-01"
  name: string; // "Año Nuevo"
}

interface UseFestivosReturn {
  festivos: string[]; // Array de fechas en formato "YYYY-MM-DD"
  festivosData: Festivo[]; // Array completo con nombres
  loading: boolean;
  error: string | null;
}

export const useFestivos = (year: number): UseFestivosReturn => {
  const [festivos, setFestivos] = useState<string[]>([]);
  const [festivosData, setFestivosData] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const loadFestivos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar cache local
        const cacheKey = `festivos-colombia-v3-${year}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const oneYear = 365 * 24 * 60 * 60 * 1000; // 1 año en milisegundos
            
            // Si el cache es válido (menos de 1 año)
            if (Date.now() - timestamp < oneYear) {
              setFestivosData(data);
              setFestivos(data.map((f: Festivo) => f.date));
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.warn('Error parsing cached festivos:', parseError);
            localStorage.removeItem(cacheKey); // Limpiar cache corrupto
          }
        }

        // Cargar desde backend
        console.log(`Cargando festivos para el año ${year}...`);
        const response = await get<Festivo[]>(`/festivos/${year}`);
        
        setFestivosData(response);
        const dates = response.map(f => f.date);
        setFestivos(dates);
        
        // Guardar en cache
        localStorage.setItem(cacheKey, JSON.stringify({
          data: response,
          timestamp: Date.now()
        }));

        console.log(`Festivos cargados para ${year}:`, dates);
        
      } catch (error: unknown) {
        console.error('Error cargando festivos:', error);
        const err = error as { message?: string };
        setError(err.message || 'Error al cargar días festivos');

        // En caso de error, usar cache vencido si existe
        const cacheKey = `festivos-colombia-v3-${year}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data } = JSON.parse(cached);
            setFestivosData(data);
            setFestivos(data.map((f: Festivo) => f.date));
            console.warn('Usando cache vencido debido a error en la carga');
          } catch (parseError) {
            console.error('Error usando cache vencido:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (year && year > 1900 && year < 2100) {
      loadFestivos();
    }
  }, [year, get]);

  return { festivos, festivosData, loading, error };
};

export default useFestivos;
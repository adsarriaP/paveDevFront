import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useApi } from '@/hooks/useApi';
import { PaginatedResponse } from '@/types/api.types';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

interface UsePaginatedTableOptions {
  endpoint: string;
  initialPageSize?: number;
  debounceDelay?: number;
  fallbackEndpoint?: string;
}

interface UsePaginatedTableResult<T> {
  data: T[];
  loading: boolean;
  refreshing: boolean;
  serverSideLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  fetchData: (page?: number, size?: number, search?: string, isRefresh?: boolean) => Promise<void>;
}

export function usePaginatedTable<T>({
  endpoint,
  initialPageSize = 10,
  debounceDelay = 500,
  fallbackEndpoint
}: UsePaginatedTableOptions): UsePaginatedTableResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverSideLoading, setServerSideLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  const { get } = useApi();

  const fetchData = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    search = debouncedSearchTerm, 
    isRefresh = false
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (data.length === 0) {
        setLoading(true);
      } else {
        setServerSideLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
      });

      try {
        // Intentar usar el endpoint paginado
        const response = await get<PaginatedResponse<T>>(`${endpoint}/paginated?${params}`);
        
        setData(response.data);
        setTotalItems(response.total);
        setTotalPages(response.totalPages || Math.ceil(response.total / size));
        setCurrentPage(response.page);
        setPageSize(response.size);
      } catch (paginationError) {
        // Fallback al endpoint original si existe
        if (fallbackEndpoint) {
          console.warn(`Paginación no disponible, usando fallback: ${fallbackEndpoint}`);
          const fallbackResponse = await get<T[]>(fallbackEndpoint);
          setData(fallbackResponse);
          setTotalItems(fallbackResponse.length);
          setTotalPages(Math.ceil(fallbackResponse.length / size));
          
          // Aplicar filtrado y paginación del lado cliente
          if (search) {
            const filtered = fallbackResponse.filter((item: unknown) =>
              Object.values(item as Record<string, unknown>).some(value =>
                String(value).toLowerCase().includes(search.toLowerCase())
              )
            );
            const startIndex = page * size;
            const endIndex = startIndex + size;
            setData(filtered.slice(startIndex, endIndex));
            setTotalItems(filtered.length);
            setTotalPages(Math.ceil(filtered.length / size));
          } else {
            const startIndex = page * size;
            const endIndex = startIndex + size;
            setData(fallbackResponse.slice(startIndex, endIndex));
          }
          
          if (data.length === 0) {
            Notify.info('Usando paginación del lado cliente');
          }
        } else {
          throw paginationError;
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Notify.failure('No se pudieron cargar los datos');
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setServerSideLoading(false);
    }
  }, [endpoint, fallbackEndpoint, currentPage, pageSize, debouncedSearchTerm, data.length, get]);

  const refresh = useCallback(() => {
    fetchData(currentPage, pageSize, debouncedSearchTerm, true);
  }, [fetchData, currentPage, pageSize, debouncedSearchTerm]);

  // Efectos
  useEffect(() => {
    fetchData(0, pageSize);
  }, []);

  useEffect(() => {
    fetchData(0, pageSize, debouncedSearchTerm);
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    if (currentPage > 0 || pageSize !== initialPageSize) {
      fetchData(currentPage, pageSize, debouncedSearchTerm);
    }
  }, [currentPage, pageSize]);

  return {
    data,
    loading,
    refreshing,
    serverSideLoading,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    setCurrentPage,
    setPageSize,
    refresh,
    fetchData
  };
}

export default usePaginatedTable;
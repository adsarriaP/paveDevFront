/**
 * @file useApi.ts
 * @description Hook personalizado para enviar las peticiones con token de validacion
 */

import { useCallback } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Notify } from "notiflix/build/notiflix-notify-aio";
import { ApiError, UseApiResult } from "@/types";

// Constante para la URL base
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Hook personalizado
export const useApi = (): UseApiResult => {
  // Configuración de la instancia de Axios (DENTRO del hook)
  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Función para obtener el token (más robusta)
  const getToken = useCallback((): string | null => {
    try {
      return localStorage.getItem("token");
    } catch (error) {
      console.warn("Error al acceder a localStorage:", error);
      return null;
    }
  }, []);

  // Interceptor para añadir el token (más seguro)
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Manejo de errores genérico
  const handleError = useCallback((error: unknown): never => {
    console.error("Error en la petición API:", error);

    const apiError = error as ApiError;

    // Log completo de la respuesta para debugging
    if (apiError.response) {
      console.log("Respuesta completa del error:", {
        status: apiError.response.status,
        statusText: apiError.response.statusText,
        data: apiError.response.data,
        headers: apiError.response.headers
      });
    }

    // Intentar extraer el mensaje de error del backend en varios formatos posibles
    const errorMessage =
      apiError.response?.data?.msg ||           // Formato común en tu API
      apiError.response?.data?.message ||       // Formato estándar
      apiError.response?.data?.error ||         // Formato alternativo
      apiError.response?.data?.errors?.[0] ||   // Array de errores
      apiError.response?.statusText ||          // Status HTTP
      apiError.message ||                       // Mensaje de Axios
      "Ocurrió un error inesperado. Por favor, intenta de nuevo.";

    console.log("Mensaje de error extraído:", errorMessage);
    Notify.failure(errorMessage);
    throw error;
  }, []);

  // Métodos de petición (manteniendo tus implementaciones originales)
  const get = useCallback(
    async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.get(url, config);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    [handleError]
  );

  const post = useCallback(
    async <T>(
      url: string,
      data: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.post(url, data, config);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    [handleError] // Dependemos de handleError
  );

  const put = useCallback(
    async <T>(
      url: string,
      data: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.put(url, data, config);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    [handleError] // Dependemos de handleError
  );

  const del = useCallback(
    async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.delete(url, config);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    [handleError] // Dependemos de handleError
  );

  const patch = useCallback(
    async <T>(
      url: string,
      data: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> => {
      try {
        const response: AxiosResponse<T> = await api.patch(url, data, config);
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    [handleError] // Dependemos de handleError
  );

  return { get, post, put, del, patch };
};

export default useApi;

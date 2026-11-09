/**
 * @file api.types.ts
 * @description Hook personalizado para tipos relacionados con API y peticiones
 */

import { AxiosRequestConfig } from "axios";

export interface ApiError {
  response?: {
    status?: number;
    statusText?: string;
    headers?: Record<string, unknown>;
    data?: {
      msg?: string;
      message?: string;
      error?: string;
      errors?: string[];
    };
  };
  message?: string;
}

export interface UseApiResult {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T>(url: string, data: unknown, config?: AxiosRequestConfig) => Promise<T>;
  put: <T>(url: string, data: unknown, config?: AxiosRequestConfig) => Promise<T>;
  del: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T>(url: string, data: unknown, config?: AxiosRequestConfig) => Promise<T>;
}

// Interfaces para usuarios
export interface CreateUserPayload {
  nombre: string;
  user: string;
  rol_id: number;
  registro: number;
  jefeId?: number;
  fecha_causacion_base: string;
  crearVacacionesAutomaticamente: boolean;
  planilla: string[] | null;
  planilla_analista?: string;
}

export interface UpdateUserPayload {
  nombre: string;
  user: string;
  rol_id: number;
  registro: number;
  jefeId?: number | null;
  fecha_causacion_base: string;
  actualizarVacacionesAutomaticamente: boolean;
  planilla: string[] | null;
  planilla_analista?: string | null;
}

export interface UpdateVacacionFechasPayload {
  fecha_disfrute?: string;
  fecha_retorno?: string;
  fecha_disfrute_secundario?: string | null;
  fecha_retorno_secundario?: string | null;
}

export interface JefeOption {
  id: number;
  nombre: string;
  user: string;
  registro: number;
  rol: { nombre: string };
}

// Interfaces para paginación
export interface PaginationParams {
  page: number;
  size: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedUsersResponse {
  users: import('@/types/entities.types').User[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

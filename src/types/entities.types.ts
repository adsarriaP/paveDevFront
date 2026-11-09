/**
 * @file entities.types.ts
 * @description Hook personalizado para todas las entidades del negocio
 */

// Entidades básicas y sus variantes

export interface User {
  id: number;
  nombre: string;
  user: string;
  fecha_causacion_base?: string;
  rol: Role;
  ultimo_acceso?: string | null;
  estado?: number;
  dependencia_id?: number;
  dependencia?: Dependencia;
  // Campo virtual para mostrar la información de la dependencia
  dependenciaInfo?: DependenciaInfo;
  // Campo virtual para mostrar la información de vacaciones
  vacacionesInfo?: VacacionInfo[];
  registro: number;
  planilla?: string | string[]; // Puede ser string o array de strings
  planilla_analista?: string | null;
}

export interface VacacionInfo {
  id: number;
  fecha_causacion: string;
  fecha_disfrute: string;
  fecha_retorno: string;
  periodo: string;
  diasVacaciones: number;
}

export interface UserData {
  id: number;
  user: string;
  nombre: string;
  rol: Role;
  dependencia_id?: number;
  dependenciaInfo?: DependenciaInfo;
  registro: number;
}

export interface UserFormData {
  nombre: string;
  user: string;
  rol: Role;
  password: string;
  registro: number;
}

export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Dependencia {
  id: number;
  gerencia: string;
  subgerencia: string;
  unidad: string;
  codigo?: string | null;
  jefeUsuario?: User;
  jefe?: number;
  jefeInfo?: JefeInfo;
  jefe_secundario?: number;
  jefeSecundarioInfo?: JefeInfo;
  estado: number;
}

export interface DependenciaInfo {
  id: number;
  gerencia: string;
  subgerencia: string;
  unidad: string;
  codigo?: string | null;
  jefe?: number | null;
  jefeUsuario?: JefeUsuario;
}

export interface JefeUsuario {
  id: number;
  nombre: string;
}

export interface UserProfile extends User {
  dependenciaInfo?: DependenciaInfo;
}

// Información resumida del jefe para evitar referencias circulares
export interface JefeInfo {
  id: number;
  nombre: string;
}

export interface Periodo {
  id: number;
  nombre: string; // "2025-2026"
  anio_causacion: number; // 2026
  activo: boolean;
}

export interface CrearPeriodoDto {
  nombre: string; // "2026-2027"
  anioCausacion?: number; // Opcional, se extrae del nombre si no se especifica
  activo?: boolean; // Por defecto true
  crearVacacionesAutomaticamente?: boolean; // Por defecto true
}

export interface ActualizarPeriodoDto {
  nombre?: string;
  anioCausacion?: number;
  activo?: boolean;
}

export interface ResultadoCreacionMasiva {
  totalUsuarios: number;
  registrosCreados: number;
  errores: {
    usuarioId: number;
    error: string;
  }[];
  resumen: {
    exitosos: number;
    fallidos: number;
  };
}

export interface Vacacion {
  id: number;
  usuario_id: number;
  periodos_id: number;
  fecha_causacion: string; // "2026-08-25"
  fecha_disfrute: string | null; // "2026-09-01"
  fecha_retorno: string | null; // "2026-09-16"
  fecha_registro: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Relaciones
  usuario?: User;
  periodos?: Periodo;
  // Campo calculado
  diasVacaciones?: number | null;
}

export interface CrearVacacionesMasivoDto {
  periodoId: number;
  usuariosIds?: number[]; // Opcional, si no se especifica se toman todos los usuarios activos
  recalcularFechas?: boolean; // Por defecto true
}

export interface ActualizarFechaCausacionDto {
  fechaCausacion: string; // "2026-08-25"
  recalcularAutomaticamente?: boolean; // Por defecto true
}

export interface CalcularFechasDto {
  fechaCausacion: string; // "2026-08-25"
}

export interface GetVacacionesDto {
  periodoId?: number;
  usuarioId?: number;
}

export interface QuinceanaInfo {
  quinceana: 'primera' | 'segunda'; // primera: 2-16, segunda: 17-1
  diaPago: number; // 15 o 30
  fechaPago: string; // Fecha real de pago (ajustada por festivos/fines de semana)
  fechaPagoOriginal: string; // Fecha original del día de pago (15 o 30)
}

export interface FechasVacacionesCalculadas {
  fechaCausacion: string;
  quinceanaInfo: QuinceanaInfo;
  fechaDisfrute: string;
  fechaRetorno: string;
  diasHabilesContados: number; // Para validación (siempre 15)
}

export interface PeriodoAcceso {
  id?: number;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  permitir_fines_semana: boolean;
  duracionEnDias?: number;
  creador?: { nombre?: string };
  creadorInfo?: { nombre?: string };
}

export interface PeriodoAccesoPublico {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  nombre: string | null;
  mensaje?: string;
}

export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA', 
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA'
}

export interface PeriodoActivo {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  permitir_fines_semana: boolean;
}

export interface CreateSolicitudPayload {
  usuario_id: number;
  periodo_id: number;
  fecha_inicio_principal: string; // ISO date string "2025-01-15"
  fecha_fin_principal: string;
  fecha_inicio_secundario?: string; // Solo si está dividido
  fecha_fin_secundario?: string;
  observaciones?: string;
}

export interface UpdateSolicitudPayload {
  fecha_inicio_principal: string; // ISO date string "2025-01-15"
  fecha_fin_principal: string;
  fecha_inicio_secundario?: string | null; // Solo si está dividido, null para limpiar
  fecha_fin_secundario?: string | null;
  observaciones?: string;
}

export interface Solicitud {
  id: number;
  usuario_id: number;
  periodo_id: number;
  estado: EstadoSolicitud;
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  dias_principal?: number;
  fecha_inicio_secundario?: string;
  fecha_fin_secundario?: string;
  dias_secundario?: number;
  observaciones?: string;
  fecha_solicitud: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  usuario?: {
    id: number;
    nombre: string;
  };
  periodos?: {
    id: number;
    nombre: string;
  };
}

export interface SolicitudResponse {
  ok: boolean;
  msg: string;
  data: Solicitud;
}

export interface ListSolicitudesResponse {
  ok: boolean;
  msg: string;
  data: Solicitud[];
  total: number;
}

// Interfaces para cálculos de días hábiles
export interface DiasHabilesResult {
  fechaFin: Date;
  diasContados: number;
  esValido: boolean;
  diasNoHabiles: string[];
}

export interface ValidacionFecha {
  esValida: boolean;
  errores: string[];
  esFuturo: boolean;
  esDiaHabil: boolean;
  esFestivo: boolean;
}

// Para el componente de calendario
export interface CalendarConfig {
  currentYear: number;
  fromYear: number;
  toYear: number;
  disabledDates: Date[];
  festivos: string[];
  loading: boolean;
}

// Interface para el resultado de cálculo de días hábiles
export interface DiasHabilesCalculation {
  fechaInicio: Date;
  fechaFin: Date;
  diasHabiles: number;
  diasExcluidos: {
    fecha: string;
    motivo: 'fin_semana' | 'festivo';
    descripcion?: string;
  }[];
}

// Interfaces para la tabla de solicitudes
export interface SolicitudUsuario {
  id: number;
  usuario_id: number;
  periodos_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  dias_principal: number;
  fecha_inicio_secundario: string | null;
  fecha_fin_secundario: string | null;
  dias_secundario: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  historico?: string;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    rol_id: number;
    dependencia_id: number;
    ultimo_acceso: string;
    estado: number;
    rol: {
      id: number;
      nombre: string;
      descripcion: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    dependenciaInfo: null;
    jefeInfo: null;
    vacacionesInfo: [];
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}

// Tipo expandido para mostrar solicitudes en la tabla con períodos múltiples
export interface SolicitudExpandida {
  id: number;
  solicitudId: number;
  usuario_id: number;
  periodos_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  periodo: 'Único' | '1' | '2';
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  totalRows: number;
  originalData: SolicitudUsuario;
}

// Interface para la respuesta de la API de solicitudes
export interface ApiResponseSolicitudes {
  ok: boolean;
  msg: string;
  data: SolicitudUsuario[];
  total: number;
}

export interface rechazarSolicitudDto {
  motivo: string;
}

// ==================== APLAZAMIENTOS ====================

// Interfaces para la solicitud de aplazamiento (Usuario)
export interface SolicitudAplazamiento {
  id: number;
  usuario_id: number;
  periodos_id: number;
  vacacion_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_disfrute_actual: string;
  fecha_retorno_actual: string;
  fecha_disfrute_secundario_actual: string | null;
  fecha_retorno_secundario_actual: string | null;
  fecha_disfrute_nueva: string;
  fecha_retorno_nueva: string;
  fecha_disfrute_secundario_nueva: string | null;
  fecha_retorno_secundario_nueva: string | null;
  dias_principal: number;
  dias_secundario: number;
  tipo_aplazamiento?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  historico?: string;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    rol: {
      id: number;
      nombre: string;
      descripcion: string;
    };
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
  };
}

// Tipo expandido para mostrar solicitudes de aplazamiento en la tabla con períodos múltiples (Usuario)
export interface SolicitudAplazamientoExpandida {
  id: number;
  solicitudId: number;
  usuario_id: number;
  vacacion_id: number;
  estado: number;
  fecha_solicitud: string;
  periodo: 'Único' | '1' | '2';
  fecha_inicio_nueva: string;
  fecha_fin_nueva: string;
  dias: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  totalRows: number;
  originalData: SolicitudAplazamiento;
}

// Interface para la respuesta de la API de solicitudes de aplazamiento (Usuario)
export interface ApiResponseSolicitudesAplazamiento {
  ok: boolean;
  msg: string;
  data: SolicitudAplazamiento[];
}

// Interfaces para la solicitud de aplazamiento (Admin)
export interface SolicitudAplazamientoAdmin {
  id: number;
  usuario_id: number;
  periodos_id: number;
  vacacion_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_disfrute_actual: string;
  fecha_retorno_actual: string;
  fecha_disfrute_secundario_actual: string | null;
  fecha_retorno_secundario_actual: string | null;
  fecha_disfrute_nueva: string;
  fecha_retorno_nueva: string;
  fecha_disfrute_secundario_nueva: string | null;
  fecha_retorno_secundario_nueva: string | null;
  dias_principal: number;
  dias_secundario: number;
  tipo_aplazamiento?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  historico?: string;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    planilla?: string | null;
    planilla_analista?: string | null;
    rol: {
      id: number;
      nombre: string;
      descripcion: string;
    };
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
  };
}

// Tipo expandido para mostrar solicitudes de aplazamiento en la tabla con períodos múltiples
export interface SolicitudAplazamientoExpandidaAdmin {
  id: number;
  solicitudId: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_user: string;
  usuario_registro: number;
  vacacion_id: number;
  estado: number;
  fecha_solicitud: string;
  periodo_nombre: string;
  periodo: 'Único' | '1' | '2';
  fecha_inicio_nueva: string;
  fecha_fin_nueva: string;
  dias: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  totalRows: number;
  originalData: SolicitudAplazamientoAdmin;
}

// Interface para la respuesta de la API de solicitudes de aplazamiento (Admin)
export interface ApiResponseSolicitudesAplazamientoAdmin {
  ok: boolean;
  msg: string;
  data: SolicitudAplazamientoAdmin[];
}

// ==================== RECHAZO APLAZAMIENTOS JEFE CB ====================

export interface SolicitudAplazamientoRechazadaJefeCB {
  id: number;
  usuario_id: number;
  periodos_id: number;
  vacacion_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_disfrute_actual: string;
  fecha_retorno_actual: string;
  fecha_disfrute_secundario_actual: string | null;
  fecha_retorno_secundario_actual: string | null;
  fecha_disfrute_nueva: string;
  fecha_retorno_nueva: string;
  fecha_disfrute_secundario_nueva: string | null;
  fecha_retorno_secundario_nueva: string | null;
  dias_principal: number;
  dias_secundario: number;
  tipo_aplazamiento?: string;
  historico?: string;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    registro: number;
    planilla?: string | null;
    planilla_analista?: string | null;
  };
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
    activo: boolean;
  };
}

export interface SolicitudRechazadaJefeCBExpandida {
  id: number;
  solicitudId: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_registro: number;
  vacacion_id: number;
  estado: number;
  fecha_solicitud: string;
  periodo_nombre: string;
  periodo: 'Único' | '1' | '2';
  fecha_inicio_nueva: string;
  fecha_fin_nueva: string;
  dias: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  totalRows: number;
  originalData: SolicitudAplazamientoRechazadaJefeCB;
}

export interface ApiResponseRechazadasJefeCB {
  ok: boolean;
  msg: string;
  data: SolicitudAplazamientoRechazadaJefeCB[];
}

// Interface para la respuesta de períodos
export interface ApiResponsePeriodos {
  ok: boolean;
  msg: string;
  data: Periodo[];
}

// ==================== APROBACIONES ====================

// Interface para solicitud en tabla de aprobación
export interface SolicitudAprobacion {
  id: number;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    registro: number;
  };
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  estado: number;
  historico?: string;
  fecha_inicio_secundario?: string;
  fecha_fin_secundario?: string;
  dias_secundario?: number;
  dias_principal?: number;
  esDelGG?: boolean; // Indica si la solicitud es del Gerente General
}

// Interface para respuesta API de aprobaciones
export interface ApiResponseAprobaciones {
  ok: boolean;
  msg: string;
  data: {
    solicitudes: SolicitudAprobacion[];
    resumen: {
      totalSolicitudes: number;
      pendientes: number;
    };
  };
}

// ==================== CALENDARIO ====================

// Interface para solicitud en calendario
export interface SolicitudBackend {
  id: number;
  usuario_id: number;
  periodos_id: number;
  estado: number;
  observaciones: string;
  fecha_solicitud: string;
  fecha_inicio_principal: string;
  fecha_fin_principal: string;
  dias_principal: number;
  fecha_inicio_secundario?: string;
  fecha_fin_secundario?: string;
  dias_secundario?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    rol_id: number;
    dependencia_id: number;
    ultimo_acceso: string;
    estado: number;
    rol: {
      id: number;
      nombre: string;
      descripcion: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
  };
}

// Interface para respuesta API del calendario
export interface ApiResponseCalendario {
  ok: boolean;
  msg: string;
  data: {
    solicitudes: SolicitudBackend[];
    resumen: {
      totalSolicitudes: number;
      pendientes: number;
      aprobadas: number;
    };
    dependenciasAsCargo: Array<Record<string, unknown>>;
    subordinados: Array<Record<string, unknown>>;
  };
}

// ==================== PROPS DE COMPONENTES ====================

// Props para tablas de datos
export interface UserDataTableProps {
  refreshTrigger?: number;
}

export interface DataTableDependenciasProps {
  refreshTrigger?: number;
}
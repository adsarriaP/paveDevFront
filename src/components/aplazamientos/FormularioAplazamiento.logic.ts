import * as React from 'react';
import { useFestivos } from '@/hooks/useFestivos';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
// DiasHabilesResult is imported from FormularioSolicitud.logic
import { calcularDiasHabiles, contarDiasHabiles, validarFechaInicio } from '@/components/solicitudes/inicio/FormularioSolicitud.logic';

// Función utilitaria pura: parsea "YYYY-MM-DD" como fecha local (evita desfase de zona horaria)
const parseFechaLocal = (fechaString: string): Date => {
  const [year, month, day] = fechaString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Tipo para las vacaciones actuales (del endpoint vacaciones-historico/usuario)
export interface VacacionActual {
  id: number;
  fecha_disfrute: string;
  fecha_retorno: string;
  fecha_disfrute_secundario: string | null;
  fecha_retorno_secundario: string | null;
  diasVacaciones: number;
  diasVacacionesSecundario: number | null;
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
  };
  disfrutado: boolean;
  fecha_causacion: string;
}

// Tipo para las vacaciones pendientes según la respuesta real del API
export interface VacacionPendiente {
  id: number;
  vacacion_original_id: number;
  usuario_id: number;
  periodos_id: number;
  fecha_causacion: string;
  fecha_disfrute: string | null;
  fecha_retorno: string | null;
  fecha_disfrute_secundario: string | null;
  fecha_retorno_secundario: string | null;
  fecha_registro: string;
  movimientos: number;
  motivo_historico: string;
  observaciones: string;
  fecha_archivado: string;
  disfrutado: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuario: {
    id: number;
    nombre: string;
    user: string;
    fecha_causacion_base: string;
    registro: number;
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
  diasVacaciones: number;
  diasVacacionesSecundario: number | null;
  totalDiasVacaciones: number;
  vacacionesDivididas: boolean;
  estaVencido: boolean;
}

// Tipo para un período con sus vacaciones
export interface PeriodoConVacaciones {
  periodoId: number;
  periodoNombre: string;
  vacaciones: VacacionPendiente[];
}

// Tipo para la respuesta completa del API
export interface VacacionesPendientesResponse {
  ok: boolean;
  msg: string;
  data: {
    periodos: PeriodoConVacaciones[];
    totalPendientes: number;
  };
}

// Tipo unificado para trabajar con ambos tipos de vacaciones
export interface VacacionUnificada {
  id: number;
  tipo: 'pendiente' | 'actual';
  fecha_causacion: string;
  fecha_disfrute: string;
  fecha_retorno: string;
  fecha_disfrute_secundario: string | null;
  fecha_retorno_secundario: string | null;
  diasVacaciones: number;
  diasVacacionesSecundario: number | null;
  periodos: {
    id: number;
    nombre: string;
    anio_causacion: number;
  };
  esDividida: boolean;
  diasParaInicio?: number;
  // Campos para aplazamiento parcial
  tipoAplazamientoDisponible: 'completo' | 'solo_principal' | 'solo_secundario';
  diasPartePendiente: number;
  principalPasado: boolean;
  secundarioPasado: boolean;
}

// Payload para el aplazamiento
export interface CreateAplazamientoPayload {
  usuario_id: number;
  vacacion_id: number;
  periodos_id: number;
  fecha_disfrute_nueva: string;
  fecha_retorno_nueva: string;
  fecha_disfrute_secundario_nueva?: string;
  fecha_retorno_secundario_nueva?: string;
  observaciones?: string;
  tipo_aplazamiento?: string;
}

export const useFormularioAplazamiento = () => {

  // Estados para el primer período
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined
  );
  const [fechaFinPrincipal, setFechaFinPrincipal] = React.useState<
    Date | undefined
  >(undefined);

  // Estados para dividir período
  const [dividirPeriodo, setDividirPeriodo] = React.useState(false);

  // Estados para el segundo período
  const [calendarOpen2, setCalendarOpen2] = React.useState(false);
  const [selectedDate2, setSelectedDate2] = React.useState<Date | undefined>(
    undefined
  );
  const [fechaFinSecundario, setFechaFinSecundario] = React.useState<
    Date | undefined
  >(undefined);

  // Estados para los campos de días
  const [diasPeriodo1, setDiasPeriodo1] = React.useState<string>('');
  const [diasPeriodo2, setDiasPeriodo2] = React.useState<string>('');

  // Estados para validación
  const [erroresValidacion, setErroresValidacion] = React.useState<string[]>(
    []
  );
  const [diasTotales, setDiasTotales] = React.useState<number>(0);

  // Estados para loading
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingVacaciones, setLoadingVacaciones] = React.useState(true);
  const [errorCargaVacaciones, setErrorCargaVacaciones] = React.useState<string | null>(null);

  // Estados para datos del sistema
  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);
  const [todasLasVacaciones, setTodasLasVacaciones] = React.useState<VacacionUnificada[]>([]);
  const [vacacionSeleccionada, setVacacionSeleccionada] = React.useState<VacacionUnificada | null>(null);

  // Estados para manejar los años de los calendarios
  const [currentYear1, setCurrentYear1] = React.useState(
    new Date().getFullYear()
  );
  const [currentYear2, setCurrentYear2] = React.useState(
    new Date().getFullYear()
  );

  // Hook para API
  const { get, post } = useApi();

  // Configuración dinámica de años para el calendario
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear; // Año actual (2025)
  const toYear = currentYear + 3; // 3 años adelante (2028)

  // Hooks para festivos - Cargar festivos del año actual y siguiente para el primer período
  const {
    festivos: festivosAnoActual1,
    loading: loadingFestivosAnoActual1,
    error: errorFestivosAnoActual1,
  } = useFestivos(currentYear1);

  const {
    festivos: festivosAnoSiguiente1,
    loading: loadingFestivosAnoSiguiente1,
    error: errorFestivosAnoSiguiente1,
  } = useFestivos(currentYear1 + 1);

  // Hooks para festivos - Cargar festivos del año actual y siguiente para el segundo período
  const {
    festivos: festivosAnoActual2,
    loading: loadingFestivosAnoActual2,
    error: errorFestivosAnoActual2,
  } = useFestivos(currentYear2);

  const {
    festivos: festivosAnoSiguiente2,
    loading: loadingFestivosAnoSiguiente2,
    error: errorFestivosAnoSiguiente2,
  } = useFestivos(currentYear2 + 1);

  // Combinar festivos de ambos años para el primer período
  const festivos1 = React.useMemo(
    () => [...festivosAnoActual1, ...festivosAnoSiguiente1],
    [festivosAnoActual1, festivosAnoSiguiente1]
  );

  // Combinar festivos de ambos años para el segundo período
  const festivos2 = React.useMemo(
    () => [...festivosAnoActual2, ...festivosAnoSiguiente2],
    [festivosAnoActual2, festivosAnoSiguiente2]
  );

  // Estados de carga combinados
  const loadingFestivos1 = loadingFestivosAnoActual1 || loadingFestivosAnoSiguiente1;
  const loadingFestivos2 = loadingFestivosAnoActual2 || loadingFestivosAnoSiguiente2;

  // Estados de error combinados
  const errorFestivos1 = errorFestivosAnoActual1 || errorFestivosAnoSiguiente1;
  const errorFestivos2 = errorFestivosAnoActual2 || errorFestivosAnoSiguiente2;

  // Enriquece cada vacación dividida con los días hábiles reales calculados desde
  // sus fechas de inicio y fin, usando los festivos ya cargados.
  const todasLasVacacionesConDias = React.useMemo(() => {
    if (festivos1.length === 0) return todasLasVacaciones;
    return todasLasVacaciones.map((v) => {
      if (!v.esDividida) return v;
      const dias1 = contarDiasHabiles(
        parseFechaLocal(v.fecha_disfrute),
        parseFechaLocal(v.fecha_retorno),
        festivos1
      );
      const dias2 =
        v.fecha_disfrute_secundario && v.fecha_retorno_secundario
          ? contarDiasHabiles(
              parseFechaLocal(v.fecha_disfrute_secundario),
              parseFechaLocal(v.fecha_retorno_secundario),
              festivos1
            )
          : null;
      return { ...v, diasVacaciones: dias1, diasVacacionesSecundario: dias2 };
    });
  }, [todasLasVacaciones, festivos1]);

  // Vacación seleccionada con días reales calculados
  const vacacionSeleccionadaConDias = React.useMemo(() => {
    if (!vacacionSeleccionada) return null;
    return (
      todasLasVacacionesConDias.find((v) => v.id === vacacionSeleccionada.id) ??
      vacacionSeleccionada
    );
  }, [vacacionSeleccionada, todasLasVacacionesConDias]);

  // ============================
  // EFECTOS
  // ============================

  // Cargar datos iniciales del usuario y vacaciones válidas para aplazamiento
  React.useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Obtener usuario del token
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.id;
          setUsuarioId(userId);

          setLoadingVacaciones(true);
          setErrorCargaVacaciones(null);

          // Usar el nuevo endpoint que retorna solo períodos válidos para aplazar
          const response = await get<{
            ok: boolean;
            msg: string;
            data: {
              periodosValidos: Array<{
                vacacion_id: number;
                periodo_id: number;
                periodo_nombre: string;
                fecha_causacion: string;
                fecha_disfrute: string;
                fecha_retorno: string;
                fecha_disfrute_secundario: string | null;
                fecha_retorno_secundario: string | null;
                fecha_disfrute_mas_temprana: string;
                dias_faltantes: number;
                origen: string;
                mensaje: string;
                tipo_aplazamiento_disponible?: 'completo' | 'solo_principal' | 'solo_secundario';
                dias_parte_pendiente?: number;
                principal_pasado?: boolean;
                secundario_pasado?: boolean;
              }>;
              periodosInvalidos: Array<{
                vacacion_id: number;
                periodo_id: number;
                periodo_nombre: string;
                fecha_causacion: string;
                fecha_disfrute: string;
                fecha_retorno: string;
                fecha_disfrute_secundario: string | null;
                fecha_retorno_secundario: string | null;
                fecha_disfrute_mas_temprana: string;
                dias_faltantes: number;
                origen: string;
                razon: string;
                mensaje: string;
              }>;
              resumen: {
                total: number;
                validos: number;
                invalidos: number;
              };
            };
          }>(`/solicitudes-aplazamiento/periodos-validos/${userId}`);

          console.log('=== RESPUESTA DEL ENDPOINT ===');
          console.log('Response completo:', response);
          console.log('Data:', response.data);
          console.log('Períodos válidos:', response.data?.periodosValidos);

          const vacacionesUnificadas: VacacionUnificada[] = [];

          // Procesar SOLO los períodos válidos del endpoint
          if (response.data && response.data.periodosValidos && Array.isArray(response.data.periodosValidos)) {
            response.data.periodosValidos.forEach((periodo) => {
              // Validar que el período tenga todos los campos requeridos
              if (periodo.vacacion_id && periodo.fecha_disfrute && periodo.fecha_retorno && periodo.periodo_nombre) {
                // Calcular días de vacaciones
                const diasVacaciones = 15; // Por defecto 15 días si no está dividido
                const esDividida = periodo.fecha_disfrute_secundario !== null && periodo.fecha_retorno_secundario !== null;

                const tipoAplaz = periodo.tipo_aplazamiento_disponible || 'completo';
                const diasPendiente = periodo.dias_parte_pendiente || 15;

                vacacionesUnificadas.push({
                  id: periodo.vacacion_id,
                  tipo: 'actual',
                  fecha_causacion: periodo.fecha_causacion,
                  fecha_disfrute: periodo.fecha_disfrute,
                  fecha_retorno: periodo.fecha_retorno,
                  fecha_disfrute_secundario: periodo.fecha_disfrute_secundario,
                  fecha_retorno_secundario: periodo.fecha_retorno_secundario,
                  diasVacaciones: esDividida ? 0 : diasVacaciones,
                  diasVacacionesSecundario: esDividida ? 0 : null,
                  periodos: {
                    id: periodo.periodo_id,
                    nombre: periodo.periodo_nombre,
                    anio_causacion: parseInt(periodo.periodo_nombre.split('-')[0])
                  },
                  esDividida: esDividida,
                  diasParaInicio: periodo.dias_faltantes,
                  tipoAplazamientoDisponible: tipoAplaz,
                  diasPartePendiente: diasPendiente,
                  principalPasado: periodo.principal_pasado || false,
                  secundarioPasado: periodo.secundario_pasado || false,
                });
              } else {
                console.warn('Período inválido encontrado:', periodo);
              }
            });
          }

          // Ordenar por período más antiguo
          const vacacionesOrdenadas = vacacionesUnificadas.sort((a, b) => {
            const yearA = a.periodos?.anio_causacion || 0;
            const yearB = b.periodos?.anio_causacion || 0;
            return yearA - yearB;
          });

          // Marcar solo el periodo más reciente como "actual"
          vacacionesOrdenadas.forEach((vacacion, index) => {
            // El último elemento (más reciente) será "actual", el resto "pendiente"
            vacacion.tipo = index === vacacionesOrdenadas.length - 1 ? 'actual' : 'pendiente';
          });

          setTodasLasVacaciones(vacacionesOrdenadas);

          // Seleccionar el primer período válido si hay alguno
          if (vacacionesOrdenadas.length > 0) {
            setVacacionSeleccionada(vacacionesOrdenadas[0]);
          }
        }
      } catch (error: unknown) {
        console.error('Error cargando períodos válidos:', error);

        // Manejar errores específicos
        const axiosError = error as { response?: { data?: { msg?: string } } };
        if (axiosError?.response?.data?.msg) {
          setErrorCargaVacaciones(axiosError.response.data.msg);
        } else {
          setErrorCargaVacaciones('Error al cargar los períodos disponibles para aplazamiento');
        }

        Notify.failure('Error al cargar los períodos disponibles para aplazamiento');
      } finally {
        setLoadingVacaciones(false);
      }
    };

    cargarDatos();
  }, [get]);

  // Calcular fecha de fin automáticamente en modo simple
  React.useEffect(() => {
    if (!dividirPeriodo && selectedDate && festivos1.length > 0) {
      const diasRequeridos = vacacionSeleccionada?.diasPartePendiente ?? 15;
      const resultado = calcularDiasHabiles(selectedDate, diasRequeridos, festivos1);
      setFechaFinPrincipal(resultado.fechaFin);
      setDiasTotales(diasRequeridos);

      if (!resultado.esValido) {
        setErroresValidacion([
          `Error al calcular ${diasRequeridos} días hábiles desde la fecha seleccionada`,
        ]);
      } else {
        setErroresValidacion([]);
      }
    }
  }, [selectedDate, festivos1, dividirPeriodo, vacacionSeleccionada]);

  // Calcular fechas de fin en modo dividido
  React.useEffect(() => {
    if (dividirPeriodo) {
      const errores: string[] = [];

      // Calcular primer período
      if (selectedDate && diasPeriodo1 && festivos1.length > 0) {
        const dias1 = parseInt(diasPeriodo1);
        if (dias1 > 0) {
          const resultado1 = calcularDiasHabiles(
            selectedDate,
            dias1,
            festivos1
          );
          setFechaFinPrincipal(resultado1.fechaFin);
        }
      }

      // Calcular segundo período
      if (selectedDate2 && diasPeriodo2 && festivos2.length > 0) {
        const dias2 = parseInt(diasPeriodo2);
        if (dias2 > 0) {
          const resultado2 = calcularDiasHabiles(
            selectedDate2,
            dias2,
            festivos2
          );
          setFechaFinSecundario(resultado2.fechaFin);
        }
      }

      // Validar suma de días
      const dias1 = parseInt(diasPeriodo1) || 0;
      const dias2 = parseInt(diasPeriodo2) || 0;
      const total = dias1 + dias2;
      const diasRequeridos = vacacionSeleccionada?.diasPartePendiente ?? 15;

      setDiasTotales(total);

      if (total > diasRequeridos) {
        errores.push(
          `La suma de días (${total}) excede los ${diasRequeridos} días permitidos`
        );
      } else if (total < diasRequeridos && diasPeriodo1 && diasPeriodo2) {
        errores.push(`La suma de días (${total}) debe ser exactamente ${diasRequeridos} días`);
      }

      setErroresValidacion(errores);
    }
  }, [
    selectedDate,
    selectedDate2,
    diasPeriodo1,
    diasPeriodo2,
    festivos1,
    festivos2,
    dividirPeriodo,
  ]);

  // ============================
  // FUNCIONES DE MANEJO
  // ============================

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Función para formatear fechas desde string
  const formatFechaString = (fechaString: string) => {
    return parseFechaLocal(fechaString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDividirPeriodo = (checked: boolean) => {
    // Reset completo del formulario
    setSelectedDate(undefined);
    setSelectedDate2(undefined);
    setFechaFinPrincipal(undefined);
    setFechaFinSecundario(undefined);
    setDiasPeriodo1('');
    setDiasPeriodo2('');
    setCalendarOpen(false);
    setCalendarOpen2(false);
    setErroresValidacion([]);
    setDiasTotales(0);

    setDividirPeriodo(checked);
  };

  const handleDiasPeriodo1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 15)) {
      setDiasPeriodo1(value);
    }
  };

  const handleDiasPeriodo2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 15)) {
      setDiasPeriodo2(value);
    }
  };

  const handleYearChange1 = (year: number) => {
    if (year !== currentYear1) {
      setCurrentYear1(year);
    }
  };

  const handleYearChange2 = (year: number) => {
    if (year !== currentYear2) {
      setCurrentYear2(year);
    }
  };

  const handleVacacionChange = (vacacionId: string) => {
    const vacacion = todasLasVacaciones.find(v => v.id.toString() === vacacionId);
    if (vacacion) {
      setVacacionSeleccionada(vacacion);
      // Reset del formulario cuando cambia la vacación
      setSelectedDate(undefined);
      setSelectedDate2(undefined);
      setFechaFinPrincipal(undefined);
      setFechaFinSecundario(undefined);
      setDividirPeriodo(false);
      setDiasPeriodo1('');
      setDiasPeriodo2('');
      setErroresValidacion([]);
      setDiasTotales(0);
    }
  };

  // Determinar si el aplazamiento es parcial
  const esAplazamientoParcial = vacacionSeleccionada?.tipoAplazamientoDisponible !== 'completo' && vacacionSeleccionada?.tipoAplazamientoDisponible !== undefined;

  // Efecto para configurar el estado inicial cuando se selecciona una vacación.
  // Usa vacacionSeleccionadaConDias para que los días pre-rellenados sean los
  // días hábiles reales calculados desde las fechas (no valores hardcodeados).
  React.useEffect(() => {
    if (vacacionSeleccionadaConDias) {
      const tipoParcial = vacacionSeleccionadaConDias.tipoAplazamientoDisponible;

      // Para aplazamientos parciales: solo un bloque, no dividir
      if (tipoParcial === 'solo_principal' || tipoParcial === 'solo_secundario') {
        setDividirPeriodo(false);
        setDiasTotales(vacacionSeleccionadaConDias.diasPartePendiente);
        // No prellenar fechas - el usuario debe elegir nuevas
        setSelectedDate(undefined);
        setSelectedDate2(undefined);
        setFechaFinPrincipal(undefined);
        setFechaFinSecundario(undefined);
        setDiasPeriodo1('');
        setDiasPeriodo2('');
      } else if (vacacionSeleccionadaConDias.esDividida && vacacionSeleccionadaConDias.fecha_disfrute_secundario && vacacionSeleccionadaConDias.fecha_retorno_secundario) {
        // Dividida completa: configurar checkbox, días Y prellenar fechas
        setDividirPeriodo(true);
        setDiasPeriodo1(vacacionSeleccionadaConDias.diasVacaciones.toString());
        setDiasPeriodo2((vacacionSeleccionadaConDias.diasVacacionesSecundario || 0).toString());
        setDiasTotales(vacacionSeleccionadaConDias.diasVacaciones + (vacacionSeleccionadaConDias.diasVacacionesSecundario || 0));

        if (vacacionSeleccionadaConDias.fecha_disfrute) {
          setSelectedDate(parseFechaLocal(vacacionSeleccionadaConDias.fecha_disfrute));
        }
        if (vacacionSeleccionadaConDias.fecha_retorno) {
          setFechaFinPrincipal(parseFechaLocal(vacacionSeleccionadaConDias.fecha_retorno));
        }
        if (vacacionSeleccionadaConDias.fecha_disfrute_secundario) {
          setSelectedDate2(parseFechaLocal(vacacionSeleccionadaConDias.fecha_disfrute_secundario));
        }
        if (vacacionSeleccionadaConDias.fecha_retorno_secundario) {
          setFechaFinSecundario(parseFechaLocal(vacacionSeleccionadaConDias.fecha_retorno_secundario));
        }
      } else {
        // Para vacaciones no divididas (15 días seguidos), NO prellenar fechas
        setDividirPeriodo(false);
        setDiasTotales(vacacionSeleccionadaConDias.diasVacaciones);
        setSelectedDate(undefined);
        setSelectedDate2(undefined);
        setFechaFinPrincipal(undefined);
        setFechaFinSecundario(undefined);
        setDiasPeriodo1('');
        setDiasPeriodo2('');
      }
    }
  }, [vacacionSeleccionadaConDias]);

  // Validar formulario antes del envío
  const validarFormulario = (): boolean => {
    const errores: string[] = [];

    if (!usuarioId || !vacacionSeleccionada) {
      errores.push(
        'Error del sistema: datos de usuario o vacación no disponibles'
      );
      setErroresValidacion(errores);
      return false;
    }

    if (!selectedDate) {
      errores.push('Debe seleccionar una fecha de inicio principal');
    } else {
      // Validar que la fecha no sea anterior a hoy
      if (!validarFechaInicio(selectedDate)) {
        errores.push('La fecha de inicio no puede ser anterior a hoy');
      }
    }

    if (dividirPeriodo) {
      if (!selectedDate2) {
        errores.push(
          'Debe seleccionar una fecha de inicio para el segundo período'
        );
      } else {
        if (!validarFechaInicio(selectedDate2)) {
          errores.push(
            'La fecha de inicio del segundo período no puede ser anterior a hoy'
          );
        }
      }

      if (!diasPeriodo1 || !diasPeriodo2) {
        errores.push('Debe especificar los días para ambos períodos');
      }

      const total =
        (parseInt(diasPeriodo1) || 0) + (parseInt(diasPeriodo2) || 0);
      const diasRequeridos = vacacionSeleccionada?.diasPartePendiente ?? 15;
      if (total !== diasRequeridos) {
        errores.push(`La suma de días debe ser exactamente ${diasRequeridos}`);
      }
    }

    setErroresValidacion(errores);
    return errores.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      Notify.failure('Por favor corrige los errores antes de enviar');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateAplazamientoPayload = {
        usuario_id: usuarioId!,
        vacacion_id: vacacionSeleccionada!.id,
        periodos_id: vacacionSeleccionada!.periodos.id,
        fecha_disfrute_nueva: selectedDate!.toISOString().split('T')[0],
        fecha_retorno_nueva: fechaFinPrincipal!.toISOString().split('T')[0],
        tipo_aplazamiento: vacacionSeleccionada!.tipoAplazamientoDisponible || 'completo',
      };

      // Agregar fechas secundarias si está dividido (solo aplazamiento completo)
      if (dividirPeriodo && selectedDate2 && fechaFinSecundario) {
        payload.fecha_disfrute_secundario_nueva = selectedDate2
          .toISOString()
          .split('T')[0];
        payload.fecha_retorno_secundario_nueva = fechaFinSecundario
          .toISOString()
          .split('T')[0];
      }

      // Debug: ver datos antes de enviar
      console.log('Vacación seleccionada:', vacacionSeleccionada);
      console.log('Payload a enviar:', payload);

      // Enviar solicitud de aplazamiento
      await post('/solicitudes-aplazamiento', payload);

      Notify.success('Solicitud de aplazamiento enviada exitosamente');

      // Reset formulario
      setSelectedDate(undefined);
      setSelectedDate2(undefined);
      setFechaFinPrincipal(undefined);
      setFechaFinSecundario(undefined);
      setDividirPeriodo(false);
      setDiasPeriodo1('');
      setDiasPeriodo2('');
      setErroresValidacion([]);
      setDiasTotales(0);
    } catch (error) {
      console.error('Error enviando solicitud de aplazamiento:', error);
      Notify.failure('Error al enviar la solicitud de aplazamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLimpiar = () => {
    setSelectedDate(undefined);
    setSelectedDate2(undefined);
    setFechaFinPrincipal(undefined);
    setFechaFinSecundario(undefined);
    setDividirPeriodo(false);
    setDiasPeriodo1('');
    setDiasPeriodo2('');
    setErroresValidacion([]);
    setDiasTotales(0);
  };

  // ============================
  // RETURN DEL HOOK
  // ============================

  return {
    // Estados
    calendarOpen,
    setCalendarOpen,
    selectedDate,
    setSelectedDate,
    fechaFinPrincipal,
    dividirPeriodo,
    calendarOpen2,
    setCalendarOpen2,
    selectedDate2,
    setSelectedDate2,
    fechaFinSecundario,
    diasPeriodo1,
    diasPeriodo2,
    erroresValidacion,
    diasTotales,
    isSubmitting,
    usuarioId,
    currentYear1,
    currentYear2,

    // Estados específicos de aplazamiento
    loadingVacaciones,
    errorCargaVacaciones,
    todasLasVacaciones: todasLasVacacionesConDias,
    vacacionSeleccionada: vacacionSeleccionadaConDias,
    esAplazamientoParcial,

    // Configuración
    fromYear,
    toYear,

    // Estados de festivos
    festivos1,
    loadingFestivos1,
    errorFestivos1,
    festivos2,
    loadingFestivos2,
    errorFestivos2,

    // Funciones
    formatDate,
    formatFechaString,
    handleDividirPeriodo,
    handleDiasPeriodo1Change,
    handleDiasPeriodo2Change,
    handleYearChange1,
    handleYearChange2,
    handleVacacionChange,
    handleSubmit,
    handleLimpiar,
  };
};
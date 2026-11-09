import * as React from 'react';
import { useFestivos } from '@/hooks/useFestivos';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import type {
  PeriodoActivo,
  DiasHabilesResult,
  UpdateSolicitudPayload,
  SolicitudUsuario,
} from '@/types/entities.types';

// ============================
// UTILIDADES DE DÍAS HÁBILES
// ============================

export const calcularDiasHabiles = (
  fechaInicio: Date,
  cantidadDias: number,
  festivos: string[]
): DiasHabilesResult => {
  if (cantidadDias <= 0) {
    return {
      fechaFin: fechaInicio,
      diasContados: 0,
      esValido: false,
      diasNoHabiles: [],
    };
  }

  const fechaActual = new Date(fechaInicio);
  const diasNoHabiles: string[] = [];
  let diasHabilesContados = 0;

  // El primer día (fecha de inicio) cuenta como día 1
  diasHabilesContados = 1;

  while (diasHabilesContados < cantidadDias) {
    fechaActual.setDate(fechaActual.getDate() + 1);
    const fechaStr = fechaActual.toISOString().split('T')[0]; // YYYY-MM-DD
    const diaSemana = fechaActual.getDay(); // 0 = domingo, 6 = sábado

    // Verificar si es fin de semana
    if (diaSemana === 0 || diaSemana === 6) {
      diasNoHabiles.push(`${fechaStr} (fin de semana)`);
      continue;
    }

    // Verificar si es festivo
    if (festivos.includes(fechaStr)) {
      diasNoHabiles.push(`${fechaStr} (festivo)`);
      continue;
    }

    // Es día hábil
    diasHabilesContados++;
  }

  return {
    fechaFin: new Date(fechaActual),
    diasContados: diasHabilesContados,
    esValido: diasHabilesContados === cantidadDias,
    diasNoHabiles,
  };
};

export const validarFechaInicio = (fecha: Date): boolean => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaValidar = new Date(fecha);
  fechaValidar.setHours(0, 0, 0, 0);

  return fechaValidar >= hoy;
};

// ============================
// INTERFACES
// ============================

export interface EditarSolicitudFormProps {
  solicitud: SolicitudUsuario;
  onCancel: () => void;
  onSuccess: () => void;
}

// ============================
// CUSTOM HOOK
// ============================

export const useEditarSolicitudForm = (
  solicitud: SolicitudUsuario,
  onCancel: () => void,
  onSuccess: () => void
) => {
  // Estados para el primer período
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    solicitud.fecha_inicio_principal
      ? new Date(solicitud.fecha_inicio_principal + 'T00:00:00')
      : undefined
  );
  const [fechaFinPrincipal, setFechaFinPrincipal] = React.useState<
    Date | undefined
  >(
    solicitud.fecha_fin_principal
      ? new Date(solicitud.fecha_fin_principal + 'T00:00:00')
      : undefined
  );

  // Estados para dividir período
  const [dividirPeriodo, setDividirPeriodo] = React.useState(
    Boolean(solicitud.fecha_inicio_secundario)
  );

  // Estados para el segundo período
  const [calendarOpen2, setCalendarOpen2] = React.useState(false);
  const [selectedDate2, setSelectedDate2] = React.useState<Date | undefined>(
    solicitud.fecha_inicio_secundario
      ? new Date(solicitud.fecha_inicio_secundario + 'T00:00:00')
      : undefined
  );
  const [fechaFinSecundario, setFechaFinSecundario] = React.useState<
    Date | undefined
  >(
    solicitud.fecha_fin_secundario
      ? new Date(solicitud.fecha_fin_secundario + 'T00:00:00')
      : undefined
  );

  // Estados para los campos de días
  const [diasPeriodo1, setDiasPeriodo1] = React.useState<string>(
    solicitud.dias_principal?.toString() || '15'
  );
  const [diasPeriodo2, setDiasPeriodo2] = React.useState<string>(
    solicitud.dias_secundario?.toString() || ''
  );

  // Estados para validación
  const [erroresValidacion, setErroresValidacion] = React.useState<string[]>(
    []
  );
  const [diasTotales, setDiasTotales] = React.useState<number>(
    solicitud.dias_principal + (solicitud.dias_secundario || 0)
  );

  // Estados para loading
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingPeriodo, setLoadingPeriodo] = React.useState(false);

  // Estados para datos del sistema
  const [periodoActivo, setPeriodoActivo] =
    React.useState<PeriodoActivo | null>(null);
  const [usuarioId] = React.useState<number>(solicitud.usuario_id);

  // Estados para manejar los años de los calendarios
  const [currentYear1, setCurrentYear1] = React.useState(
    new Date(solicitud.fecha_inicio_principal).getFullYear()
  );
  const [currentYear2, setCurrentYear2] = React.useState(
    solicitud.fecha_inicio_secundario
      ? new Date(solicitud.fecha_inicio_secundario).getFullYear()
      : new Date().getFullYear()
  );

  // Hook para API
  const { get, patch } = useApi();

  // Configuración dinámica de años para el calendario
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear + 1;
  const toYear = currentYear + 3;

  // Hooks para festivos
  const {
    festivos: festivos1,
    loading: loadingFestivos1,
    error: errorFestivos1,
  } = useFestivos(currentYear1);

  const {
    festivos: festivos2,
    loading: loadingFestivos2,
    error: errorFestivos2,
  } = useFestivos(currentYear2);

  // ============================
  // EFECTOS
  // ============================

  // Cargar datos iniciales del período
  React.useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoadingPeriodo(true);
        // Obtener período activo
        const periodo = await get<PeriodoActivo>('/periodos-acceso/activo');
        setPeriodoActivo(periodo);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        Notify.failure('Error al cargar información del sistema');
      } finally {
        setLoadingPeriodo(false);
      }
    };

    cargarDatosIniciales();
  }, [get]);

  // Calcular fecha de fin automáticamente en modo simple
  React.useEffect(() => {
    if (!dividirPeriodo && selectedDate && festivos1.length > 0) {
      const resultado = calcularDiasHabiles(selectedDate, 15, festivos1);
      setFechaFinPrincipal(resultado.fechaFin);
      setDiasTotales(15);

      if (!resultado.esValido) {
        setErroresValidacion([
          'Error al calcular 15 días hábiles desde la fecha seleccionada',
        ]);
      } else {
        setErroresValidacion([]);
      }
    }
  }, [selectedDate, festivos1, dividirPeriodo]);

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

      setDiasTotales(total);

      if (total > 15) {
        errores.push(
          `La suma de días (${total}) excede los 15 días permitidos`
        );
      } else if (total < 15 && diasPeriodo1 && diasPeriodo2) {
        errores.push(`La suma de días (${total}) debe ser exactamente 15 días`);
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

  const handleDividirPeriodo = (checked: boolean) => {
    // Reset completo del formulario similar a FormularioSolicitud
    setSelectedDate(
      solicitud.fecha_inicio_principal
        ? new Date(solicitud.fecha_inicio_principal + 'T00:00:00')
        : undefined
    );
    setSelectedDate2(undefined);
    setFechaFinPrincipal(undefined);
    setFechaFinSecundario(undefined);
    setDiasPeriodo1(checked ? '' : '15');
    setDiasPeriodo2('');
    setCalendarOpen(false);
    setCalendarOpen2(false);
    setErroresValidacion([]);
    setDiasTotales(checked ? 0 : 15);

    setDividirPeriodo(checked);

    // Solo restaurar datos de segundo período si se está activando dividir período
    // y la solicitud original tenía segundo período
    if (checked && solicitud.fecha_inicio_secundario) {
      setSelectedDate2(
        new Date(solicitud.fecha_inicio_secundario + 'T00:00:00')
      );
      setFechaFinSecundario(
        solicitud.fecha_fin_secundario
          ? new Date(solicitud.fecha_fin_secundario + 'T00:00:00')
          : undefined
      );
      setDiasPeriodo1(solicitud.dias_principal?.toString() || '');
      setDiasPeriodo2(solicitud.dias_secundario?.toString() || '');
    }
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

  // Validar formulario antes del envío
  const validarFormulario = (): boolean => {
    const errores: string[] = [];

    if (!usuarioId || !periodoActivo) {
      errores.push(
        'Error del sistema: datos de usuario o período no disponibles'
      );
      setErroresValidacion(errores);
      return false;
    }

    if (!selectedDate) {
      errores.push('Debe seleccionar una fecha de inicio principal');
    } else if (!validarFechaInicio(selectedDate)) {
      errores.push('La fecha de inicio no puede ser anterior a hoy');
    }

    if (dividirPeriodo) {
      if (!selectedDate2) {
        errores.push(
          'Debe seleccionar una fecha de inicio para el segundo período'
        );
      } else if (!validarFechaInicio(selectedDate2)) {
        errores.push(
          'La fecha de inicio del segundo período no puede ser anterior a hoy'
        );
      }

      if (!diasPeriodo1 || !diasPeriodo2) {
        errores.push('Debe especificar los días para ambos períodos');
      }

      const total =
        (parseInt(diasPeriodo1) || 0) + (parseInt(diasPeriodo2) || 0);
      if (total !== 15) {
        errores.push('La suma de días debe ser exactamente 15');
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
      const payload: UpdateSolicitudPayload = {
        fecha_inicio_principal: selectedDate!.toISOString().split('T')[0],
        fecha_fin_principal: fechaFinPrincipal!.toISOString().split('T')[0],
        observaciones: dividirPeriodo
          ? `Período dividido: ${diasPeriodo1} + ${diasPeriodo2} días`
          : 'Período completo de 15 días hábiles',
      };

      // Agregar fechas secundarias si está dividido
      if (dividirPeriodo && selectedDate2 && fechaFinSecundario) {
        payload.fecha_inicio_secundario = selectedDate2
          .toISOString()
          .split('T')[0];
        payload.fecha_fin_secundario = fechaFinSecundario
          .toISOString()
          .split('T')[0];
      } else {
        // Limpiar campos secundarios si no está dividido - enviar null explícitamente
        payload.fecha_inicio_secundario = null;
        payload.fecha_fin_secundario = null;
      }

      // Debug: Mostrar el payload que se va a enviar
      console.log('Payload a enviar:', payload);
      console.log('Dividir período:', dividirPeriodo);
      console.log('Solicitud original:', solicitud);

      // Enviar actualización
      await patch(`/solicitudes/${solicitud.id}`, payload);

      Notify.success('Solicitud actualizada exitosamente');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error actualizando solicitud:', error);
      const err = error as { response?: { data?: unknown; status?: number } };
      console.error('Response data:', err?.response?.data);
      console.error('Response status:', err?.response?.status);

      // Mostrar mensaje de error más específico
      const errorMessage =
        (err?.response?.data as { message?: string; msg?: string })?.message ||
        (err?.response?.data as { message?: string; msg?: string })?.msg ||
        'Error desconocido al actualizar la solicitud';
      Notify.failure(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
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
    loadingPeriodo,
    periodoActivo,
    usuarioId,
    currentYear1,
    currentYear2,
    
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
    handleDividirPeriodo,
    handleDiasPeriodo1Change,
    handleDiasPeriodo2Change,
    handleYearChange1,
    handleYearChange2,
    handleSubmit,
    onCancel,
  };
};
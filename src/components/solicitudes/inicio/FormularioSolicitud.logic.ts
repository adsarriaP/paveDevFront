import * as React from 'react';
import { useFestivos } from '@/hooks/useFestivos';
import { useApi } from '@/hooks/useApi';
import { usePeriodoActivo } from '@/hooks/usePeriodoActivo';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import type {
  CreateSolicitudPayload,
  DiasHabilesResult,
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

// Cuenta los días hábiles entre dos fechas (inclusive en ambos extremos).
// Usa la misma lógica que calcularDiasHabiles: excluye fines de semana y festivos.
export const contarDiasHabiles = (
  fechaInicio: Date,
  fechaFin: Date,
  festivos: string[]
): number => {
  if (fechaFin < fechaInicio) return 0;

  const fechaActual = new Date(fechaInicio);
  let diasContados = 0;

  while (fechaActual <= fechaFin) {
    const fechaStr = fechaActual.toISOString().split('T')[0];
    const diaSemana = fechaActual.getDay();

    if (diaSemana !== 0 && diaSemana !== 6 && !festivos.includes(fechaStr)) {
      diasContados++;
    }

    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return diasContados;
};

export const validarFechaInicio = (fecha: Date): boolean => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaValidar = new Date(fecha);
  fechaValidar.setHours(0, 0, 0, 0);

  return fechaValidar >= hoy;
};

// ============================
// CUSTOM HOOK
// ============================

export const useFormularioSolicitud = () => {
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

  // Estados para datos del sistema
  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);
  const { periodo: periodoActivo, loading: loadingPeriodo } = usePeriodoActivo();

  // Estados para manejar los años de los calendarios
  const [currentYear1, setCurrentYear1] = React.useState(
    new Date().getFullYear() + 1
  );
  const [currentYear2, setCurrentYear2] = React.useState(
    new Date().getFullYear() + 1
  );

  // Hooks para API
  const { post } = useApi();

  // Configuración dinámica de años para el calendario
  const currentYear = new Date().getFullYear();
  const fromYear = currentYear + 1;
  const toYear = currentYear + 3;

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

  // ============================
  // EFECTOS
  // ============================

  // Cargar datos iniciales del usuario
  React.useEffect(() => {
    const cargarUsuario = async () => {
      try {
        // Obtener usuario del token
        const token = localStorage.getItem('token');
        if (token) {
          // Decodificar token para obtener el ID del usuario
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUsuarioId(payload.id);
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        Notify.failure('Error al cargar información del usuario');
      }
    };

    cargarUsuario();
  }, []);

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
      console.log('Estados al momento del submit:', {
        usuarioId,
        periodoActivo,
        periodoActivoId: periodoActivo?.id
      });

      const payload: CreateSolicitudPayload = {
        usuario_id: usuarioId!,
        periodo_id: periodoActivo!.id,
        fecha_inicio_principal: selectedDate!.toISOString().split('T')[0],
        fecha_fin_principal: fechaFinPrincipal!.toISOString().split('T')[0],
      };

      // Agregar fechas secundarias si está dividido
      if (dividirPeriodo && selectedDate2 && fechaFinSecundario) {
        payload.fecha_inicio_secundario = selectedDate2
          .toISOString()
          .split('T')[0];
        payload.fecha_fin_secundario = fechaFinSecundario
          .toISOString()
          .split('T')[0];
      }

      // Log del payload antes de enviar
      console.log('Payload a enviar:', payload);

      // Validación adicional del payload
      if (!payload.usuario_id || !payload.periodo_id || !payload.fecha_inicio_principal || !payload.fecha_fin_principal) {
        console.error('Payload incompleto:', {
          usuario_id: payload.usuario_id,
          periodo_id: payload.periodo_id,
          fecha_inicio_principal: payload.fecha_inicio_principal,
          fecha_fin_principal: payload.fecha_fin_principal
        });
        throw new Error('Datos incompletos para enviar la solicitud');
      }

      // Enviar solicitud
      await post('/solicitudes', payload);

      Notify.success('Solicitud enviada exitosamente');

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
      console.error('Error enviando solicitud:', error);
      // El hook useApi ya maneja el error con Notify
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
    handleLimpiar,
  };
};
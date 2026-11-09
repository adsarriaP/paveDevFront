/**
 * @file SignInCard
 * @description Esta página está encargada de hacer la validación y autenticación del login, además de la petición POST al backend
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { loginSuccess } from '@/store/slices/authSlice';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { PeriodoAcceso } from '@/types/entities.types';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

interface PeriodoError {
  message?: string;
  periodoActivo?: {
    fecha_inicio: string;
    fecha_fin: string;
    nombre?: string;
    permitir_fines_semana?: boolean;
  };
  razones?: Array<{
    motivo: string;
    descripcion?: string;
  }>;
}

export function EmcaliIcon() {
  return (
    <img
      src="/images/logo-emcali.webp"
      alt="Emcali Icon"
      className="h-[100px] w-[250px] mx-auto block"
    />
  );
}

type SignInCardProps = React.ComponentProps<typeof Card>;

export default function SignInCard({ className, ...props }: SignInCardProps) {
  const [userError, setUserError] = React.useState(false);
  const [userErrorMessage, setUserErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { get } = useApi();

  const validateInputs = () => {
    const user = document.getElementById('user') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!user.value || user.value.trim() === '') {
      setUserError(true);
      setUserErrorMessage('Ingrese un usuario válido.');
      isValid = false;
    } else {
      setUserError(false);
      setUserErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(
        'La contraseña debe tener al menos 6 caracteres.'
      );
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    const user = (document.getElementById('user') as HTMLInputElement).value;
    const data = {
      user,
      password: (document.getElementById('password') as HTMLInputElement).value,
    };

    try {
      const response = await axios.post(`${baseUrl}/auth/login`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const token = response.data.token || response.data.access_token;
      const userData = response.data.user;

      if (!token || !userData) {
        console.error('Formato de respuesta inválido:', response.data);
        Notify.failure('Error: Formato de respuesta del servidor inválido');
        return;
      }

      // Obtener el periodo de acceso activo mediante el endpoint público
      let periodoAcceso = null;
      try {
        periodoAcceso = await get<PeriodoAcceso>(
          '/periodos-acceso/publico/fechas-activo'
        );
        console.log('📅 Periodo de acceso obtenido:', periodoAcceso);
      } catch (error) {
        console.error('Error obteniendo período activo:', error);
      }

      // Guardamos en Redux - ahora esJefe viene como número del backend
      dispatch(
        loginSuccess({
          token,
          user: {
            ...userData,
            esJefe: userData.esJefe || 0, // Asegurar que sea 0 si no viene
          },
          periodoAcceso,
        })
      );

      // Guardamos en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('rol', userData.rol);
      localStorage.setItem('esJefe', userData.esJefe?.toString() || '0'); // Convertir a string para localStorage
      if (periodoAcceso) {
        localStorage.setItem('periodoAcceso', JSON.stringify(periodoAcceso));
      } else {
        localStorage.removeItem('periodoAcceso');
      }

      // ⭐ NUEVA LÍNEA: Establecer flag para mostrar alerta de bienvenida
      sessionStorage.setItem('justLoggedIn', 'true');

      // Mostrar mensaje de éxito
      Notify.success(`¡Bienvenido ${userData.nombre}!`);

      // Redirigir a todos los usuarios a la misma página
      navigate('/inicio');
    } catch (error: unknown) {
      setIsLoading(false);
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('Detalles del error:', axiosError?.response?.data);

      // 🆕 MANEJO ESPECÍFICO DE ERRORES DE PERÍODO (solo con notiflix)
      const errorResponse = axiosError?.response;
      if (
        errorResponse?.status === 403 &&
        (errorResponse?.data as PeriodoError)?.periodoActivo !== undefined
      ) {
        const periodoData = errorResponse.data as PeriodoError;

        // Crear mensaje detallado para notiflix
        let mensajePeriodo =
          periodoData.message || 'Acceso no permitido en este momento';

        if (periodoData.periodoActivo) {
          const periodo = periodoData.periodoActivo;
          const fechaInicio = new Date(periodo.fecha_inicio).toLocaleDateString(
            'es-CO'
          );
          const fechaFin = new Date(periodo.fecha_fin).toLocaleDateString(
            'es-CO'
          );

          mensajePeriodo += `\n\nPeríodo vigente: ${periodo.nombre}`;
          mensajePeriodo += `\nVigencia: ${fechaInicio} - ${fechaFin}`;
          mensajePeriodo += `\nDías permitidos: ${periodo.permitir_fines_semana ? 'Todos los días' : 'Solo días laborales (L-V)'}`;
        }

        if (periodoData.razones && periodoData.razones.length > 0) {
          mensajePeriodo += `\n\nRazón: ${periodoData.razones.join(', ')}`;
        }

        mensajePeriodo += '\n\nContacte al administrador para más información.';

        Notify.failure(mensajePeriodo);
        return;
      }

      // Manejo de otros errores (mantener lógica original)
      let errorMessage =
        'Ocurrió un error inesperado. Por favor, intente nuevamente.';

      if (errorResponse?.data) {
        const data = errorResponse.data as { message?: string | string[]; error?: string; msg?: string };
        errorMessage =
          (Array.isArray(data.message) ? data.message[0] : data.message) || // Si es array o directo
          data.error || // Error alternativo
          data.msg || // Posible estructura alternativa
          errorMessage; // Fallback
      } else if ((error as Error)?.message) {
        errorMessage = (error as Error).message;
      }

      Notify.failure(errorMessage);
    }
  };

  return (
    <Card
      className={`flex flex-col self-center w-full p-6 gap-4 sm:w-[450px] 
      shadow-[hsla(220,30%,5%,0.05)_0px_5px_15px_0px,hsla(220,25%,10%,0.05)_0px_15px_35px_-5px]
      dark:shadow-[hsla(220,30%,5%,0.5)_0px_5px_15px_0px,hsla(220,25%,10%,0.08)_0px_15px_35px_-5px]
      ${className || ''}`}
      {...props}
    >
      <EmcaliIcon />

      <h1 className="w-full text-center text-[clamp(2rem,10vw,2.15rem)] font-bold">
        Iniciar Sesión
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
        <div className="grid gap-2">
          <Label htmlFor="user">Usuario</Label>
          <Input
            id="user"
            type="text"
            placeholder="Ingrese su usuario"
            className={userError ? 'border-red-500' : ''}
          />
          {userError && (
            <p className="text-sm text-red-500">{userErrorMessage}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              className={passwordError ? 'border-red-500' : ''}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {passwordError && (
            <p className="text-sm text-red-500">{passwordErrorMessage}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gray-800 hover:bg-gray-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </form>
    </Card>
  );
}

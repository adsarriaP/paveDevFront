// src/pages/login/SignInSide.tsx
/**
 * @file SignInSide
 * @description este componente importa y utiliza los componentes "content" y "SignInCard" y es el componente que se llama para hacer de todo el login
 */

import { useState, useEffect } from 'react';
import SignInCard from './SignInCard';
import Content from './Content';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CircleAlert } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { PeriodoAcceso } from '@/types/entities.types';

export default function SignInSide() {
  const [showAlert, setShowAlert] = useState(false);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcceso | null>(
    null
  );
  const { get } = useApi();

  // Función para obtener las fechas del período activo (ENDPOINT PÚBLICO)
  const obtenerPeriodoActivo = async () => {
    try {
      const periodo = await get<PeriodoAcceso>(
        '/periodos-acceso/publico/fechas-activo'
      );
      setPeriodoActivo(periodo);
    } catch (error) {
      console.error('Error obteniendo período activo:', error);
      // Si hay error, mantener null para mostrar fechas por defecto
    }
  };

  // Función para formatear fecha a DD/MM/YY
  const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '00/00/00';

    try {
      const fechaObj = new Date(fecha);
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const año = fechaObj.getFullYear().toString().slice(-2);
      return `${dia}/${mes}/${año}`;
    } catch {
      return '00/00/00';
    }
  };

  // Mostrar el alert automáticamente cuando se monta el componente
  useEffect(() => {
    setShowAlert(true);
    obtenerPeriodoActivo(); // Obtener las fechas del período activo

    // 🌞 FORZAR MODO CLARO - Desactivar modo oscuro en login
    document.documentElement.classList.remove('dark');
    console.log('Modo oscuro desactivado en página de login');

    // 🌿 FONDO MINIMALISTA - Verde casi imperceptible
    const applyMinimalistGreenBackground = () => {
      // Limpiar efectos anteriores
      document
        .querySelectorAll(
          '.green-effects-layer, .exaggerated-overlay, .subtle-pattern, .moderate-green-pattern, .pastel-pattern'
        )
        .forEach((el) => el.remove());

      // FONDO PRINCIPAL - Verde minimalista
      document.documentElement.style.setProperty(
        'background',
        `
  linear-gradient(180deg, 
    #E6EBE6 0%,      
    #F5FFF5 31%,     
    #E3FAE3 78%,    
    #FFFFFF 100%     
  )`,
        'important'
      );

      document.documentElement.style.setProperty(
        'background-size',
        '100% 100%',
        'important'
      );
      document.documentElement.style.setProperty(
        'background-attachment',
        'fixed',
        'important'
      );
      document.documentElement.style.setProperty(
        'background-repeat',
        'no-repeat',
        'important'
      );
      document.documentElement.style.setProperty(
        'min-height',
        '100vh',
        'important'
      );

      // BODY TRANSPARENTE
      document.body.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty(
        'background-color',
        'transparent',
        'important'
      );

      // SIN PATRÓN - Completamente limpio
    };

    applyMinimalistGreenBackground();

    // 🧹 CLEANUP - Restaurar el tema cuando se desmonte el componente
    return () => {
      // Restaurar el tema guardado en localStorage al salir del login
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        console.log('Modo oscuro restaurado al salir del login');
      }

      // Limpiar estilos del fondo
      document.documentElement.style.removeProperty('background');
      document.documentElement.style.removeProperty('background-size');
      document.documentElement.style.removeProperty('background-attachment');
      document.documentElement.style.removeProperty('background-repeat');
      document.documentElement.style.removeProperty('min-height');
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('background-color');
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col section-glass">
      {/* Background Pattern para efecto glass */}
      <div className="absolute inset-0 bg-grid-gray-100/50 bg-[size:60px_60px] opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80" />

      <img
        src="/images/PajaroEMCALIcolor.png"
        alt="Background Image Color"
        className="absolute top-[20%] right-0 transform -translate-y-1/2 w-200 opacity-8 z-0 object-contain"
      />

      <img
        src="/images/PajaroEMCALIcolor (2).png"
        alt="Background Image Color"
        className="absolute top-[51%] left transform -translate-y-1/2 w-230 opacity-7 z-0 object-contain"
      />

      {/* Contenido principal */}
      <main className="relative flex flex-col justify-center flex-grow z-30">
        <div className="flex flex-col justify-center gap-6 sm:gap-12 p-2 sm:p-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-center gap-6 sm:gap-12">
            {/* Cambiar el orden en pantallas pequeñas */}
            <Content className="md:order-1 order-2 z-1" />
            <SignInCard className="md:order-2 order-1 z-1" />
          </div>
        </div>
      </main>

      {/* Alert Dialog que se muestra automáticamente */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-4xl md:text-5xl font-bold mb-4 leading-tight text-green-700">
              <span className="flex items-center gap-2">
                <CircleAlert className="w-10 h-10 md:w-12 md:h-12" />
                Importante
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Podrá hacer la planeación de sus próximas vacaciones únicamente
              dentro del siguiente rango de fechas:{' '}
              <strong>
                {periodoActivo &&
                periodoActivo.fecha_inicio &&
                periodoActivo.fecha_fin
                  ? `${formatearFecha(periodoActivo.fecha_inicio)} - ${formatearFecha(periodoActivo.fecha_fin)}`
                  : '00/00/00 - 00/00/00'}
              </strong>{' '}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

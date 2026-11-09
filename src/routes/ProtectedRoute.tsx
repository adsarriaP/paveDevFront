// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isRouteDisabled } from "@/components/layouts/AppSidebar";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiresManager?: boolean;
  requiresEither?: boolean; // Si es true, permite acceso si tiene rol O es jefe
  requiresPeriodoActivo?: boolean; // Si es true, requiere estar dentro del periodo de acceso
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiresManager = false,
  requiresPeriodoActivo = false,
}) => {
  const location = useLocation();
  const userStr = localStorage.getItem("user") || "{}";
  const user = JSON.parse(userStr);
  const userRole = user?.rol;

  // Simplificado: verificamos directamente el número que viene del backend
  const isManager =
    user?.esJefe === 1 || localStorage.getItem("esJefe") === "1";

  // Verificar periodo de acceso
  const periodoAccesoStr = localStorage.getItem("periodoAcceso");
  const periodoAcceso = periodoAccesoStr ? JSON.parse(periodoAccesoStr) : null;

  const isDentroDePeriodo = React.useMemo(() => {
    // Si no hay periodo definido, no está dentro del periodo
    if (!periodoAcceso) return false;

    const fechaActual = new Date();
    const fechaInicio = new Date(periodoAcceso.fecha_inicio);
    const fechaFin = new Date(periodoAcceso.fecha_fin);

    // Retorna true si estamos dentro de las fechas
    return fechaActual >= fechaInicio && fechaActual <= fechaFin;
  }, [periodoAcceso]);

  // Si no está autenticado, redirigir al login
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // Si la ruta pertenece a un grupo con disabled: true en AppSidebar, bloquear acceso para todos los roles
  if (isRouteDisabled(location.pathname)) {
    const fallbackRoute =
      isDentroDePeriodo || userRole === "ADMINISTRADOR"
        ? "/inicio"
        : "/solicitudes";
    return <Navigate to={fallbackRoute} replace />;
  }

  // Si requiere periodo activo y NO está dentro del periodo (excepto ADMINISTRADOR)
  if (requiresPeriodoActivo && !isDentroDePeriodo && userRole !== "ADMINISTRADOR") {
    return <Navigate to="/solicitudes" replace />;
  }

  // ADMIN siempre tiene acceso a todo
  if (userRole === "ADMINISTRADOR") {
    return <>{children}</>;
  }

  // Si requiere ser jefe Y no lo es (excepto para JEFE_CB que ignora esta validación)
  if (requiresManager && !isManager && userRole !== "JEFE_CB") {
    return <Navigate to="/inicio" replace />;
  }

  // Si requiere rol específico Y no lo tiene, redirigir
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/inicio" replace />;
  }

  // Si ha pasado todas las validaciones, permitir acceso
  return <>{children}</>;
};

export default ProtectedRoute;

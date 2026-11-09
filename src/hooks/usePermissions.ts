// src/hooks/usePermissions.ts
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.rol === "ADMINISTRADOR";
  const isNormalUser = user?.rol === "USUARIO";

  // Simplificado: verificamos directamente el número del backend
  const isManager = user?.esJefe === 1;

  // Función genérica para verificar permisos
  const hasPermission = (
    requiredRoles: string[] = [],
    requiresManager: boolean = false
  ): boolean => {
    // Admin siempre tiene permisos
    if (isAdmin) return true;

    // Si requiere ser jefe y no lo es, no tiene permiso
    if (requiresManager && !isManager) return false;

    // Si se requieren roles específicos y no los tiene, no tiene permiso
    if (requiredRoles.length > 0 && !requiredRoles.includes(user?.rol || "")) {
      return false;
    }

    return true;
  };

  return {
    isAdmin,
    isNormalUser,
    isManager,
    hasPermission,
    // Funciones específicas para verificaciones comunes
    canAccessJefeRoutes: isAdmin || (isNormalUser && isManager),
    canApproveRequests: isAdmin || (isNormalUser && isManager),
    canViewTeamCalendar: isAdmin || (isNormalUser && isManager),
    canExportData: isAdmin,
    canManageUsers: isAdmin,
  };
};

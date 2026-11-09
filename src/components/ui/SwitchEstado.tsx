// src/components/ui/SwitchEstado.tsx
/**
 * @file SwitchEstado.tsx
 * @description Componente reutilizable para cambiar el estado de entidades (usuarios, dependencias, etc.)
 * @author Tu Proyecto
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { useApi } from "@/hooks/useApi";
import { Notify } from "notiflix/build/notiflix-notify-aio";

// Tipos del componente
interface SwitchEstadoProps {
  id: number | string;
  estado: number; // 0 = inactivo, 1 = activo
  entityName: string; // "usuario", "dependencia", etc.
  endpoint: string; // "usuarios", "dependencias", etc.
  itemName?: string; // Nombre específico del item (opcional para mensajes más descriptivos)
  onToggleSuccess?: (id: number | string, newState: number) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  customUrl?: string; // URL personalizada opcional (si se proporciona, ignora endpoint/id)
}

// Componente Switch visual personalizado (sin dependencias externas)
const CustomSwitch = ({
  checked,
  onCheckedChange,
  disabled = false,
  size = "default",
  className = "",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    default: "w-11 h-6",
    lg: "w-14 h-8",
  };

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    default: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const translateClasses = {
    sm: checked ? "translate-x-4" : "translate-x-0",
    default: checked ? "translate-x-5" : "translate-x-0",
    lg: checked ? "translate-x-6" : "translate-x-0",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${checked ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <span
        className={`
          ${thumbSizeClasses[size]}
          pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
          transition duration-200 ease-in-out
          ${translateClasses[size]}
        `}
      />
    </button>
  );
};

export function SwitchEstado({
  id,
  estado = 1,
  entityName,
  endpoint,
  itemName,
  onToggleSuccess,
  disabled = false,
  size = "default",
  className = "",
  customUrl,
}: SwitchEstadoProps) {
  const [isEnabled, setIsEnabled] = useState(estado === 1);
  const [open, setOpen] = useState(false);
  const [pendingState, setPendingState] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { patch } = useApi();

  // Sincronizar el estado interno cuando cambie la prop estado
  useEffect(() => {
    setIsEnabled(estado === 1);
  }, [estado]);

  const handleSwitchClick = () => {
    if (disabled) return;
    setPendingState(!isEnabled);
    setOpen(true);
  };

  const toggleState = async () => {
    try {
      setIsProcessing(true);

      // Construir la URL del endpoint: usar customUrl si está disponible, sino usar la ruta por defecto
      const url = customUrl || `/${endpoint}/${id}/toggle-estado`;

      // Hacer la petición PATCH
      await patch(url, {});

      // Actualizar el estado local
      setIsEnabled(!isEnabled);

      // Mostrar mensaje de éxito
      const actionText = isEnabled ? "desactivado" : "activado";
      const capitalizedEntity =
        entityName.charAt(0).toUpperCase() + entityName.slice(1);
      Notify.success(`${capitalizedEntity} ${actionText} exitosamente`);

      // Llamar al callback si existe
      if (onToggleSuccess) {
        const newState = isEnabled ? 0 : 1;
        onToggleSuccess(id, newState);
      }

      setOpen(false);
    } catch (error: unknown) {
      console.error(`Error al cambiar el estado del ${entityName}:`, error);

      type ApiErr = { response?: { data?: { message?: string; error?: string; msg?: string } }; message?: string };
      const apiError = error as ApiErr;
      // Mejorar la captura del mensaje de error
      let errorMessage = `Error al ${isEnabled ? "desactivar" : "activar"} el ${entityName}`;

      if (apiError.response?.data) {
        const { data } = apiError.response;
        errorMessage =
          data.message ||           // Mensaje directo
          data.error ||             // Error alternativo
          data.msg ||               // Posible estructura alternativa
          errorMessage;             // Fallback
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      Notify.failure(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmChange = () => {
    toggleState();
  };

  const cancelChange = () => {
    setOpen(false);
  };

  // Generar mensajes dinámicos
  const actionText = pendingState ? "activar" : "desactivar";
  const itemDisplayName = itemName || `${entityName} #${id}`;

  const getMessage = () => {
    if (pendingState) {
      return `Esta acción activará ${entityName}: ${itemDisplayName}. Este podrá ser utilizado nuevamente cuando sea necesario.`;
    } else {
      return `Esta acción desactivará ${entityName}: ${itemDisplayName}. Esta operación se puede revertir más tarde.`;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Switch clickeable */}
      <div
        onClick={handleSwitchClick}
        className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
      >
        <CustomSwitch
          checked={isEnabled}
          onCheckedChange={handleSwitchClick}
          disabled={disabled || isProcessing}
          size={size}
        />
      </div>

      {/* Indicador de estado */}

      {/* Dialog de confirmación */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar {actionText}?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {getMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Información visual del cambio */}
          <div
            className={`rounded-lg p-4 border ${
              pendingState
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
            }`}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Estado actual:</span>
                <span className={isEnabled ? "text-green-600" : "text-red-600"}>
                  {isEnabled ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Nuevo estado:</span>
                <span
                  className={pendingState ? "text-green-600" : "text-red-600"}
                >
                  {pendingState ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelChange} disabled={isProcessing}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmChange}
              disabled={isProcessing}
              className={
                pendingState
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
              }
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {pendingState ? "Activando..." : "Desactivando..."}
                </div>
              ) : (
                `Confirmar ${actionText}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SwitchEstado;

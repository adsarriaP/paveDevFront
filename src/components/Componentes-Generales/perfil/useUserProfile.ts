// src/hooks/useUserProfile.ts
import { useState, useEffect } from "react";
import { User, Dependencia, UserProfile } from "@/types/entities.types";
import { useApi } from "@/hooks/useApi";

export function useUserProfile(userId: number | string | undefined) {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { get } = useApi();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Obtener datos básicos del usuario
        const user = await get<User>(`/usuarios/${userId}`);
        setUserData(user as UserProfile);

        // 2. Si hay un ID de dependencia, obtener información de dependencia
        if (user.dependencia_id) {
          try {
            const dependencia = await get<Dependencia>(
              `/dependencias/${user.dependencia_id}`
            );

            // 3. Si hay un jefe asignado, obtener su información
            if (dependencia.jefe) {
              try {
                const jefeData = await get(`/usuarios/${dependencia.jefe}`);

                // Actualizar el estado con toda la información
                setUserData((prevUser) => {
                  if (!prevUser) return null;
                  return {
                    ...prevUser,
                    dependenciaInfo: {
                      id: dependencia.id,
                      gerencia: dependencia.gerencia,
                      subgerencia: dependencia.subgerencia,
                      unidad: dependencia.unidad,
                      jefe: dependencia.jefe,
                      jefeUsuario: {
                        id: (jefeData as { id: number }).id,
                        nombre: (jefeData as { nombre: string }).nombre,
                      },
                    },
                  };
                });
              } catch (jefeError) {
                console.error("Error al cargar datos del jefe:", jefeError);
                // Continuar con la información de dependencia sin jefe
                setUserData((prevUser) => {
                  if (!prevUser) return null;
                  return {
                    ...prevUser,
                    dependenciaInfo: {
                      id: dependencia.id,
                      gerencia: dependencia.gerencia,
                      subgerencia: dependencia.subgerencia,
                      unidad: dependencia.unidad,
                      jefe: dependencia.jefe,
                    },
                  };
                });
              }
            } else {
              // Sin jefe asignado
              setUserData((prevUser) => {
                if (!prevUser) return null;
                return {
                  ...prevUser,
                  dependenciaInfo: {
                    id: dependencia.id,
                    gerencia: dependencia.gerencia,
                    subgerencia: dependencia.subgerencia,
                    unidad: dependencia.unidad,
                    jefe: null,
                  },
                };
              });
            }
          } catch (depError) {
            console.error("Error al cargar datos de la dependencia:", depError);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // Funciones auxiliares
  const formatearFecha = (fechaStr: string | null | undefined): string => {
    if (!fechaStr) return "Nunca";
    try {
      const fecha = new Date(fechaStr);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(fecha);
    } catch {
      return "Fecha inválida";
    }
  };

  const getInitials = (): string => {
    if (!userData?.nombre) return "N";
    const names = userData.nombre.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getAvatarColor = (): string => {
    if (!userData?.rol) return "bg-slate-600";

    const rolNombre =
      typeof userData.rol === "object" ? userData.rol.nombre : userData.rol;

    switch (rolNombre.toUpperCase()) {
      case "ADMINISTRADOR":
        return "bg-amber-600";
      case "USUARIO":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getRolDescription = (): string => {
    if (!userData?.rol) return "";

    const rolNombre =
      typeof userData.rol === "object" ? userData.rol.nombre : userData.rol;

    switch (rolNombre.toUpperCase()) {
      case "ADMINISTRADOR":
        return "Acceso completo al sistema, gestión de usuarios y configuraciones";
      case "USUARIO":
        return "Usuario estándar del sistema P.A.V.E";
      default:
        return "Usuario del sistema P.A.V.E";
    }
  };

  const displayValue = (value: unknown): string => {
    if (value === undefined || value === null || value === "") {
      return "--";
    }
    return String(value);
  };

  return {
    userData,
    isLoading,
    error,
    formatearFecha,
    getInitials,
    getAvatarColor,
    getRolDescription,
    displayValue,
  };
}

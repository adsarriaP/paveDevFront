import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { User, Dependencia, UserProfile } from "@/types/entities.types";
import { Notify } from "notiflix/build/notiflix-notify-aio";

export const useUserDependencia = (userId: number) => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { get } = useApi();

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
              const jefeData = await get<User>(`/usuarios/${dependencia.jefe}`);

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
                      id: jefeData.id,
                      nombre: jefeData.nombre,
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
      console.error("Error al cargar datos del usuario:", error);
      setError(error as Error);
      Notify.failure("No se pudo cargar la información de dependencia");
    } finally {
      setIsLoading(false);
    }
  };

  return { userData, isLoading, error, fetchData };
};

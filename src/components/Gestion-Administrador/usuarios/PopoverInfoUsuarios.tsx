import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Button } from "@/components/ui/button";
import { Building, Building2, LayoutGrid, UserPlus } from "lucide-react";
import { User } from "@/types/entities.types";
import { useUserDependencia } from "./useUserDependencia";
import { useState } from "react";

interface PopoverInfoUsuariosProps {
  userData: User;
}

export default function PopoverInfoUsuarios({
  userData,
}: PopoverInfoUsuariosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    userData: userWithDependencia,
    isLoading,
    fetchData,
  } = useUserDependencia(userData.id);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !userWithDependencia) {
      fetchData();
    }
  };

  const displayValue = (value: string | null | undefined) => {
    return value || "-";
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          Ver más
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Información de Dependencia</h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : userWithDependencia?.dependenciaInfo ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Gerencia:</span>
                  <span className="text-sm">
                    {displayValue(userWithDependencia.dependenciaInfo.gerencia)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Subgerencia:</span>
                  <span className="text-sm">
                    {displayValue(
                      userWithDependencia.dependenciaInfo.subgerencia
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Unidad:</span>
                  <span className="text-sm">
                    {displayValue(userWithDependencia.dependenciaInfo.unidad)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Jefe:</span>
                  <span className="text-sm">
                    {userWithDependencia.dependenciaInfo.jefe
                      ? userWithDependencia.dependenciaInfo.jefeUsuario?.nombre.toUpperCase() ||
                        "Cargando información del jefe..."
                      : "No hay jefe asignado"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay información de dependencia disponible
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

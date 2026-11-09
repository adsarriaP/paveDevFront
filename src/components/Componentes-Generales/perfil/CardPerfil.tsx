// src/components/perfil/CardPerfil.tsx
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User as UserIcon,
  Mail,
  Shield,
  BadgeCheck,
  Clock,
  Building,
  Building2,
  LayoutGrid,
  UserPlus,
} from "lucide-react";
import { useUserProfile } from "./useUserProfile";

const CardPerfil: React.FC = () => {
  // Obtener el ID del usuario del estado de Redux
  const userFromRedux = useSelector((state: RootState) => state.auth.user);

  // Usar nuestro hook personalizado para manejar toda la lógica
  const {
    userData,
    isLoading,
    error,
    formatearFecha,
    getInitials,
    getAvatarColor,
    getRolDescription,
    displayValue,
  } = useUserProfile(userFromRedux?.id);

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <p>Cargando perfil...</p>
        </CardContent>
      </Card>
    );
  }

  // Mostrar error si ocurrió
  if (error) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <p className="text-red-500">
            Error al cargar el perfil: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (!userData) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <p>No se encontró información del perfil</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BadgeCheck className="text-primary h-6 w-6" />
          Mi Perfil
        </CardTitle>
        <CardDescription className="text-base">
          Información de tu cuenta en el sistema P.A.V.E
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna de avatar y detalles básicos */}
          <div className="lg:w-1/3 flex flex-col items-center space-y-4">
            {/* Avatar con iniciales */}
            <div
              className={`${getAvatarColor()} text-white rounded-full w-32 h-32 flex items-center justify-center text-4xl font-bold shadow-lg transition-transform hover:scale-105`}
            >
              {getInitials()}
            </div>

            {/* Nombre y rol destacados */}
            <div className="text-center space-y-1 w-full">
              <h3 className="text-2xl font-semibold">
                {userData?.nombre ? userData.nombre.toUpperCase() : "Usuario"}
              </h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {typeof userData?.rol === "object"
                  ? userData.rol.nombre
                  : userData?.rol || "Rol no definido"}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getRolDescription()}
              </p>
            </div>

            {/* Último acceso */}
            <div className="w-full bg-muted/30 rounded-lg p-4 mt-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Último acceso</span>
              </div>
              <p className="font-medium">
                {formatearFecha(userData?.ultimo_acceso)}
              </p>
              <p className="text-xs text-muted-foreground">
                Última vez que inició sesión en el sistema
              </p>
            </div>
          </div>

          {/* Detalles del usuario */}
          <div className="lg:w-2/3 space-y-6 bg-card rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información personal */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Información personal
                </h3>

                {/* Nombre */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>Nombre completo</span>
                  </div>
                  <p className="font-medium text-lg">
                    {userData?.nombre
                      ? userData.nombre.toUpperCase()
                      : "No disponible"}
                  </p>
                </div>

                {/* Usuario */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Usuario registrado</span>
                  </div>
                  <p className="font-medium text-lg break-all">
                    {displayValue(userData?.user)}
                  </p>
                </div>

                {/* Rol */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Rol asignado</span>
                  </div>
                  <p className="font-medium text-lg">
                    {typeof userData?.rol === "object"
                      ? displayValue(userData.rol.nombre)
                      : displayValue(userData?.rol)}
                  </p>
                </div>

                {/* registro */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Número de registro</span>
                  </div>
                  <p className="font-medium text-lg break-all">
                    {displayValue(userData?.registro)}
                  </p>
                </div>
              </div>

              {/* Información de Dependencia */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Información de dependencia
                </h3>

                {userData?.dependenciaInfo ? (
                  <>
                    {/* Gerencia */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>Gerencia</span>
                      </div>
                      <p className="font-medium text-lg">
                        {displayValue(userData.dependenciaInfo.gerencia)}
                      </p>
                    </div>

                    {/* Subgerencia */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>Subgerencia</span>
                      </div>
                      <p className="font-medium text-lg">
                        {displayValue(userData.dependenciaInfo.subgerencia)}
                      </p>
                    </div>

                    {/* Unidad */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        <span>Unidad</span>
                      </div>
                      <p className="font-medium text-lg">
                        {displayValue(userData.dependenciaInfo.unidad)}
                      </p>
                    </div>

                    {/* Jefe de dependencia */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserPlus className="h-4 w-4" />
                        <span>Jefe de dependencia</span>
                      </div>
                      <p className="font-medium text-lg">
                        {userData.dependenciaInfo.jefe
                          ? userData.dependenciaInfo.jefeUsuario?.nombre.toUpperCase() ||
                            "Cargando información del jefe..."
                          : "No hay jefe asignado"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No hay información de dependencia disponible
                  </div>
                )}
              </div>
            </div>

            {/* Sección de ayuda */}
            <div className="mt-6 pt-6 border-t">
              <div className="bg-muted/20 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-medium">
                    ¿Necesitas ayuda con tu cuenta?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Contacta al administrador del sistema para actualizar tu
                    información o recuperar tu contraseña.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardPerfil;

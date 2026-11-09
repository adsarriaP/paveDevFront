import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import CardsPresentacion from '@/components/solicitudes/inicio/CardsPresentacion';
import { useUserProfile } from '@/components/Componentes-Generales/perfil/useUserProfile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User as UserIcon,
  Building,
  Building2,
  LayoutGrid,
  UserPlus,
  CheckCircle,
} from 'lucide-react';

function DashboardInicio() {
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);

  // Obtener el ID del usuario del estado de Redux
  const userFromRedux = useSelector((state: RootState) => state.auth.user);

  // Usar el mismo hook que usa CardPerfil para obtener toda la información
  const { userData, isLoading, displayValue } = useUserProfile(
    userFromRedux?.id
  );

  useEffect(() => {
    // Verificar si el usuario acaba de iniciar sesión
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');

    if (justLoggedIn === 'true') {
      // Mostrar la alerta solo cuando los datos del usuario estén cargados
      if (!isLoading && userData) {
        setShowWelcomeAlert(true);
        // Limpiar la flag inmediatamente para que no se muestre en futuras visitas
        sessionStorage.removeItem('justLoggedIn');
      }
    }
  }, [isLoading, userData]);

  // Función para obtener el nombre del rol
  const getRolName = () => {
    if (!userData?.rol) return 'Rol no definido';
    return typeof userData.rol === 'object'
      ? userData.rol.nombre
      : userData.rol;
  };

  return (
    <div className="flex flex-col gap-5">
      <CardsPresentacion />

      {/* Alert Dialog que se muestra solo después del login */}
      <AlertDialog open={showWelcomeAlert} onOpenChange={setShowWelcomeAlert}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <div className="p-6 pb-0 flex-shrink-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                ¡Bienvenido al Sistema P.A.V.E!
              </AlertDialogTitle>
            </AlertDialogHeader>
          </div>
          <div className="overflow-y-auto flex-1 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AlertDialogDescription className="text-base text-left space-y-4 py-4">
              <p className="font-medium text-foreground">
                Hola{' '}
                <strong>{userData?.nombre?.toUpperCase() || 'Usuario'}</strong>,
                por favor verifica que tu información personal esté correcta:
              </p>

              {/* Información Personal */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Información Personal
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Nombre completo:
                    </span>
                    <p className="font-medium text-foreground">
                      {userData?.nombre?.toUpperCase() || '--'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usuario:</span>
                    <p className="font-medium text-foreground">
                      {displayValue(userData?.user)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rol:</span>
                    <p className="font-medium text-foreground">
                      {getRolName()}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registro:</span>
                    <p className="font-medium text-foreground">
                      {displayValue(userData?.registro)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Dependencia */}
              {userData?.dependenciaInfo ? (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Información de Dependencia
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Gerencia:
                      </span>
                      <p className="font-medium text-foreground">
                        {displayValue(userData.dependenciaInfo.gerencia)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Subgerencia:
                      </span>
                      <p className="font-medium text-foreground">
                        {displayValue(userData.dependenciaInfo.subgerencia)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <LayoutGrid className="w-3 h-3" />
                        Unidad:
                      </span>
                      <p className="font-medium text-foreground">
                        {displayValue(userData.dependenciaInfo.unidad)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <UserPlus className="w-3 h-3" />
                        Jefe de dependencia:
                      </span>
                      <p className="font-medium text-foreground">
                        {userData.dependenciaInfo.jefeUsuario?.nombre?.toUpperCase() ||
                          'No hay jefe asignado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground">
                    No hay información de dependencia disponible
                  </p>
                </div>
              )}

              {/* Mensaje de verificación */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-amber-800 dark:text-amber-200 font-medium text-center">
                  ⚠️ <strong>Importante:</strong> Por favor verifica que toda la
                  información mostrada sea correcta. Si encuentras algún error,
                  escribe un correo a vacaciones@emcali.com.co para realizar las
                  correcciones necesarias.
                </p>
              </div>
            </AlertDialogDescription>
          </div>
          <div className="p-6 pt-0 flex-shrink-0">
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setShowWelcomeAlert(false)}
                className="bg-primary hover:bg-primary/90"
              >
                He verificado la información
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DashboardInicio;

// src/routes/Routers.tsx
import { Routes, Route } from 'react-router-dom';
import SignInSide from '@/pages/Generales/login/SignInSide';
import DashboardUsuarios from '@/pages/Administrador/DashboardUsuarios';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '@/components/layouts/MainLayout';
import DashboardPerfil from '@/pages/Generales/DashboardPerfil';
import DashboardInicio from '@/pages/Generales/DashboardInicio';
import DashboardSolicitudes from '@/pages/Planeacion/DashboardSolicitudes';
import DashboardAprobacion from '@/pages/Planeacion/DashboardAprobacion';
import DashboardCalendario from '@/pages/Planeacion/DashboardCalendario';
import DashboardDependencias from '@/pages/Administrador/DashboardDependencias';
import DashboardAdminSolicitudes from '@/pages/Planeacion/DashboardAdminSolicitudes';
import DashboardPeriodoAcceso from '@/pages/Administrador/DashboardPeridoAcceso';
import DashboardSolicitudesAplazamientos from '@/pages/Aplazamientos/DashboardSolicitudesAplazamientos';
import DashboardAprobacionesAplazamientos from '@/pages/Aplazamientos/DashboardAprobacionesAplazamientos';
import DashboardAplazamiento from '@/pages/Aplazamientos/DashboardAplazamiento';
import DashboardCalendarioAplazamientos from '@/pages/Aplazamientos/DashboardCalendarioAplazamientos';
import DashboardAdminAplazamientos from '@/pages/Aplazamientos/DashboardAdminAplazamientos';
import DashboardHistorico from '@/pages/Planeacion/DashboardHistorico';
import DashboardRechazoAplazamiento from '@/pages/Administrador/DashboardRechazoAplazamiento';

const Routers = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<SignInSide />} />

      {/* Rutas protegidas con MainLayout */}
      <Route element={<MainLayout />}>
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <DashboardUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA']}
            >
              <DashboardPerfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inicio"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA']}
              requiresPeriodoActivo={true}
            >
              <DashboardInicio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB', 'ANALISTA']}
            >
              <DashboardSolicitudes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aprobacion"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB']}
              requiresManager={true}
              requiresPeriodoActivo={true}
            >
              <DashboardAprobacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historicoPlaneacion"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB']}
              requiresManager={true}
            >
              <DashboardHistorico />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB']}
              requiresManager={true}
              requiresPeriodoActivo={true}
            >
              <DashboardCalendario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jefes"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <DashboardDependencias />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'ANALISTA']}>
              <DashboardAdminSolicitudes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/periodo-acceso"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <DashboardPeriodoAcceso />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aplazamientosSolicitudes"
          element={
            <ProtectedRoute
              allowedRoles={[
                'ADMINISTRADOR',
                'USUARIO',
                'ANALISTA',
                'JEFE_CB',
                'ANALISTA',
              ]}
            >
              <DashboardSolicitudesAplazamientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aplazamientosAprobaciones"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'JEFE_CB']}
              requiresManager={true}
            >
              <DashboardAprobacionesAplazamientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitarAplazamiento"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'ANALISTA', 'JEFE_CB']}
            >
              <DashboardAplazamiento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendarioAprobacion"
          element={
            <ProtectedRoute
              allowedRoles={['ADMINISTRADOR', 'USUARIO', 'ANALISTA', 'JEFE_CB']}
              requiresManager={true}
            >
              <DashboardCalendarioAplazamientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminAplazamientos"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR', 'ANALISTA']}>
              <DashboardAdminAplazamientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rechazoAplazamientos"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <DashboardRechazoAplazamiento />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default Routers;

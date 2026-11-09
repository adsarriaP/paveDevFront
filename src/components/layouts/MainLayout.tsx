// src/components/layouts/MainLayout.tsx
import { AppSidebar } from '@/components/layouts/AppSidebar';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Button } from '../ui/button';
import { User } from 'lucide-react';
import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export default function MainLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Simplificado: verificamos directamente el número del backend
  const isManager = user?.esJefe === 1;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="top-2 min-w-0">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <SidebarTrigger className="-ml-1 hover:bg-accent hover:cursor-pointer transition-colors" />
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de tema */}
            <ThemeToggle />

            {/* Menú de usuario */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full hover:bg-accent hover:cursor-pointer transition-colors"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.nombre.toUpperCase() || 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.rol || 'Rol'} {isManager && '(Jefe)'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <main className="flex-1 overflow-auto bg-background p-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

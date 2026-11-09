import { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit, Loader2, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, UserDataTableProps } from '@/types';
import { useApi } from '@/hooks/useApi';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import PopoverInfoUsuarios from './PopoverInfoUsuarios';
import PopoverVacaciones from './PopoverVacaciones';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import SwitchEstado from '@/components/ui/SwitchEstado';
import EditarUsuarioForm from './EditarUsuarioForm';

// ============================================
// TIPOS PARA RESPUESTAS DE LA API
// ============================================

interface UsuariosPaginadosResponse {
  ok: boolean;
  data: User[];
  total: number;
  pages?: number;
  totalPages?: number;
}

interface UsuariosBuscarResponse {
  ok: boolean;
  data: User[];
  total: number;
}

const LIMIT_PER_PAGE = 100;
const SEARCH_DEBOUNCE_MS = 400;

export function UserDataTable({ refreshTrigger }: UserDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // --- Estado de paginación del servidor ---
  const [allLoadedUsers, setAllLoadedUsers] = useState<User[]>([]);
  const [serverPage, setServerPage] = useState(1);
  const [totalServerUsers, setTotalServerUsers] = useState(0);
  const [totalServerPages, setTotalServerPages] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  // --- Estados de carga ---
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // --- Estado de búsqueda ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[] | null>(null);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // --- Navegación pendiente tras cargar más datos ---
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);

  // --- Ordenamiento de roles ---
  const [rolSortOrder, setRolSortOrder] = useState<number>(0);

  // --- Edición ---
  const [isEditing, setIsEditing] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const { get } = useApi();

  // ============================================
  // CARGA PAGINADA DEL SERVIDOR
  // ============================================

  const fetchPage = async (page: number, isRefresh = false) => {
    try {
      if (page === 1) {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      const response = await get<UsuariosPaginadosResponse>(
        `/usuarios?page=${page}&limit=${LIMIT_PER_PAGE}`
      );

      const newUsers = response.data;
      const total = response.total;
      const pages = response.pages ?? response.totalPages ?? 1;

      setAllLoadedUsers((prev) => (page === 1 ? newUsers : [...prev, ...newUsers]));
      setServerPage(page);
      setTotalServerUsers(total);
      setTotalServerPages(pages);
      setHasMorePages(page < pages);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Notify.failure('No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  // ============================================
  // BÚSQUEDA CON DEBOUNCE
  // ============================================

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      setSearchTotal(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await get<UsuariosBuscarResponse>(
          `/usuarios/buscar?q=${encodeURIComponent(searchTerm.trim())}`
        );
        setSearchResults(response.data);
        setSearchTotal(response.total);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        Notify.failure('Error al buscar usuarios');
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // ============================================
  // EFECTOS DE CICLO DE VIDA
  // ============================================

  useEffect(() => {
    fetchPage(1);
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      setSearchTerm('');
      setSearchResults(null);
      fetchPage(1, true);
    }
  }, [refreshTrigger]);

  // ============================================
  // EDICIÓN
  // ============================================

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUserToEdit(null);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    setUserToEdit(null);
    setSearchTerm('');
    setSearchResults(null);
    fetchPage(1, true);
  };

  // ============================================
  // REFRESH MANUAL
  // ============================================

  const handleRefresh = async () => {
    setSearchTerm('');
    setSearchResults(null);
    await fetchPage(1, true);
    Notify.success('Usuarios actualizados');
  };

  // ============================================
  // ORDENAMIENTO POR ROL
  // ============================================

  const getRolValue = (rol: unknown): string => {
    if (!rol) return '';
    if (typeof rol === 'object' && rol !== null && 'nombre' in rol) {
      return (rol as { nombre: string }).nombre?.toUpperCase() || '';
    }
    return String(rol).toUpperCase();
  };

  const sortUsersByRol = (usersList: User[]): User[] => {
    if (rolSortOrder === 0) return usersList;

    const rolOrder: { [key: string]: number } = {
      ADMINISTRADOR: 1,
      ANALISTA: 2,
      JEFE_CB: 3,
      USUARIO: 4,
    };

    return [...usersList].sort((a, b) => {
      const rolA = getRolValue(a.rol);
      const rolB = getRolValue(b.rol);
      const orderA = rolOrder[rolA] || 999;
      const orderB = rolOrder[rolB] || 999;

      if (orderA === rolSortOrder && orderB !== rolSortOrder) return -1;
      if (orderB === rolSortOrder && orderA !== rolSortOrder) return 1;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || 0) - (b.id || 0);
    });
  };

  const handleRolSortClick = () => {
    setRolSortOrder((prev) => (prev + 1) % 5);
  };

  // ============================================
  // DATOS A MOSTRAR
  // ============================================

  const displayUsers = searchResults !== null ? searchResults : allLoadedUsers;

  const sortedUsers = useMemo(
    () => sortUsersByRol(displayUsers),
    [displayUsers, rolSortOrder]
  );

  // ============================================
  // COLUMNAS
  // ============================================

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('nombre')}</div>,
    },
    {
      accessorKey: 'user',
      header: 'Usuario',
      cell: ({ row }) => <div>{row.getValue('user')}</div>,
    },
    {
      accessorKey: 'registro',
      header: 'Registro',
      cell: ({ row }) => <div>{row.getValue('registro')}</div>,
    },
    {
      accessorKey: 'rol',
      header: () => {
        const rolNames = ['', 'ADMINISTRADOR', 'ANALISTA', 'JEFE_CB', 'USUARIO'];
        const currentRolName = rolNames[rolSortOrder];

        return (
          <Button variant="ghost" onClick={handleRolSortClick}>
            Rol
            <ArrowUpDown className="ml-2 h-4 w-4" />
            {rolSortOrder > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({currentRolName})
              </span>
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const rol = row.original.rol;
        const rolName = typeof rol === 'object' ? rol.nombre : rol;

        if (rolName.toUpperCase() === 'ADMINISTRADOR') {
          return (
            <Badge className="bg-blue-500 text-white dark:bg-blue-600">
              {typeof rol === 'object' ? rol.nombre : rol}
            </Badge>
          );
        }

        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
          'default';
        if (rolName.toUpperCase() === 'USUARIO') badgeVariant = 'secondary';
        else badgeVariant = 'outline';

        return (
          <Badge variant={badgeVariant}>
            {typeof rol === 'object' ? rol.nombre : rol}
          </Badge>
        );
      },
    },
    {
      id: 'dependencia',
      header: 'Dependencia',
      cell: ({ row }) => <PopoverInfoUsuarios userData={row.original} />,
    },
    {
      id: 'vacaciones',
      header: 'Vacaciones',
      cell: ({ row }) => <PopoverVacaciones userData={row.original} />,
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.getValue('estado') as number;
        return (
          <Badge variant={estado === 1 ? 'status-activo' : 'status-inactivo'}>
            {estado === 1 ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const usuario = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(usuario)}
              className="h-8 px-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <SwitchEstado
              id={usuario.id}
              estado={usuario.estado ?? 0}
              entityName="usuario"
              endpoint="usuarios"
              itemName={usuario.nombre}
              onToggleSuccess={() => {
                setSearchTerm('');
                setSearchResults(null);
                fetchPage(1, true);
              }}
            />
          </div>
        );
      },
    },
  ];

  // ============================================
  // TABLA
  // ============================================

  const table = useReactTable({
    data: sortedUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Navegar a la siguiente página después de que se carguen más datos
  useEffect(() => {
    if (shouldNavigateNext && table.getCanNextPage()) {
      table.nextPage();
      setShouldNavigateNext(false);
    }
  }, [allLoadedUsers, shouldNavigateNext]);

  // ============================================
  // NAVEGACIÓN DE PÁGINAS
  // ============================================

  const handleNextPage = async () => {
    if (table.getCanNextPage()) {
      table.nextPage();
    } else if (hasMorePages && searchResults === null) {
      // Cargar siguiente página del servidor
      await fetchPage(serverPage + 1);
      setShouldNavigateNext(true);
    }
  };

  const handlePreviousPage = () => {
    table.previousPage();
  };

  const canGoNext =
    table.getCanNextPage() || (hasMorePages && searchResults === null);
  const canGoPrev = table.getCanPreviousPage();

  // ============================================
  // RENDERS CONDICIONALES
  // ============================================

  if (isEditing && userToEdit) {
    return (
      <Card>
        <EditarUsuarioForm
          usuario={userToEdit}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </Card>
    );
  }

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <TableSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  const isSearchActive = searchResults !== null;
  const loadedCount = allLoadedUsers.length;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Listado de Usuarios
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Buscador con debounce */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, usuario o registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isSearchActive ? (
                <Badge variant="secondary" className="text-xs">
                  {searchTotal} resultado{searchTotal !== 1 ? 's' : ''} encontrado{searchTotal !== 1 ? 's' : ''}
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-xs">
                    Cargados: {loadedCount} / {totalServerUsers}
                  </Badge>
                  {isFetchingMore && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Cargando más...
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {isSearching
                        ? 'Buscando...'
                        : 'No se encontraron resultados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              {isSearchActive ? (
                <>
                  Página {table.getState().pagination.pageIndex + 1} de{' '}
                  {table.getPageCount()} &mdash; {searchTotal} resultado{searchTotal !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  Página {table.getState().pagination.pageIndex + 1} de{' '}
                  {table.getPageCount()} &mdash; {loadedCount} cargados de{' '}
                  {totalServerUsers} totales
                  {totalServerPages > 1 && (
                    <span className="text-muted-foreground/60">
                      {' '}(página {serverPage}/{totalServerPages} del servidor)
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Filas por página</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!canGoPrev || isFetchingMore}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!canGoNext || isFetchingMore}
                >
                  {isFetchingMore ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Cargando...
                    </span>
                  ) : (
                    'Siguiente'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserDataTable;

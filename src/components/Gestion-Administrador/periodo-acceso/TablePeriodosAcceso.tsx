import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Eye } from 'lucide-react';
import SwitchEstado from '@/components/ui/SwitchEstado';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import AperturaPlaneacionVacaciones from './AperturaPlaneacionVacaciones';
import { useApi } from '@/hooks/useApi';
import { PeriodoAcceso } from '@/types';

const TablePeriodosAcceso = () => {
  const [periodos, setPeriodos] = useState<PeriodoAcceso[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoAcceso | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState<PeriodoAcceso | null>(null);
  const { get } = useApi();

  const refreshData = async () => {
    try {
      const data = await get<PeriodoAcceso[]>('/periodos-acceso/todos');
      setPeriodos(data);
    } catch {
      setError('Error al cargar los periodos de acceso');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refreshData();
  };

  const handleEditSuccess = () => {
    setEditPeriodo(null);
    refreshData();
  };

  useEffect(() => {
    const fetchPeriodos = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await get<PeriodoAcceso[]>('/periodos-acceso/todos');
        console.log('Datos recibidos de periodos de acceso:', data);
        setPeriodos(data);
      } catch {
        setError('Error al cargar los periodos de acceso');
      } finally {
        setLoading(false);
      }
    };
    fetchPeriodos();
  }, [get]);

  // Si estamos creando o editando, mostrar solo el formulario
  if (showCreateForm) {
    return (
      <Card className="shadow-sm mt-8 w-full px-2 md:px-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold">
                Crear Nuevo Periodo
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complete los campos para crear un nuevo periodo de acceso
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AperturaPlaneacionVacaciones
            onClose={handleCreateSuccess}
            isEdit={false}
          />
        </CardContent>
      </Card>
    );
  }

  if (editPeriodo) {
    return (
      <Card className="shadow-sm mt-8 w-full px-2 md:px-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold">
                Editar Periodo: {editPeriodo.nombre}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Modifique los campos necesarios para actualizar el periodo
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditPeriodo(null)}
            >
              Cancelar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AperturaPlaneacionVacaciones
            onClose={handleEditSuccess}
            initialData={editPeriodo}
            isEdit={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm mt-8 w-full px-2 md:px-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Periodos de Acceso</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-blue-600">Cargando...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          // 📌 Este contenedor será el que tenga el scroll
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No hay periodos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  [...periodos]
                    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
                    .map((periodo) => (
                      <TableRow key={periodo.id}>
                        <TableCell className="whitespace-nowrap">
                          {periodo.id}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {periodo.nombre}
                        </TableCell>
                        <TableCell>{periodo.descripcion}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(periodo.fecha_inicio).toLocaleString(
                            'es-ES'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(periodo.fecha_fin).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              periodo.activo
                                ? 'status-activo'
                                : 'status-inactivo'
                            }
                          >
                            {periodo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPeriodo(periodo);
                                setShowModal(true);
                              }}
                              className="h-8 px-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditPeriodo(periodo)}
                              className="h-8 px-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <SwitchEstado
                              id={periodo.id ?? 0}
                              estado={periodo.activo ? 1 : 0}
                              entityName="periodo"
                              endpoint="periodos-acceso"
                              itemName={periodo.nombre}
                              customUrl={`/periodos-acceso/${periodo.id}`}
                              onToggleSuccess={(id, newState) => {
                                // Actualizar el estado local inmediatamente para feedback visual
                                setPeriodos((prev) =>
                                  prev.map((p) =>
                                    p.id === id
                                      ? { ...p, activo: newState === 1 }
                                      : p
                                  )
                                );
                                // También refrescar los datos desde el servidor
                                refreshData();
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {/* Modal para ver más información usando Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Información del Periodo</DialogTitle>
          </DialogHeader>
          {selectedPeriodo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-primary/10 rounded-md p-3 flex flex-col gap-2">
                <div>
                  <span className="font-semibold text-primary">ID:</span>{' '}
                  {selectedPeriodo.id}
                </div>
                <div>
                  <span className="font-semibold text-primary">Nombre:</span>{' '}
                  {selectedPeriodo.nombre}
                </div>
                <div>
                  <span className="font-semibold text-primary">
                    Descripción:
                  </span>{' '}
                  {selectedPeriodo.descripcion}
                </div>
                <div>
                  <span className="font-semibold text-primary">
                    Fecha Inicio:
                  </span>{' '}
                  <span className="text-blue-700 dark:text-blue-400">
                    {new Date(selectedPeriodo.fecha_inicio).toLocaleString(
                      'es-ES'
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-primary">Fecha Fin:</span>{' '}
                  <span className="text-blue-700 dark:text-blue-400">
                    {new Date(selectedPeriodo.fecha_fin).toLocaleString(
                      'es-ES'
                    )}
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 rounded-md p-3 flex flex-col gap-2">
                <div>
                  <span className="font-semibold text-primary">Activo:</span>{' '}
                  <span
                    className={
                      selectedPeriodo.activo
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    {selectedPeriodo.activo ? 'Sí' : 'No'}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-primary">
                    Permitir Fines de Semana:
                  </span>{' '}
                  <span
                    className={
                      selectedPeriodo.permitir_fines_semana
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  >
                    {selectedPeriodo.permitir_fines_semana ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-primary">
                    Duración (días):
                  </span>{' '}
                  <span className="text-yellow-700 dark:text-yellow-400">
                    {selectedPeriodo.duracionEnDias ?? ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TablePeriodosAcceso;

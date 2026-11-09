import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingState from '@/components/ui/LoadingState';
import LoadingStats from '@/components/ui/LoadingStats';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  RotateCcw, 
  Users, 
  Search, 
  Database,
  Clock
} from 'lucide-react';

interface LoadingDemoProps {
  onClose?: () => void;
}

export const LoadingDemo: React.FC<LoadingDemoProps> = ({ onClose }) => {
  const [currentDemo, setCurrentDemo] = useState<'initial' | 'search' | 'pagination' | 'refresh'>('initial');
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const demos = [
    {
      id: 'initial' as const,
      title: 'Carga Inicial',
      description: 'Loading cuando se abre la tabla por primera vez',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      id: 'search' as const,
      title: 'Búsqueda',
      description: 'Loading durante búsqueda con debounce',
      icon: <Search className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      id: 'pagination' as const,
      title: 'Paginación',
      description: 'Loading al cambiar de página',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-purple-500'
    },
    {
      id: 'refresh' as const,
      title: 'Actualización',
      description: 'Loading al refrescar manualmente',
      icon: <RotateCcw className="h-4 w-4" />,
      color: 'bg-orange-500'
    }
  ];

  const runDemo = async (demoType: typeof currentDemo) => {
    setCurrentDemo(demoType);
    setIsRunning(true);
    setProgress(0);

    // Simular progreso
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);
    setProgress(0);
  };

  const renderLoadingDemo = () => {
    switch (currentDemo) {
      case 'initial':
        return (
          <LoadingState 
            variant="card"
            message="Cargando usuarios..."
            submessage="Conectando con el servidor y obteniendo datos"
            size="lg"
          />
        );

      case 'search':
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <LoadingStats
                totalUsers={1250}
                currentOperation="searching"
                progress={progress}
                message="Buscando coincidencias en la base de datos..."
              />
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Vista de tabla durante búsqueda:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeleton columns={6} rows={3} />
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 'pagination':
        return (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Cargando página 3...</h4>
                <LoadingState variant="inline" message="Obteniendo datos" size="sm" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeleton columns={6} rows={5} />
                </TableBody>
              </Table>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Página 3 de 25 (20 de 500 usuarios)</span>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>Cargando...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'refresh':
        return (
          <LoadingStats
            totalUsers={500}
            currentOperation="loading"
            progress={progress}
            message="Actualizando datos de usuarios..."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Demo: Estados de Loading - Tabla de Usuarios</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Demostración de los diferentes estados de carga implementados para mejorar la experiencia de usuario
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {demos.map((demo) => (
              <Button
                key={demo.id}
                variant={currentDemo === demo.id ? "default" : "outline"}
                size="sm"
                onClick={() => runDemo(demo.id)}
                disabled={isRunning}
                className="flex flex-col h-auto p-3 space-y-2"
              >
                <div className={`p-2 rounded-full text-white ${demo.color}`}>
                  {demo.icon}
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs">{demo.title}</div>
                </div>
              </Button>
            ))}
          </div>
          
          {isRunning && (
            <div className="flex items-center justify-center py-2">
              <Badge variant="outline" className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Ejecutando demo...</span>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {demos.find(d => d.id === currentDemo)?.title} - Vista Previa
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {demos.find(d => d.id === currentDemo)?.description}
          </p>
        </CardHeader>
        <CardContent>
          {renderLoadingDemo()}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Mejoras Implementadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Skeleton Loading:</strong> Muestra la estructura de la tabla mientras carga</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Debounced Search:</strong> Búsqueda optimizada con retraso de 500ms</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Server-side Pagination:</strong> Carga solo los datos necesarios</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Loading States:</strong> Diferentes indicadores según el contexto</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Progress Indicators:</strong> Retroalimentación visual del progreso</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span><strong>Fallback Graceful:</strong> Funciona con o sin paginación del servidor</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar Demo
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoadingDemo;
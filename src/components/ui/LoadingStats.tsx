import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Search, Database } from 'lucide-react';

interface LoadingStatsProps {
  totalUsers?: number;
  currentOperation?: 'loading' | 'searching' | 'filtering';
  progress?: number;
  message?: string;
}

export const LoadingStats: React.FC<LoadingStatsProps> = ({
  totalUsers = 0,
  currentOperation = 'loading',
  progress = 0,
  message
}) => {
  const getOperationIcon = () => {
    switch (currentOperation) {
      case 'searching':
        return <Search className="h-5 w-5 text-blue-500" />;
      case 'filtering':
        return <Database className="h-5 w-5 text-green-500" />;
      default:
        return <Users className="h-5 w-5 text-purple-500" />;
    }
  };

  const getOperationText = () => {
    switch (currentOperation) {
      case 'searching':
        return 'Buscando usuarios...';
      case 'filtering':
        return 'Aplicando filtros...';
      default:
        return 'Cargando usuarios...';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          {getOperationIcon()}
          <span className="text-lg">{getOperationText()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progreso</span>
          <span>{progress}%</span>
        </div>
        
        {progress > 0 && (
          <Progress value={progress} className="w-full" />
        )}
        
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">
            {message || (totalUsers > 0 ? 
              `Procesando ${totalUsers.toLocaleString()} registros...` : 
              'Preparando consulta...'
            )}
          </span>
        </div>
        
        {totalUsers > 1000 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md dark:bg-amber-950 dark:text-amber-400">
            💡 Hay muchos usuarios. Considera usar filtros para mejorar el rendimiento.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoadingStats;
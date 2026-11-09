import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'inline';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Cargando...',
  submessage,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <div className="text-center">
        <div className="text-sm font-medium text-foreground">{message}</div>
        {submessage && (
          <div className="text-xs text-muted-foreground mt-1">{submessage}</div>
        )}
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card>
        <CardContent className="p-8">
          <LoadingContent />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <LoadingContent />
    </div>
  );
};

export default LoadingState;
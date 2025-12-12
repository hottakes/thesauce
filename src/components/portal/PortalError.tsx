import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortalErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const PortalError: React.FC<PortalErrorProps> = ({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
      <AlertTriangle className="w-8 h-8 text-destructive" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    )}
  </div>
);

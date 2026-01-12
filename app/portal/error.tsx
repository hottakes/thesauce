'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="glass-card p-8 w-full max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo-white.png" alt="Sauce" className="h-12 w-auto object-contain" />
        </div>

        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>

        <h1 className="text-xl font-bold mb-2">Portal Error</h1>
        <p className="text-muted-foreground mb-6">
          Something went wrong loading the portal. Please try again.
        </p>

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="sauce-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/portal/login'}>
            <LogIn className="w-4 h-4 mr-2" />
            Back to login
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

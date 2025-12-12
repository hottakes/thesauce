import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from '@/hooks/usePortalAuth';
import { Loader2, AlertCircle } from 'lucide-react';

const PortalContent: React.FC = () => {
  const { session, applicant, isLoading } = usePortalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/portal/login" replace />;
  }

  if (!applicant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Ambassador Profile Found</h2>
          <p className="text-muted-foreground mb-6">
            Your account isn't linked to an approved ambassador profile. 
            If you believe this is an error, please contact support.
          </p>
          <a 
            href="/" 
            className="sauce-button inline-block"
          >
            Apply to Become an Ambassador
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export const PortalLayout: React.FC = () => {
  return (
    <PortalAuthProvider>
      <PortalContent />
    </PortalAuthProvider>
  );
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Loader2 } from 'lucide-react';

interface PortalProtectedRouteProps {
  children: React.ReactNode;
}

export const PortalProtectedRoute: React.FC<PortalProtectedRouteProps> = ({ children }) => {
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
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">No Application Found</h2>
          <p className="text-muted-foreground mb-6">
            No application found for this account. Please apply first.
          </p>
          <a href="/" className="sauce-button inline-block">
            Apply Now
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

import React from 'react';
import { Outlet } from 'react-router-dom';
import { PortalAuthProvider } from '@/hooks/usePortalAuth';

export const PortalLayout: React.FC = () => {
  return (
    <PortalAuthProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </PortalAuthProvider>
  );
};

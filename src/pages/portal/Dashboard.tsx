import React from 'react';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export const PortalDashboard: React.FC = () => {
  const { applicant, signOut } = usePortalAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold gradient-text">🧃 Sauce Portal</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>@{applicant?.instagram_handle}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome, {applicant?.first_name || 'Ambassador'}!</h1>
          <p className="text-muted-foreground">
            Your ambassador portal is coming soon. Check back for opportunities!
          </p>
        </div>
      </main>
    </div>
  );
};

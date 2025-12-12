import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from '@/hooks/usePortalAuth';
import { LayoutDashboard, Briefcase, Zap, User, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/portal', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/portal/opportunities', icon: Briefcase, label: 'Opportunities' },
  { to: '/portal/boosts', icon: Zap, label: 'Boosts' },
  { to: '/portal/profile', icon: User, label: 'Profile' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'pending':
    case 'new':
      return 'bg-yellow-500';
    case 'rejected':
      return 'bg-red-500';
    default:
      return 'bg-muted-foreground';
  }
};

const PortalSidebar: React.FC = () => {
  const { applicant, signOut } = usePortalAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-card border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="text-xl font-bold gradient-text flex items-center gap-2">
          <span>🧃</span>
          <span>Sauce</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {applicant?.instagram_profile_pic ? (
            <img
              src={applicant.instagram_profile_pic}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              @{applicant?.instagram_handle || 'user'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('w-2 h-2 rounded-full', getStatusColor(applicant?.status || ''))} />
              <span className="text-xs text-muted-foreground capitalize">
                {applicant?.status || 'pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

const MobileTabBar: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <ul className="flex justify-around py-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <PortalSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar />
    </div>
  );
};

export const PortalLayout: React.FC = () => {
  return (
    <PortalAuthProvider>
      <PortalContent />
    </PortalAuthProvider>
  );
};

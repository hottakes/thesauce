import { AuthProvider } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>{children}</AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

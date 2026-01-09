import { AuthProvider } from '@/hooks/useAuth';
import { AdminLogin } from '@/components/admin/pages/Login';

export default function AdminLoginPage() {
  return (
    <AuthProvider>
      <AdminLogin />
    </AuthProvider>
  );
}

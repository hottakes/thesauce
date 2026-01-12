import { Suspense } from 'react';
import { PortalLogin } from '@/components/portal/pages/Login';

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <PortalLogin />
    </Suspense>
  );
}

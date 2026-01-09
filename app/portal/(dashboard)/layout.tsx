import { PortalLayout } from '@/components/portal/PortalLayout';

export default function PortalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout>{children}</PortalLayout>;
}

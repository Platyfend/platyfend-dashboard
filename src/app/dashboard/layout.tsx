import { ProtectedRoute } from '@/src/features/auth'
import { DashboardLayout } from '@/src/components/dashboard/dashboard-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

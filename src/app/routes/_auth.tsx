import { AuthGuard } from '@/components/common/auth-guard'
import { AppShell } from '@/components/layout/app-shell'

export default function AuthLayout() {
  return (
    <AuthGuard>
      <AppShell />
    </AuthGuard>
  )
}

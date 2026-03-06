import { AuthGuard } from '@/components/common/auth-guard'
import { SkipToContent } from '@/components/common/skip-to-content'
import { AppShell } from '@/components/layout/app-shell'

export default function AuthLayout() {
  return (
    <AuthGuard>
      <SkipToContent />
      <AppShell />
    </AuthGuard>
  )
}

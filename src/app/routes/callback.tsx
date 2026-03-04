import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function CallbackPage() {
  // TODO: Handle Auth0 redirect callback (issue #33)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text="Signing you in..." />
    </div>
  )
}

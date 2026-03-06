import { useEffect, useState, type ReactNode } from 'react'
import { useBiometric } from '@/hooks/native/use-biometric'
import { LoadingSpinner } from '@/components/common/loading-spinner'

type BiometricGuardProps = {
  children: ReactNode
  /** Message shown on the biometric prompt */
  reason?: string
  /** Content to show when biometrics are unavailable (defaults to rendering children) */
  fallback?: ReactNode
}

export function BiometricGuard({
  children,
  reason = 'Authenticate to continue',
  fallback,
}: BiometricGuardProps) {
  const { isAvailable, authenticate, error } = useBiometric()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function tryAuthenticate() {
      if (!isAvailable) {
        // Biometrics not available — fall through
        setChecking(false)
        return
      }

      const success = await authenticate(reason)
      setAuthenticated(success)
      setChecking(false)
    }

    void tryAuthenticate()
  }, [isAvailable, authenticate, reason])

  if (checking) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying identity..." />
      </div>
    )
  }

  // Biometrics not available — use fallback or just render children
  if (!isAvailable) {
    return <>{fallback ?? children}</>
  }

  // Biometric auth failed
  if (!authenticated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Authentication Required</h2>
          {error && <p className="text-sm text-muted-foreground">{error}</p>}
          <button
            onClick={async () => {
              setChecking(true)
              const success = await authenticate(reason)
              setAuthenticated(success)
              setChecking(false)
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { setApiTokenProvider } from '@/lib/api/client'
import { auth0Config, isAuthEnabled } from '@/lib/auth'
import { applyAnalyticsConsent } from '@/lib/analytics'
import '@/lib/i18n' // Initialize i18n

// Fleet telemetry (TM-8): PostHog on the iii Partners schema, only when VITE_ENABLE_ANALYTICS, VITE_POSTHOG_KEY and the
// visitor's analytics consent all say yes. useConsent() re-applies this whenever consent changes.
applyAnalyticsConsent()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

type ProvidersProps = {
  children: ReactNode
}

/**
 * Registers the signed-in user's access token with the API client so every request
 * to this app's OWN protected backend (`/api/*`, `POST /mcp`) carries a JWT that
 * `functions/_middleware.ts` can verify. Rendered inside Auth0Provider so `useAuth0`
 * is in scope; a no-op render (returns null).
 */
function ApiTokenBridge() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()
  useEffect(() => {
    setApiTokenProvider(async () =>
      isAuthenticated
        ? getAccessTokenSilently(
            auth0Config.audience ? { authorizationParams: { audience: auth0Config.audience } } : undefined,
          )
        : null,
    )
    return () => setApiTokenProvider(null)
  }, [getAccessTokenSilently, isAuthenticated])
  return null
}

function AuthProvider({ children }: { children: ReactNode }) {
  if (!isAuthEnabled) return <>{children}</>

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        ...(auth0Config.audience ? { audience: auth0Config.audience } : {}),
      }}
      cacheLocation="localstorage"
    >
      <ApiTokenBridge />
      {children}
    </Auth0Provider>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={250} skipDelayDuration={150}>
            {children}
          </TooltipProvider>
          {/* sonner unstyled, so toasts wear the system's glass (.toast in design.css), not the library's look */}
          <Toaster position="bottom-right" toastOptions={{ unstyled: true, classNames: { toast: 'toast', title: 'toast-title', description: 'toast-desc', icon: 'toast-icon', success: 'toast-ok', error: 'toast-error' } }} />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

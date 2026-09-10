import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { setApiTokenProvider } from '@/lib/api/client'
import { auth0Config, isAuthEnabled } from '@/lib/auth'
import '@/lib/i18n' // Initialize i18n

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
          {children}
          <Toaster position="bottom-right" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

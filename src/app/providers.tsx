import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider } from '@auth0/auth0-react'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { auth0Config, isAuthEnabled } from '@/lib/auth'

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

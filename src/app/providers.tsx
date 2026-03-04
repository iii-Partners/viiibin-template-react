import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/common/error-boundary'

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

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      {/* TODO: Add Auth0Provider here (issue #33) */}
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

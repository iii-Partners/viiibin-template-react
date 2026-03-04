import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Auth store — tracks authentication state derived from Auth0.
 *
 * Persistence: sessionStorage (cleared on tab close)
 * Hydration: 2nd (after theme, before protected routes)
 *
 * NOTE: This store caches Auth0 state for synchronous access in guards.
 * The Auth0Provider is the source of truth — this store mirrors it.
 * User profile data belongs in TanStack Query, NOT here.
 */
type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
  setAuth: (isAuthenticated: boolean, userId: string | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: true,
      userId: null,
      setAuth: (isAuthenticated, userId) => set({ isAuthenticated, userId, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ isAuthenticated: false, isLoading: false, userId: null }),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
      }) as AuthState,
    },
  ),
)

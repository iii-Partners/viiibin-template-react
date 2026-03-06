import { create } from 'zustand'
import type { SubscriptionStatus } from '@/lib/payments/stripe-config'

/**
 * Subscription store — tracks the user's current subscription state.
 *
 * Persistence: none (fetched from API on app load)
 * Hydration: after auth (requires authenticated user)
 *
 * NOTE: This store caches subscription state for synchronous UI checks
 * (e.g., gating features behind plan tiers). The API is the source of truth.
 */
type SubscriptionState = {
  status: SubscriptionStatus
  planId: string | null
  planName: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  isLoading: boolean
  setSubscription: (data: {
    status: SubscriptionStatus
    planId: string
    planName: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  }) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const defaults = {
  status: 'none' as SubscriptionStatus,
  planId: null as string | null,
  planName: null as string | null,
  currentPeriodEnd: null as string | null,
  cancelAtPeriodEnd: false,
  isLoading: false,
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  ...defaults,
  setSubscription: (data) =>
    set({
      status: data.status,
      planId: data.planId,
      planName: data.planName,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      isLoading: false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(defaults),
}))

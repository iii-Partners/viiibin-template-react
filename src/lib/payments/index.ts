import type { Subscription } from './stripe-config'

/**
 * Payment API stubs.
 * These functions call API endpoints that should be implemented on the backend.
 * Currently return mock data for development.
 */

/**
 * Create a Stripe Checkout session for a given plan.
 * TODO: Implement backend endpoint POST /api/payments/checkout
 */
export async function createCheckoutSession(
  planId: string,
  interval: 'monthly' | 'annual' = 'monthly',
): Promise<{ sessionUrl: string }> {
  // TODO: Replace with actual API call
  // const response = await api.post<{ sessionUrl: string }>('/payments/checkout', { planId, interval })
  // return response
  console.log('[payments] createCheckoutSession stub:', { planId, interval })
  return { sessionUrl: '#checkout-stub' }
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 * TODO: Implement backend endpoint POST /api/payments/portal
 */
export async function createPortalSession(): Promise<{ portalUrl: string }> {
  // TODO: Replace with actual API call
  // const response = await api.post<{ portalUrl: string }>('/payments/portal', {})
  // return response
  console.log('[payments] createPortalSession stub')
  return { portalUrl: '#portal-stub' }
}

/**
 * Get the current user's subscription status.
 * TODO: Implement backend endpoint GET /api/payments/subscription
 */
export async function getSubscriptionStatus(): Promise<Subscription> {
  // TODO: Replace with actual API call
  // const response = await api.get<Subscription>('/payments/subscription')
  // return response
  console.log('[payments] getSubscriptionStatus stub')
  return {
    id: 'sub_mock',
    status: 'none',
    planId: 'free',
    planName: 'Free',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  }
}

export type { Subscription }
export { defaultPlans, type PricingPlan, type SubscriptionStatus, type StripeConfig } from './stripe-config'

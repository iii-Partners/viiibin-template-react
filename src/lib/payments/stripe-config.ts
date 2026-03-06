/** Stripe configuration types for payment integration */

export type StripeConfig = {
  publishableKey: string
  /** Price IDs from your Stripe dashboard */
  prices: Record<string, string>
}

export type PricingPlan = {
  id: string
  name: string
  description: string
  /** Monthly price in cents */
  priceMonthly: number
  /** Annual price in cents (total per year) */
  priceAnnual: number
  /** Currency code */
  currency: string
  /** Feature list for display */
  features: string[]
  /** Whether this is the recommended/highlighted plan */
  highlighted?: boolean
  /** Stripe Price ID for monthly billing */
  stripePriceIdMonthly?: string
  /** Stripe Price ID for annual billing */
  stripePriceIdAnnual?: string
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'none'

export type Subscription = {
  id: string
  status: SubscriptionStatus
  planId: string
  planName: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

/** Default plan structure for the pricing page */
export const defaultPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'usd',
    features: [
      'Basic features',
      'Community support',
      'Up to 1 project',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and growing teams',
    priceMonthly: 1999, // $19.99
    priceAnnual: 19990, // $199.90
    currency: 'usd',
    highlighted: true,
    features: [
      'All Free features',
      'Priority support',
      'Unlimited projects',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 9999, // $99.99
    priceAnnual: 99990, // $999.90
    currency: 'usd',
    features: [
      'All Pro features',
      'Dedicated support',
      'SSO / SAML',
      'Custom contracts',
      'SLA guarantees',
      'Audit logs',
    ],
  },
]

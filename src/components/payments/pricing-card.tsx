import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { PricingPlan } from '@/lib/payments/stripe-config'
import { createCheckoutSession } from '@/lib/payments'

type PricingCardProps = {
  plan: PricingPlan
  interval?: 'monthly' | 'annual'
  currentPlanId?: string
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

/**
 * Displays a single pricing plan with features, price, and CTA.
 */
export function PricingCard({ plan, interval = 'monthly', currentPlanId }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const isCurrent = currentPlanId === plan.id
  const price = interval === 'monthly' ? plan.priceMonthly : plan.priceAnnual
  const periodLabel = interval === 'monthly' ? '/mo' : '/yr'

  async function handleSelect() {
    if (isCurrent || plan.priceMonthly === 0) return
    setLoading(true)
    try {
      const { sessionUrl } = await createCheckoutSession(plan.id, interval)
      if (sessionUrl && sessionUrl !== '#checkout-stub') {
        window.location.href = sessionUrl
      }
    } catch (error) {
      console.error('[pricing] Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        plan.highlighted && 'border-primary shadow-md',
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Popular
        </div>
      )}

      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">
            {price === 0 ? 'Free' : formatPrice(price, plan.currency)}
          </span>
          {price > 0 && (
            <span className="text-sm text-muted-foreground">{periodLabel}</span>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.highlighted ? 'default' : 'outline'}
          disabled={isCurrent || loading}
          onClick={handleSelect}
        >
          {isCurrent
            ? 'Current Plan'
            : loading
              ? 'Loading...'
              : price === 0
                ? 'Get Started'
                : 'Subscribe'}
        </Button>
      </CardFooter>
    </Card>
  )
}

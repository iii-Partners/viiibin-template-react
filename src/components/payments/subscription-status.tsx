import { useSubscriptionStore } from '@/stores/subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createPortalSession } from '@/lib/payments'
import { useState } from 'react'

const statusLabels: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past Due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  incomplete: 'Incomplete',
  none: 'No Subscription',
}

const statusColors: Record<string, string> = {
  active: 'text-green-600 dark:text-green-400',
  trialing: 'text-blue-600 dark:text-blue-400',
  past_due: 'text-yellow-600 dark:text-yellow-400',
  canceled: 'text-muted-foreground',
  unpaid: 'text-destructive',
  incomplete: 'text-yellow-600 dark:text-yellow-400',
  none: 'text-muted-foreground',
}

/**
 * Displays the user's current subscription status,
 * plan name, and next billing date.
 */
export function SubscriptionStatus() {
  const { status, planName, currentPeriodEnd, cancelAtPeriodEnd, isLoading } =
    useSubscriptionStore()
  const [portalLoading, setPortalLoading] = useState(false)

  async function handleManage() {
    setPortalLoading(true)
    try {
      const { portalUrl } = await createPortalSession()
      if (portalUrl && portalUrl !== '#portal-stub') {
        window.location.href = portalUrl
      }
    } catch (error) {
      console.error('[subscription] Portal error:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading subscription details...</p>
        </CardContent>
      </Card>
    )
  }

  const formattedDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your plan and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan</span>
            <span className="text-sm">{planName ?? 'Free'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <span className={`text-sm font-medium ${statusColors[status] ?? ''}`}>
              {statusLabels[status] ?? status}
            </span>
          </div>

          {formattedDate && status !== 'none' && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {cancelAtPeriodEnd ? 'Expires on' : 'Next billing'}
              </span>
              <span className="text-sm">{formattedDate}</span>
            </div>
          )}

          {cancelAtPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              Your subscription will not renew after the current period.
            </p>
          )}
        </div>

        {status !== 'none' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManage}
            disabled={portalLoading}
            className="w-full"
          >
            {portalLoading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

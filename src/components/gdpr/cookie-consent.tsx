import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/hooks/use-consent'
import { cn } from '@/lib/utils/cn'

/**
 * Cookie consent banner shown on first visit.
 * Allows Accept All, Reject All, or Customize.
 * Persists choice to localStorage.
 */
export function CookieConsent() {
  const { showBanner, acceptAll, rejectAll, consent, updateConsent } = useConsent()
  const [showCustomize, setShowCustomize] = useState(false)

  if (!showBanner) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-4 shadow-lg">
        {!showCustomize ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Cookie Preferences</h3>
              <p className="text-xs text-muted-foreground">
                We use cookies to improve your experience. You can choose which categories
                of cookies you allow. Essential cookies are always active as they are necessary
                for the site to function.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={rejectAll}>
                Reject All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCustomize(true)}
              >
                Customize
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Customize Cookie Preferences</h3>
              <p className="text-xs text-muted-foreground">
                Choose which types of cookies you want to allow.
              </p>
            </div>

            <div className="space-y-3">
              {/* Necessary — always on */}
              <ConsentToggle
                label="Necessary"
                description="Required for the site to function. Cannot be disabled."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />

              {/* Analytics */}
              <ConsentToggle
                label="Analytics"
                description="Help us understand how you use the site so we can improve it."
                checked={consent.analytics}
                onChange={(checked) => updateConsent({ analytics: checked })}
              />

              {/* Marketing */}
              <ConsentToggle
                label="Marketing"
                description="Used to show you relevant advertisements and measure their effectiveness."
                checked={consent.marketing}
                onChange={(checked) => updateConsent({ marketing: checked })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Save current custom state — it's already updated via updateConsent
                  setShowCustomize(false)
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type ConsentToggleProps = {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ConsentToggle({ label, description, checked, disabled, onChange }: ConsentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  )
}

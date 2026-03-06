import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useConsent } from '@/hooks/use-consent'
import { requestDataExport, requestAccountDeletion } from '@/lib/gdpr/data-export'
import { cn } from '@/lib/utils/cn'

/**
 * Settings panel for managing privacy preferences after initial consent.
 * Includes consent toggles and GDPR data rights (export, deletion).
 */
export function PrivacyControls() {
  const { consent, updateConsent } = useConsent()
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleExport() {
    setExportLoading(true)
    try {
      await requestDataExport()
      toast.success('Data export requested. You will receive an email when it is ready.')
    } catch {
      toast.error('Failed to request data export. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await requestAccountDeletion()
      toast.success('Account deletion requested. You will receive a confirmation email.')
      setShowDeleteConfirm(false)
    } catch {
      toast.error('Failed to request account deletion. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Consent preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Preferences</CardTitle>
          <CardDescription>
            Manage which types of cookies and tracking you allow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConsentRow
            label="Necessary"
            description="Required for the site to function. Cannot be disabled."
            checked={true}
            disabled={true}
            onChange={() => {}}
          />
          <ConsentRow
            label="Analytics"
            description="Help us understand how you use the site."
            checked={consent.analytics}
            onChange={(checked) => updateConsent({ analytics: checked })}
          />
          <ConsentRow
            label="Marketing"
            description="Used for relevant advertisements."
            checked={consent.marketing}
            onChange={(checked) => updateConsent({ marketing: checked })}
          />
        </CardContent>
      </Card>

      {/* Data rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Data</CardTitle>
          <CardDescription>
            Exercise your data rights under GDPR and similar privacy regulations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export your data</p>
              <p className="text-xs text-muted-foreground">
                Download a copy of all your data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? 'Requesting...' : 'Export Data'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Delete your account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type ConsentRowProps = {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ConsentRow({ label, description, checked, disabled, onChange }: ConsentRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
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

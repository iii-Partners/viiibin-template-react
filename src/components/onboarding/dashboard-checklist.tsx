import { useOnboardingStore } from '@/stores/onboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

type ChecklistItem = {
  id: string
  label: string
  description: string
  href: string
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'profile',
    label: 'Complete your profile',
    description: 'Add your name and details',
    href: '/app/profile',
  },
  {
    id: 'preferences',
    label: 'Set your preferences',
    description: 'Configure notifications and theme',
    href: '/app/settings',
  },
  {
    id: 'done',
    label: 'Explore features',
    description: 'Check out what the app can do',
    href: '/app/dashboard',
  },
]

/**
 * Dashboard widget showing onboarding completion progress.
 * Each item links to the relevant page if not yet completed.
 */
export function DashboardChecklist() {
  const { completedSteps } = useOnboardingStore()

  const completedCount = checklistItems.filter((item) =>
    completedSteps.includes(item.id),
  ).length
  const totalCount = checklistItems.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>
          {completedCount === totalCount
            ? 'All done! You are all set up.'
            : `${completedCount} of ${totalCount} steps complete`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist items */}
        <ul className="space-y-3">
          {checklistItems.map((item) => {
            const isComplete = completedSteps.includes(item.id)
            return (
              <li key={item.id}>
                <a
                  href={isComplete ? undefined : item.href}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-2 transition-colors',
                    !isComplete && 'hover:bg-muted cursor-pointer',
                    isComplete && 'opacity-60',
                  )}
                >
                  {/* Checkmark / circle */}
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      isComplete
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30',
                    )}
                  >
                    {isComplete && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isComplete && 'line-through',
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

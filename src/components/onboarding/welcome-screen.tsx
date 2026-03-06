import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'

type WelcomeScreenProps = {
  onGetStarted: () => void
}

/**
 * Full-screen welcome overlay for first-time users.
 * Only rendered when onboarding is not yet complete.
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="mx-auto max-w-lg space-y-8 px-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to {env.VITE_APP_NAME}
          </h1>
          <p className="text-lg text-muted-foreground">
            {env.VITE_APP_DESCRIPTION || "Let's get you set up in just a few steps."}
          </p>
        </div>

        <Button size="lg" onClick={onGetStarted} className="px-8">
          Get Started
        </Button>

        <p className="text-xs text-muted-foreground">
          This will only take a minute.
        </p>
      </div>
    </div>
  )
}

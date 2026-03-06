import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOnboardingStore } from '@/stores/onboarding'
import { OnboardingStep } from './onboarding-step'
import { cn } from '@/lib/utils/cn'

type Step = {
  id: string
  title: string
  description: string
  content: React.ReactNode
}

const steps: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'We are glad you are here. Let us help you get started.',
    content: (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-10 w-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          This quick setup will help you personalize your experience and get the most out of the app.
        </p>
      </div>
    ),
  },
  {
    id: 'profile',
    title: 'Set Up Your Profile',
    description: 'Tell us a bit about yourself so we can personalize your experience.',
    content: (
      <div className="space-y-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          Head to your profile page to add your name and details.
          You can always update this later in Settings.
        </p>
      </div>
    ),
  },
  {
    id: 'preferences',
    title: 'Your Preferences',
    description: 'Configure notifications and display settings.',
    content: (
      <div className="space-y-4 py-4">
        <p className="text-center text-sm text-muted-foreground">
          You can customize notifications, theme, and language preferences
          from the Settings page at any time.
        </p>
      </div>
    ),
  },
  {
    id: 'done',
    title: 'You are All Set!',
    description: 'Your account is ready to go.',
    content: (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg
            className="h-10 w-10 text-green-600 dark:text-green-400"
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
        </div>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          You can revisit any of these settings from the dashboard checklist or the Settings page.
        </p>
      </div>
    ),
  },
]

/**
 * Multi-step onboarding wizard with step indicator, navigation buttons.
 * Tracks progress via the onboarding Zustand store.
 */
export function OnboardingWizard() {
  const { completeStep, setCompleted, setCurrentStep, currentStep } = useOnboardingStore()
  const [activeStep, setActiveStep] = useState(currentStep)

  const step = steps[activeStep]
  const isFirst = activeStep === 0
  const isLast = activeStep === steps.length - 1

  function handleNext() {
    if (step) {
      completeStep(step.id)
    }

    if (isLast) {
      setCompleted(true)
      setCurrentStep(0)
      return
    }

    const next = activeStep + 1
    setActiveStep(next)
    setCurrentStep(next)
  }

  function handleBack() {
    if (isFirst) return
    const prev = activeStep - 1
    setActiveStep(prev)
    setCurrentStep(prev)
  }

  function handleSkip() {
    setCompleted(true)
    setCurrentStep(0)
  }

  if (!step) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-lg">
        <CardContent className="p-6">
          {/* Step indicator dots */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i === activeStep ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            ))}
          </div>

          <OnboardingStep title={step.title} description={step.description}>
            {step.content}
          </OnboardingStep>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirst}
              className={cn(isFirst && 'invisible')}
            >
              Back
            </Button>

            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
              Skip
            </Button>

            <Button onClick={handleNext}>
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

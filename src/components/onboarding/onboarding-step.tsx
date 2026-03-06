import type { ReactNode } from 'react'

type OnboardingStepProps = {
  title: string
  description: string
  children: ReactNode
}

/**
 * Individual step wrapper for the onboarding wizard.
 * Provides consistent title, description, and content slot layout.
 */
export function OnboardingStep({ title, description, children }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

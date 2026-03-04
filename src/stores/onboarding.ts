import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Onboarding store — first-run experience progress.
 *
 * Persistence: localStorage (so onboarding isn't repeated)
 * Hydration: 4th (non-blocking)
 */
type OnboardingState = {
  completed: boolean
  currentStep: number
  completedSteps: string[]
  setCompleted: (completed: boolean) => void
  setCurrentStep: (step: number) => void
  completeStep: (stepId: string) => void
  reset: () => void
}

const defaults = {
  completed: false,
  currentStep: 0,
  completedSteps: [] as string[],
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...defaults,
      setCompleted: (completed) => set({ completed }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      completeStep: (stepId) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(stepId)
            ? state.completedSteps
            : [...state.completedSteps, stepId],
        })),
      reset: () => set(defaults),
    }),
    { name: 'onboarding' },
  ),
)

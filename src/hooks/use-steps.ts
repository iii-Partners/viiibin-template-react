import { useItemsFor } from '@/hooks/use-items-for'
import { useOnboardingStore } from '@/stores/onboarding'
import { STEPS } from '@/lib/getting-started'

/** The getting-started steps with their state: done by the store, or (the first item) by the items themselves. While
 *  the items have not loaded or failed to, the first-item step is unknown (null): it neither waits on the viewer nor
 *  counts as done, so a failure never asks the viewer to add a first item they may already have. */
export function useSteps(part = 'dashboard') {
  const completed = useOnboardingStore((s) => s.completedSteps)
  const { data } = useItemsFor(part)
  return STEPS.map((s) => ({ ...s, done: s.id === 'first-item' ? (data ? data.total > 0 : null) : completed.includes(s.id) }))
}

/** How many things wait on the viewer: the count on Needs you and on the nav's badge (the dashboard's reading). */
export const useNeedsCount = () => useSteps().filter((s) => s.done === false).length

import { useItems } from '@/hooks/use-items'
import { sampleItems } from '@/lib/sample-items'
import { usePreview, usePreviewOf } from '@/stores/preview'

/**
 * The items as one part sees them: the live query, or the state its switch previews. The result has the query's
 * shape (data, isLoading, error, refetch), so the part renders each state through its own code. Try again on a
 * previewed error returns the part to live.
 */
export function useItemsFor(part: string) {
  const live = useItems()
  const state = usePreviewOf(part)
  const back = () => usePreview.getState().set(part, 'live')
  switch (state) {
    case 'happy': {
      const items = sampleItems()
      return { data: { items, total: items.length, limit: 50, offset: 0 }, isLoading: false, error: null, refetch: back, preview: state }
    }
    case 'empty':
      return { data: { items: [], total: 0, limit: 50, offset: 0 }, isLoading: false, error: null, refetch: back, preview: state }
    case 'loading':
      return { data: undefined, isLoading: true, error: null, refetch: back, preview: state }
    case 'error':
      return { data: undefined, isLoading: false, error: { message: 'Previewed failure' } as Error, refetch: back, preview: state }
    default:
      return { data: live.data, isLoading: live.isLoading, error: live.error, refetch: () => void live.refetch(), preview: state }
  }
}

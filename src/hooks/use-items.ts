import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsApi } from '@/lib/api/items'
import { queryKeys } from '@/lib/api/query-keys'

export function useItems(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.items.list(params),
    queryFn: () => itemsApi.list(params),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

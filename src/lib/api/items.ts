import { api } from './client'

// Item types — matches the D1 schema in db/schema.ts
export type Item = {
  id: number
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export type ItemsListResponse = {
  items: Item[]
  total: number
  limit: number
  offset: number
}

export type ItemResponse = {
  item: Item
}

// Items API — calls CF Pages Functions at /api/items
export const itemsApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    const qs = searchParams.toString()
    return api.get<ItemsListResponse>(`/items${qs ? `?${qs}` : ''}`)
  },

  get: (id: number) => api.get<ItemResponse>(`/items/${id}`),

  create: (data: { title: string; description?: string }) =>
    api.post<ItemResponse>('/items', data),

  update: (id: number, data: { title?: string; description?: string; status?: string }) =>
    api.patch<ItemResponse>(`/items/${id}`, data),

  delete: (id: number) => api.delete<{ success: boolean }>(`/items/${id}`),
}

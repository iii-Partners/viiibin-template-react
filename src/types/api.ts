export type ApiError = {
  message: string
  code?: string
  status: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

import type { ApiError } from '@/types/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

type RequestOptions = RequestInit & {
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const error: ApiError = {
      message: 'Request failed',
      status: response.status,
    }
    try {
      const body = await response.json()
      error.message = body.message || body.error || error.message
      error.code = body.code
    } catch {
      // ignore parse error
    }
    throw error
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

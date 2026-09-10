import type { ApiError } from '@/types/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * The signed-in user's access-token provider, registered by the Auth0 layer
 * (`src/app/providers.tsx`). This app's own backend (`functions/_middleware.ts`)
 * protects `/api/*` and `POST /mcp`, so every request must carry the user's JWT —
 * an explicit `token` still wins, but otherwise we fetch it here so callers/hooks
 * don't each have to. `null` when auth is disabled or the user isn't signed in yet.
 */
let getToken: (() => Promise<string | null>) | null = null
export function setApiTokenProvider(fn: (() => Promise<string | null>) | null) {
  getToken = fn
}

type RequestOptions = RequestInit & {
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  let bearer = token
  if (!bearer && getToken) {
    try {
      bearer = (await getToken()) ?? undefined
    } catch {
      // not signed in yet — send the request unauthenticated and let the API answer 401
    }
  }
  if (bearer) {
    headers.set('Authorization', `Bearer ${bearer}`)
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

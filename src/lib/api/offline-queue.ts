const STORAGE_KEY = 'viiibin_offline_queue'

type QueuedRequest = {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  timestamp: number
}

type OfflineQueue = {
  /** Add a failed request to the queue for later retry */
  add: (request: QueuedRequest) => void
  /** Flush all queued requests (retries them in order) */
  flush: () => Promise<FlushResult>
  /** Get all pending requests */
  pending: () => QueuedRequest[]
  /** Remove a specific request by ID */
  remove: (id: string) => void
  /** Clear all pending requests */
  clear: () => void
}

type FlushResult = {
  succeeded: number
  failed: number
  remaining: QueuedRequest[]
}

function loadQueue(): QueuedRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as QueuedRequest[]
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Offline request queue that persists failed API requests to localStorage
 * and retries them when connectivity returns.
 *
 * Usage:
 * ```ts
 * // When a request fails due to network error
 * offlineQueue.add({
 *   id: offlineQueue.generateId(),
 *   url: '/api/items',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'item' }),
 *   timestamp: Date.now(),
 * })
 *
 * // When back online
 * const result = await offlineQueue.flush()
 * ```
 */
export const offlineQueue: OfflineQueue = {
  add(request: QueuedRequest) {
    const queue = loadQueue()
    queue.push({
      ...request,
      id: request.id || generateId(),
      timestamp: request.timestamp || Date.now(),
    })
    saveQueue(queue)
  },

  async flush(): Promise<FlushResult> {
    const queue = loadQueue()
    if (queue.length === 0) {
      return { succeeded: 0, failed: 0, remaining: [] }
    }

    let succeeded = 0
    let failed = 0
    const stillFailing: QueuedRequest[] = []

    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        })

        if (response.ok || (response.status >= 400 && response.status < 500)) {
          // Success, or a client error (no point retrying 4xx)
          succeeded++
        } else {
          // Server error — keep for retry
          failed++
          stillFailing.push(request)
        }
      } catch {
        // Network error — keep for retry
        failed++
        stillFailing.push(request)
      }
    }

    saveQueue(stillFailing)
    return { succeeded, failed, remaining: stillFailing }
  },

  pending(): QueuedRequest[] {
    return loadQueue()
  },

  remove(id: string) {
    const queue = loadQueue().filter((r) => r.id !== id)
    saveQueue(queue)
  },

  clear() {
    saveQueue([])
  },
}

export type { QueuedRequest, FlushResult }

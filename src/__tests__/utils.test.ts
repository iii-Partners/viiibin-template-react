import { describe, it, expect, vi } from 'vitest'

// Mock import.meta.env for env.ts
vi.stubEnv('VITE_APP_NAME', 'Test App')
vi.stubEnv('VITE_AUTH0_DOMAIN', '')
vi.stubEnv('VITE_AUTH0_CLIENT_ID', '')

describe('cn utility', () => {
  it('merges class names', async () => {
    const { cn } = await import('@/lib/utils/cn')
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', async () => {
    const { cn } = await import('@/lib/utils/cn')
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})

describe('format utilities', () => {
  it('exports format functions', async () => {
    const mod = await import('@/lib/utils/format')
    expect(mod).toBeDefined()
  })
})

describe('platform utilities', () => {
  it('exports platform detection', async () => {
    const mod = await import('@/lib/utils/platform')
    expect(mod).toBeDefined()
  })
})

describe('auth config', () => {
  it('detects auth as disabled when env vars empty', async () => {
    const { isAuthEnabled } = await import('@/lib/auth/config')
    expect(isAuthEnabled).toBe(false)
  })
})

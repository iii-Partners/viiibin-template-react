// @vitest-environment node
/**
 * Delivery is not acceptance. Written after 2026-10-19, when a schema-valid heartbeat was accepted, the flush failed
 * with a transport error, `emit()` returned true, and GET /api/health said `reporting` while nothing had been sent.
 *
 * `node` environment on purpose: under vitest's DOM environment `fetch` rejects with
 * "Expected signal to be an instance of AbortSignal", so a DOM-env test cannot see a real transport failure at all —
 * which is why no existing test caught this.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const KEY = 'phc_' + 'x'.repeat(43)
const base = {
  VENTURE_ID: 'test-venture',
  PILLAR: 'test-pillar',
  APP_ENV: 'test',
  APP_NAME: 'delivery test',
}

async function fresh() {
  vi.resetModules()
  return await import('../_lib/telemetry')
}

describe('telemetry delivery', () => {
  beforeEach(() => vi.resetModules())

  it('no key: accepted, not delivered, and says why', async () => {
    const t = await fresh()
    const env = { ...base }
    expect(t.telemetryFor(env).configured).toBe(false)
    const r = await t.emitNow(env, 'heartbeat', {
      actor_type: 'agent',
      actor_id: 'test',
      run_id: 'r0',
    })
    expect(r.accepted).toBe(true)
    expect(r.delivered).toBe(false)
    expect(r.error).toMatch(/POSTHOG_KEY/)
  })

  it('a schema refusal is not acceptance', async () => {
    const t = await fresh()
    // the kit requires run_id AND actor_type/actor_id on a heartbeat; omit the actor and it must refuse
    const r = await t.emitNow({ ...base, POSTHOG_KEY: KEY }, 'heartbeat', { run_id: 'x' })
    expect(r.accepted, 'missing actor_type/actor_id must be refused').toBe(false)
    expect(r.delivered).toBe(false)
  })

  it('THE REGRESSION: a transport failure is reported, not swallowed', async () => {
    const t = await fresh()
    // a real, unreachable host — the transport genuinely fails, no mock
    const env = { ...base, POSTHOG_KEY: KEY, POSTHOG_HOST: 'http://127.0.0.1:1' }
    const r = await t.emitNow(env, 'heartbeat', {
      actor_type: 'agent',
      actor_id: 'test',
      run_id: 'r1',
    })
    expect(r.accepted, 'the schema accepts it').toBe(true)
    expect(r.delivered, 'and it was NOT delivered — this is what emit() used to call true').toBe(
      false,
    )
    expect(r.error, 'the reason is carried, not logged and lost').toBeTruthy()
    const d = t.deliveryStatus(env)
    expect(d.failed, 'the failure is counted for /api/health to report').toBeGreaterThan(0)
    expect(d.sent).toBe(0)
  }, 30000)

  it('PILLAR has no default: unset is `unset`, never `template`', async () => {
    const t = await fresh()
    expect(t.pillarOf({ ...base, PILLAR: undefined })).toBe('unset')
    expect(t.pillarOf({ ...base, PILLAR: 'eye' })).toBe('eye')
  })
})

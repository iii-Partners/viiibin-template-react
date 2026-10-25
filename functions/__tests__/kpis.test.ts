// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import {
  declareKpi,
  recordKpiObservation,
  readKpis,
  readKpiObservation,
  type KpiEnv,
} from '../_lib/kpis'
import { onRequestGet } from '../api/kpis'

const definition = {
  contract: 'kpi-definition/v1', kpi_key: 'queue_time', version: 1,
  label: 'Queue time', unit: 'hours', category: 'cycle_time', better_is_lower: true,
  discovery_ref: 'synthetic:discovery:1', approval_ref: 'synthetic:approval:1',
  source_ref: 'synthetic:queue-query', max_age_seconds: 86400,
}
const observation = {
  observation_id: 'obs_1', kpi_key: 'queue_time', definition_version: 1,
  value: 0, missing_reason: null, source_ref: 'synthetic:row:1',
  period: { start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' },
}
const now = new Date('2026-10-21T01:00:00Z')

function fixture() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync('db/migrations/0001_kpi_spine.sql', 'utf8'))
  // Real SQLite statements, not canned query answers. D1 also implements SQLite.
  const db = {
    prepare(sql: string) {
      let values: (string | number | null)[] = []
      const stmt = {
        bind(...args: (string | number | null)[]) { values = args; return stmt },
        async first() { return sqlite.prepare(sql).get(...values) ?? null },
        async all() { return { results: sqlite.prepare(sql).all(...values), success: true } },
        async run() { sqlite.prepare(sql).run(...values); return { success: true } },
      }
      return stmt
    },
  } as unknown as D1Database
  const env: KpiEnv = { DB: db, VENTURE_ID: 'synthetic-a', KPI_READ_API_KEYS: 'vk_kpi_public_test_constant' }
  return { env, sqlite }
}

describe('OS-K1 discovery and append-only observation contract', () => {
  it('empty is unmeasured, not a made-up KPI or zero', async () => {
    const { env } = fixture()
    expect((await readKpis(env, now)).kpis).toEqual([])
    await declareKpi(env, definition)
    expect((await readKpis(env, now)).kpis[0]).toMatchObject({ state: 'unmeasured', observation: null })
  })

  it('validates missing/undetermined inputs, unknown fields, invalid periods and missingness', async () => {
    const { env } = fixture()
    for (const bad of [
      { ...definition, discovery_ref: '' }, { ...definition, approval_ref: 'undetermined' },
      { ...definition, venture_id: 'other' }, { ...definition, version: 0 },
      { ...definition, unit: '' }, { ...definition, max_age_seconds: 0 },
      { ...definition, source_ref: 'someone@example.com' },
    ]) await expect(declareKpi(env, bad)).rejects.toThrow('invalid_definition')
    await declareKpi(env, definition)
    for (const bad of [
      { ...observation, value: null }, { ...observation, value: Infinity },
      { ...observation, value: 2, missing_reason: 'unavailable' },
      { ...observation, period: { start: observation.period.end, end: observation.period.start } },
      { ...observation, venture_id: 'other' }, { ...observation, source_ref: '' },
    ]) await expect(recordKpiObservation(env, bad)).rejects.toThrow('invalid_observation')
    await expect(readKpis({ ...env, VENTURE_ID: undefined }, now)).rejects.toThrow('venture_not_configured')
    await expect(readKpis({ ...env, DB: undefined }, now)).rejects.toThrow('storage_not_configured')
  })

  it('keeps actual zero, null, stale and delayed older observations distinct', async () => {
    const { env } = fixture()
    await declareKpi(env, definition)
    await recordKpiObservation(env, observation)
    const first = (await readKpis(env, now)).kpis[0]
    expect(first).toMatchObject({ state: 'measured', observation: { value: 0 } })
    expect(first).not.toHaveProperty('delta')
    expect((await readKpis(env, new Date('2026-10-23T00:00:00Z'))).kpis[0].state).toBe('stale')
    await recordKpiObservation(env, { ...observation, observation_id: 'older', value: 99,
      period: { start: '2026-10-19T00:00:00Z', end: '2026-10-20T00:00:00Z' } })
    expect((await readKpis(env, now)).kpis[0].observation?.value).toBe(0)
    await recordKpiObservation(env, { ...observation, observation_id: 'missing', value: null,
      missing_reason: 'source_unavailable', period: { start: '2026-10-21T00:00:00Z', end: '2026-10-22T00:00:00Z' } })
    expect((await readKpis(env, new Date('2026-10-22T01:00:00Z'))).kpis[0]).toMatchObject({
      state: 'unmeasured', observation: { value: null, missing_reason: 'source_unavailable' },
    })
  })

  it('retries idempotently, rejects replay changes, and freezes meaning across versions', async () => {
    const { env, sqlite } = fixture()
    await declareKpi(env, definition)
    await declareKpi(env, definition)
    await recordKpiObservation(env, observation)
    await recordKpiObservation(env, observation)
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM os_kpi_observations').get()?.n).toBe(1)
    await expect(recordKpiObservation(env, { ...observation, value: 7 })).rejects.toThrow('observation_conflict')
    await expect(declareKpi(env, { ...definition, label: 'Changed' })).rejects.toThrow('definition_conflict')
    await expect(declareKpi(env, { ...definition, version: 2, unit: 'minutes' })).rejects.toThrow('definition_meaning_changed')
    await declareKpi(env, { ...definition, version: 2, source_ref: 'synthetic:query-v2' })
    expect((await readKpis(env, now)).kpis[0]).toMatchObject({
      definition: { version: 2 }, state: 'unmeasured', observation: null,
    })
    expect(await readKpiObservation(env, 'obs_1')).toMatchObject({ definition: { version: 1 }, observation: { value: 0 } })
    await expect(recordKpiObservation(env, { ...observation, observation_id: 'unknown', kpi_key: 'missing_key' })).rejects.toThrow('definition_not_found')
  })

  it('selects the last append for an equal period/timestamp even when ids sort backwards', async () => {
    const { env, sqlite } = fixture()
    await declareKpi(env, definition)
    const insert = sqlite.prepare(`INSERT INTO os_kpi_observations
      (venture_id, observation_id, kpi_key, definition_version, value, source_ref, period_start, period_end, recorded_at)
      VALUES ('synthetic-a', ?, 'queue_time', 1, ?, 'synthetic:row', ?, ?, '2026-10-21T00:00:01Z')`)
    insert.run('tie_z', 9, observation.period.start, observation.period.end)
    insert.run('tie_a', 1, observation.period.start, observation.period.end)
    expect((await readKpis(env, now)).kpis[0].observation?.value).toBe(1)
  })

  it('enforces append-only history and meaning in the database, even for direct SQL', async () => {
    const { env, sqlite } = fixture()
    await declareKpi(env, definition)
    await recordKpiObservation(env, observation)
    for (const sql of [
      'UPDATE os_kpi_definitions SET version = 9', 'DELETE FROM os_kpi_definitions',
      'UPDATE os_kpi_observations SET value = 9', 'DELETE FROM os_kpi_observations',
    ]) expect(() => sqlite.exec(sql)).toThrow('append-only')
    // SQLite REPLACE can delete without invoking DELETE triggers unless guarded at INSERT.
    for (const table of ['os_kpi_definitions', 'os_kpi_observations']) {
      expect(() => sqlite.exec(`INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`)).toThrow('append-only')
    }
    expect(() => sqlite.exec("INSERT INTO os_kpi_definitions SELECT venture_id, kpi_key, 3, 'minutes', category, better_is_lower, definition_json FROM os_kpi_definitions")).toThrow('definition_meaning_changed')
  })

  it('binds tenants on the server, including a direct observation read-back', async () => {
    const { env } = fixture()
    await declareKpi(env, definition)
    await recordKpiObservation(env, observation)
    const other = { ...env, VENTURE_ID: 'synthetic-b' }
    expect((await readKpis(other, now)).kpis).toEqual([])
    expect(await readKpiObservation(other, 'obs_1')).toBeNull()
    await declareKpi(other, { ...definition, label: 'Other queue' })
    await recordKpiObservation(other, { ...observation, value: 42 })
    expect((await readKpis(env, now)).kpis[0].observation?.value).toBe(0)
    expect((await readKpis(other, now)).kpis[0].observation?.value).toBe(42)
  })

  it('refuses end-user reads, caller scope overrides and unreadable storage', async () => {
    const { env } = fixture()
    const call = (url: string, kind: string, target: KpiEnv = env) => onRequestGet({
      env: target, request: new Request(url, { headers: { authorization: 'Bearer vk_kpi_public_test_constant' } }),
      data: { identity: { kind } },
    } as unknown as Parameters<typeof onRequestGet>[0]) as Promise<Response>
    expect((await call('https://synthetic.invalid/api/kpis', 'user')).status).toBe(403)
    expect((await call('https://synthetic.invalid/api/kpis?venture_id=synthetic-b', 'machine')).status).toBe(400)
    const bad = { ...env, DB: { prepare() { throw new Error('private storage detail') } } as unknown as D1Database }
    const failure = await call('https://synthetic.invalid/api/kpis', 'machine', bad)
    expect(failure.status).toBe(503)
    expect(await failure.json()).toEqual({ error: 'kpi_storage_unavailable' })
    expect(failure.headers.get('cache-control')).toBe('no-store')
  })

  it('requires a determined KPI read grant beyond ordinary machine authentication', async () => {
    const { env } = fixture()
    const call = (credential: string, target: KpiEnv = env) => onRequestGet({
      env: target, request: new Request('https://synthetic.invalid/api/kpis', {
        headers: { authorization: `Bearer ${credential}` },
      }), data: { identity: { kind: 'machine' } },
    } as unknown as Parameters<typeof onRequestGet>[0]) as Promise<Response>
    expect((await call('vk_business_public_test_constant')).status).toBe(403)
    expect((await call('')).status).toBe(403)
    const absent = await call('vk_kpi_public_test_constant', { ...env, KPI_READ_API_KEYS: undefined })
    expect(absent.status).toBe(503)
    expect(await absent.json()).toEqual({ error: 'kpi_read_identity_not_configured' })
    expect((await call('vk_kpi_public_test_constant', { ...env, KPI_READ_API_KEYS: 'undetermined' })).status).toBe(503)
  })
})

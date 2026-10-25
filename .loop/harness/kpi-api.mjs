import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

// Only local Wrangler/D1, synthetic data and a public test constant. Never use a deployed URL.
mkdirSync('.loop/state', { recursive: true })
const dir = mkdtempSync(resolve('.loop/state/kpi-api-'))
const persist = resolve(dir, 'd1')
const wrangler = resolve('node_modules/wrangler/bin/wrangler.js')
const run = (args) => execFileSync(process.execPath, [wrangler, ...args], {
  encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
})
const sql = (command) => run(['d1', 'execute', 'DB', '--local', '--persist-to', persist, '--command', command])
run(['d1', 'execute', 'DB', '--local', '--persist-to', persist, '--file', 'db/migrations/0001_kpi_spine.sql'])
const definition = { contract: 'kpi-definition/v1', kpi_key: 'queue_time', version: 1,
  label: 'Synthetic queue time', unit: 'hours', category: 'cycle_time', better_is_lower: true,
  discovery_ref: 'synthetic:discovery:1', approval_ref: 'synthetic:approval:1',
  source_ref: 'synthetic:query', max_age_seconds: 86400 }
const quoted = (s) => `'${s.replaceAll("'", "''")}'`
for (const venture of ['synthetic-a', 'synthetic-b']) {
  sql(`INSERT INTO os_kpi_definitions VALUES ('${venture}', 'queue_time', 1, 'hours', 'cycle_time', 1, ${quoted(JSON.stringify(definition))})`)
}
const end = new Date(Date.now() - 3600000).toISOString()
const start = new Date(Date.now() - 7200000).toISOString()
sql(`INSERT INTO os_kpi_observations (venture_id, observation_id, kpi_key, definition_version, value, missing_reason, source_ref, period_start, period_end)
VALUES ('synthetic-a','obs_live','queue_time',1,0,NULL,'synthetic:row:1','${start}','${end}'),
('synthetic-b','obs_live','queue_time',1,42,NULL,'synthetic:row:2','${start}','${end}')`)
sql(`INSERT INTO os_kpi_observations (venture_id, observation_id, kpi_key, definition_version, value, source_ref, period_start, period_end)
VALUES ('synthetic-b','foreign_only','queue_time',1,42,'synthetic:row:3','${start}','${end}')`)
for (const table of ['os_kpi_definitions', 'os_kpi_observations']) {
  for (const command of [`DELETE FROM ${table}`, `INSERT OR REPLACE INTO ${table} SELECT * FROM ${table}`])
    assert.throws(() => sql(command), /append-only/, 'real D1 must reject history rewrites')
}

const child = spawn(process.execPath, [wrangler, 'pages', 'dev', 'dist', '--ip', '127.0.0.1', '--port', '0',
  '--persist-to', persist, '--binding', 'API_KEYS=vk_kpi_public_test_constant', '--binding', 'VENTURE_ID=synthetic-a'], {
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
let origin
child.stdout.on('data', (b) => { log += b; origin ??= log.match(/Ready on (http:\/\/127\.0\.0\.1:\d+)/)?.[1] })
child.stderr.on('data', (b) => { log += b })
const headers = { authorization: 'Bearer vk_kpi_public_test_constant' }
try {
  for (let i = 0; !origin && i < 200; i++) {
    assert(child.exitCode === null, 'local Pages exited before readiness')
    await delay(100)
  }
  assert(origin, 'local Pages readiness timed out')
  const call = (path = '/api/kpis', options = {}) => fetch(origin + path, { signal: AbortSignal.timeout(5000), ...options })
  const anon = await call()
  assert([401, 503].includes(anon.status), 'anonymous KPI read must fail closed')
  assert.equal((await call('/api/kpis', { headers: { authorization: 'Bearer vk_wrong_test_constant' } })).status, 401)
  const response = await call('/api/kpis', { headers })
  assert.equal(response.status, 200, 'KPI service must exist behind real Pages middleware')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json()
  assert.equal(body.contract, 'business-os-kpis/v1')
  assert.equal(body.venture_id, 'synthetic-a')
  assert.equal(body.kpis.length, 1)
  assert.equal(body.kpis[0].observation.value, 0)
  assert.equal(body.kpis[0].state, 'measured')
  assert.equal(body.kpis[0].source_verification, 'not_verified')
  assert(!JSON.stringify(body).includes('synthetic-b'))
  assert(!('delta' in body.kpis[0]))
  const proof = await call('/api/kpis?observation_id=obs_live', { headers })
  assert.equal(proof.status, 200)
  assert.equal((await proof.json()).observation.value, 0)
  assert.equal((await call('/api/kpis?venture_id=synthetic-b', { headers })).status, 400)
  assert.equal((await call('/api/kpis?observation_id=absent', { headers })).status, 404)
  assert.equal((await call('/api/kpis?observation_id=foreign_only', { headers })).status, 404)
  assert.equal((await call('/api/kpis', { headers, method: 'POST', body: '{}' })).status, 405)
  sql(`INSERT INTO os_kpi_observations (venture_id,observation_id,kpi_key,definition_version,value,missing_reason,source_ref,period_start,period_end)
    VALUES ('synthetic-a','obs_missing','queue_time',1,NULL,'source_unavailable','synthetic:query','${end}','${new Date().toISOString()}')`)
  const missing = await (await call('/api/kpis', { headers })).json()
  assert.equal(missing.kpis[0].state, 'unmeasured')
  assert.equal(missing.kpis[0].observation.value, null)
  // Fault injection on this disposable DB: unreadable storage must never become a clean empty result.
  sql('ALTER TABLE os_kpi_observations RENAME TO os_kpi_observations_unavailable')
  const unavailable = await call('/api/kpis', { headers })
  assert.equal(unavailable.status, 503)
  assert.deepEqual(await unavailable.json(), { error: 'kpi_storage_unavailable' })
  writeFileSync(resolve(dir, 'evidence.json'), JSON.stringify({ local: true, assertions: [
    'anonymous denied', 'invalid machine denied', 'scoped D1 read', 'zero distinct from null',
    'observation read-back', 'caller scope refused', 'HTTP writes refused', 'unavailable storage fails closed',
  ] }, null, 2))
  console.log('PASS: real local Pages + D1 auth, isolation, zero/null, row proof, writes and unavailable-storage contract')
} finally {
  child.kill('SIGTERM')
  await Promise.race([new Promise((r) => child.once('exit', r)), delay(5000)])
  if (child.exitCode === null) child.kill('SIGKILL')
  writeFileSync(resolve(dir, 'pages.log'), log)
  child.stdout.destroy()
  child.stderr.destroy()
}

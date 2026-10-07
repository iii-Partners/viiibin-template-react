/**
 * Starts this app's functions for the delivery tests when DELIVERY_BASE_URL is not set: `wrangler pages dev dist` on
 * 127.0.0.1:8799 with the server-side variables taken from the environment (the same names the Pages project uses).
 * Needs a build first (`npm run build`). With DELIVERY_BASE_URL set (a preview or production deployment) nothing starts.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const PORT = Number(process.env.DELIVERY_PORT || 8799)
const SERVER_VARS = ['APP_NAME', 'APP_URL', 'API_KEYS', 'RESEND_API_KEY', 'NOTIFY_FROM', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'POSTHOG_KEY', 'POSTHOG_HOST', 'VENTURE_ID', 'PILLAR', 'APP_ENV']

let child: ChildProcess | null = null

async function alive(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) })
    return r.ok
  } catch {
    return false
  }
}

export async function setup(): Promise<void> {
  try {
    fs.rmSync(path.resolve('tests/delivery/.runs.json'), { force: true })
  } catch {
    /* nothing to clear */
  }
  if (process.env.DELIVERY_BASE_URL) {
    console.log(`delivery tests run against ${process.env.DELIVERY_BASE_URL}`)
    return
  }
  if (!fs.existsSync(path.resolve('dist/index.html'))) throw new Error('delivery tests need a build first: run `npm run build` (dist/ is missing)')
  const bindings: string[] = []
  for (const k of SERVER_VARS) if (process.env[k]) bindings.push('--binding', `${k}=${process.env[k]}`)
  if (!process.env.API_KEYS && process.env.DELIVERY_API_KEY) bindings.push('--binding', `API_KEYS=${process.env.DELIVERY_API_KEY}`)
  if (!process.env.APP_URL) bindings.push('--binding', `APP_URL=http://127.0.0.1:${PORT}`)
  if (!process.env.APP_ENV) bindings.push('--binding', 'APP_ENV=test')
  child = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(PORT), '--ip', '127.0.0.1', '--compatibility-date', '2024-12-01', '--log-level', 'warn', ...bindings], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' } })
  let out = ''
  child.stdout?.on('data', (d) => { out += String(d) })
  child.stderr?.on('data', (d) => { out += String(d) })
  const url = `http://127.0.0.1:${PORT}/api/health`
  for (let i = 0; i < 90; i++) {
    if (await alive(url)) {
      process.env.DELIVERY_BASE_URL = `http://127.0.0.1:${PORT}`
      console.log(`wrangler pages dev is up on ${process.env.DELIVERY_BASE_URL}`)
      return
    }
    if (child.exitCode !== null) break
    await new Promise((r) => setTimeout(r, 1000))
  }
  await teardown()
  throw new Error(`wrangler pages dev did not answer on ${url} within 90s\n${out.slice(-2000)}`)
}

export async function teardown(): Promise<void> {
  const c = child
  child = null
  if (!c) return
  // Release the pipes first: an open stdout/stderr on the wrangler child kept vitest's event loop alive after the tests
  // ("close timed out after 10000ms", seen in CI on 2026-10-07); then stop the process and wait for it to go.
  c.stdout?.destroy()
  c.stderr?.destroy()
  if (c.exitCode === null) {
    const gone = new Promise<void>((resolve) => c.once('exit', () => resolve()))
    c.kill('SIGTERM')
    await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))])
    if (c.exitCode === null) c.kill('SIGKILL')
  }
  c.unref()
}

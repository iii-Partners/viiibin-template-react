/**
 * Shared bits for the delivery tests (DP-9, iii-eye#527).
 *
 *   DELIVERY_BASE_URL   where this app's functions answer (default: the local `wrangler pages dev` the global setup starts)
 *   DELIVERY_API_KEY    a vk_ key listed in the server's API_KEYS, so the tests pass the auth middleware like a machine would
 *   MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID, MAILOSAUR_PHONE_NUMBER   the inbox and number that receive the real sends
 *
 * Run ids the server answers (x-run-id) are appended to tests/delivery/.runs.json so an outside harness (EYE's) can read the
 * same run's telemetry back from PostHog.
 */
import fs from 'node:fs'
import path from 'node:path'

export const RUNS_FILE = path.resolve('tests/delivery/.runs.json')

export const configured = {
  mailosaur: !!process.env.MAILOSAUR_API_KEY && !!process.env.MAILOSAUR_SERVER_ID,
  sms: !!process.env.MAILOSAUR_API_KEY && !!process.env.MAILOSAUR_SERVER_ID && !!process.env.MAILOSAUR_PHONE_NUMBER,
}

export function baseUrl(): string {
  return (process.env.DELIVERY_BASE_URL || 'http://127.0.0.1:8799').replace(/\/$/, '')
}

export function apiHeaders(): Record<string, string> {
  const key = process.env.DELIVERY_API_KEY
  if (!key) throw new Error('DELIVERY_API_KEY is not set: the delivery tests call /api/notify like a machine, with a vk_ key the server lists in API_KEYS')
  return { 'content-type': 'application/json', authorization: `Bearer ${key}` }
}

export function appName(): string {
  return process.env.APP_NAME || 'this app'
}

/** The domain of NOTIFY_FROM ("App <noreply@example.com>" → example.com), when the test knows the server's config. */
export function fromDomain(): string | undefined {
  const m = (process.env.NOTIFY_FROM || '').match(/@([A-Za-z0-9.-]+)/)
  return m ? m[1].toLowerCase() : undefined
}

export function recordRun(kind: string, runId: string, extra: Record<string, unknown> = {}): void {
  let runs: Record<string, unknown>[] = []
  try {
    runs = JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'))
  } catch {
    runs = []
  }
  runs.push({ kind, run_id: runId, at: new Date().toISOString(), ...extra })
  fs.mkdirSync(path.dirname(RUNS_FILE), { recursive: true })
  fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 1))
}

export function explainSkip(what: string): void {
  console.log(`delivery tests not configured: ${what} — set MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID (and MAILOSAUR_PHONE_NUMBER for SMS) to run them`)
}

/// <reference types="@cloudflare/workers-types" />
/**
 * GET /api/health — public. Says the functions are up and emits one `heartbeat` (class health) on the fleet schema
 * (TM-8, iii-eye#528), so EYE's six-hour read sees this app alive from its first deploy. No secrets, no personal data.
 */
import { emit, envName, runId, telemetryFor, type TelemetryEnv } from '../_lib/telemetry'

interface Env extends TelemetryEnv {
  CF_PAGES_COMMIT_SHA?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context
  const run_id = runId('hb')
  const t = telemetryFor(env)
  const reported = await emit(env, 'heartbeat', { actor_type: 'agent', actor_id: 'health', run_id, telemetry_configured: t.configured }, context)
  return new Response(
    JSON.stringify({ ok: true, app: env.APP_NAME || null, env: envName(env), commit: env.CF_PAGES_COMMIT_SHA ? env.CF_PAGES_COMMIT_SHA.slice(0, 7) : null, telemetry: t.configured ? (reported ? 'reporting' : 'refused') : 'not configured (POSTHOG_KEY)', run_id, time: new Date().toISOString() }),
    { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-run-id': run_id } },
  )
}

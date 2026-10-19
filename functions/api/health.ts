/// <reference types="@cloudflare/workers-types" />
/**
 * GET /api/health — public. Says the functions are up, emits one `heartbeat` (class health) on the fleet schema,
 * and reports whether that heartbeat was DELIVERED, with a `findings` list for anything that would make this app
 * silent in the aggregate (no key, unset PILLAR or VENTURE_ID, a failed send).
 * (TM-8, iii-eye#528), so EYE's six-hour read sees this app alive from its first deploy. No secrets, no personal data.
 */
import {
  deliveryStatus,
  emitNow,
  envName,
  pillarOf,
  runId,
  type TelemetryEnv,
} from '../_lib/telemetry'

interface Env extends TelemetryEnv {
  CF_PAGES_COMMIT_SHA?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context
  const run_id = runId('hb')
  // Delivery, not acceptance. This endpoint is what EYE reads, so it awaits the flush and reports whether the
  // heartbeat actually left the isolate. Before 2026-10-19 it said `reporting` whenever the SCHEMA accepted the
  // event, which was true of an event the transport then failed to send.
  const r = await emitNow(env, 'heartbeat', {
    actor_type: 'agent',
    actor_id: 'health',
    run_id,
    telemetry_configured: deliveryStatus(env).configured,
  })
  const d = deliveryStatus(env)
  const telemetry = !d.configured
    ? 'not configured (POSTHOG_KEY)'
    : !r.accepted
      ? 'refused'
      : r.delivered
        ? 'reporting'
        : 'accepted but NOT delivered'
  const findings: string[] = []
  if (!d.configured) findings.push('POSTHOG_KEY is unset: events are validated and dropped')
  if (r.accepted && !r.delivered && d.configured)
    findings.push('the heartbeat was accepted and not delivered: ' + (r.error || 'unknown'))
  if (d.pillar === 'unset')
    findings.push('PILLAR is unset: this project reports as `unset` in the aggregate')
  if (!env.VENTURE_ID)
    findings.push('VENTURE_ID is unset: the venture is a slug of APP_NAME, which EYE may not match')
  return new Response(
    JSON.stringify({
      ok: true,
      app: env.APP_NAME || null,
      env: envName(env),
      commit: env.CF_PAGES_COMMIT_SHA ? env.CF_PAGES_COMMIT_SHA.slice(0, 7) : null,
      telemetry,
      telemetry_error: r.error,
      pillar: d.pillar,
      venture_id: env.VENTURE_ID || null,
      delivered: d.sent,
      delivery_failed: d.failed,
      findings,
      run_id,
      time: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'x-run-id': run_id,
      },
    },
  )
}

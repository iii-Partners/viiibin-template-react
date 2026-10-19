/// <reference types="@cloudflare/workers-types" />
/**
 * Fleet telemetry for this app's Pages Functions (TM-8, iii-eye#528).
 *
 * Every event carries the Fleet Telemetry Standard's common properties
 * (https://github.com/iii-Partners/iii-eye/blob/main/docs/standards/TELEMETRY-STANDARD.md), stamped here so a function
 * only names the actor, the run and the facts. Nothing private travels: ids, counts, outcomes, model names. The kit
 * refuses a forbidden key (email, phone, body, token, …) or a value that looks like an address or a key at the call site;
 * emit() turns that refusal into `false` and a console line, never a throw into the request.
 *
 * Runtime config (Pages project variables/secrets; `.dev.vars` under `wrangler pages dev`):
 *   POSTHOG_KEY   this app's PostHog project write key (phc_…). Without it events are validated and dropped (dry run),
 *                 and GET /api/health says `not configured (POSTHOG_KEY)` — a dry run is never silent.
 *   POSTHOG_HOST  default https://us.i.posthog.com
 *   VENTURE_ID    the venture this app serves, as EYE names it (default: a slug of APP_NAME)
 *   PILLAR        the reporting system: this app's product slug. NO DEFAULT — unset becomes 'unset', never 'template',
 *                 so a project nobody configured cannot masquerade as the template in the aggregate.
 *   APP_ENV       production | preview | development | test (default from CF_PAGES_BRANCH: main → production, else preview)
 */
import {
  createTelemetry,
  costUsd,
  type Telemetry,
  type EventProps,
  type Rate,
  type FlushResult,
} from '@iii-partners/fleet-kit/telemetry'

export interface TelemetryEnv {
  POSTHOG_KEY?: string
  POSTHOG_HOST?: string
  VENTURE_ID?: string
  PILLAR?: string
  APP_ENV?: string
  APP_NAME?: string
  CF_PAGES_BRANCH?: string
}

/** event name → class, so call sites never repeat the class (the standard's vocabulary). */
export const EVENTS = {
  heartbeat: 'health',
  health_run: 'health',
  notification_sent: 'product',
  agent_turn: 'agent',
} as const

export function envName(env: TelemetryEnv): string {
  if (env.APP_ENV) return env.APP_ENV
  if (env.CF_PAGES_BRANCH) return env.CF_PAGES_BRANCH === 'main' ? 'production' : 'preview'
  return 'development'
}

export function slug(s: string | undefined): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ventureId(env: TelemetryEnv): string {
  return env.VENTURE_ID || slug(env.APP_NAME) || 'unknown-venture'
}

/** `<prefix>-<utc14>-<rand>`: the id every event of one run shares; answer it to the caller so the run can be found. */
export function runId(prefix: string): string {
  return `${prefix}-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`
}

/** A stable, non-personal actor id: a system name passes through; an email address becomes u_<hash>. */
export function opaqueActor(emailOrName: string | undefined | null): string {
  const s = String(emailOrName || '')
    .trim()
    .toLowerCase()
  if (!s) return 'anonymous'
  if (!s.includes('@')) return s.replace(/[^a-z0-9_.:-]+/g, '-').slice(0, 64) || 'anonymous'
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return 'u_' + h.toString(36)
}

/**
 * `PILLAR` has no default. An unconfigured project reports `unset`, never `template`: on 2026-10-19 every pillar in the
 * PostHog org had its own project, and a project silently claiming `template` is indistinguishable from the template
 * itself in any aggregate.
 */
export function pillarOf(env: TelemetryEnv): string {
  return env.PILLAR || 'unset'
}

/**
 * DELIVERY, kept apart from acceptance — the distinction this file used to lose.
 *
 * 2026-10-19, measured: a schema-valid heartbeat was accepted, the flush then failed with a transport error, the kit
 * logged one console line, `flush()` swallowed it in `.catch(() => null)`, `emit()` returned `true` because it only ever
 * reported schema acceptance, and GET /api/health said `reporting`. Nothing was sent. Three layers of "looks fine, sent
 * nothing", and health — the thing EYE reads — was the one telling the lie.
 *
 * So every flush result is recorded here, and health reads this rather than inferring delivery from acceptance.
 */
export interface Delivery {
  sent: number
  failed: number
  lastError: string | null
}
const delivery: Delivery = { sent: 0, failed: 0, lastError: null }

/** What has actually been delivered from this isolate, and the last transport error if there was one. */
export function deliveryStatus(
  env: TelemetryEnv,
): Delivery & { configured: boolean; pillar: string } {
  return { ...delivery, configured: telemetryFor(env).configured, pillar: pillarOf(env) }
}

function record(r: { sent?: number; failed?: number; error?: unknown } | null): void {
  if (!r) {
    delivery.failed += 1
    delivery.lastError = 'flush threw'
    return
  }
  delivery.sent += Number(r.sent) || 0
  delivery.failed += Number(r.failed) || 0
  if (r.error) delivery.lastError = String((r.error as Error)?.message || r.error).slice(0, 200)
}

export type AppTelemetry = Telemetry & { configured: boolean }

let client: AppTelemetry | null = null
let clientKey: string | undefined

/** The isolate's one client (rebuilt only if the key changes). flushIntervalMs 0: no timers; the handlers flush. */
export function telemetryFor(env: TelemetryEnv): AppTelemetry {
  const key = env.POSTHOG_KEY || undefined
  if (client && clientKey === key) return client
  const t = createTelemetry({
    key,
    dryRun: !key,
    host: env.POSTHOG_HOST || undefined,
    defaults: {
      venture_id: ventureId(env),
      pillar: pillarOf(env),
      env: envName(env),
      executor: 'cloudflare-worker',
      ticket: 'none',
    },
    events: EVENTS,
    flushIntervalMs: 0,
    batchSize: 50,
  }) as AppTelemetry
  t.configured = !!key
  client = t
  clientKey = key
  return t
}

type Ctx = { waitUntil(p: Promise<unknown>): void } | undefined

/** Send what is queued; in a Pages Function, hand the promise to context.waitUntil so it outlives the response. */
export function flush(env: TelemetryEnv, ctx?: Ctx): Promise<FlushResult | null> {
  const p = telemetryFor(env)
    .flush()
    .then((r) => {
      record(r)
      return r
    })
    .catch(() => {
      record(null)
      return null
    })
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p)
  return p
}

/**
 * Validate and queue one event, then flush in the background; `true` means the event was ACCEPTED (schema and privacy),
 * NOT that it was delivered — a request must not wait on PostHog. Any transport failure is recorded in `deliveryStatus`
 * and surfaced by GET /api/health. When you need delivery truth in the answer, use `emitNow`.
 */
export async function emit(
  env: TelemetryEnv,
  event: keyof typeof EVENTS | string,
  props: EventProps,
  ctx?: Ctx,
): Promise<boolean> {
  try {
    const r = await telemetryFor(env).safeCapture(event, props)
    void flush(env, ctx)
    return !!r.ok
  } catch (e) {
    console.error('[telemetry] ' + ((e as Error)?.message || e))
    return false
  }
}

/**
 * Accept AND deliver one event, awaiting the flush: `true` only when the batch left the isolate with no failures.
 * For health checks and tests — anywhere a caller is entitled to know whether the event actually went.
 */
export async function emitNow(
  env: TelemetryEnv,
  event: keyof typeof EVENTS | string,
  props: EventProps,
): Promise<{ accepted: boolean; delivered: boolean; error: string | null }> {
  const t = telemetryFor(env)
  let accepted = false
  try {
    accepted = !!(await t.safeCapture(event, props)).ok
  } catch (e) {
    return {
      accepted: false,
      delivered: false,
      error: String((e as Error)?.message || e).slice(0, 200),
    }
  }
  if (!accepted) return { accepted: false, delivered: false, error: 'refused by schema or privacy' }
  if (!t.configured)
    return { accepted: true, delivered: false, error: 'not configured (POSTHOG_KEY)' }
  const r = await flush(env)
  const delivered = !!r && (Number(r.sent) || 0) > 0 && (Number(r.failed) || 0) === 0
  return {
    accepted: true,
    delivered,
    error: delivered ? null : delivery.lastError || 'the batch was not sent',
  }
}

/** Report an error as PostHog's $exception (class error) with error_kind; message and stack are redacted by the kit. */
export async function emitError(
  env: TelemetryEnv,
  err: unknown,
  props: EventProps & { error_kind: string },
  ctx?: Ctx,
): Promise<boolean> {
  try {
    const r = await telemetryFor(env).captureError(err, props)
    void flush(env, ctx)
    return !!r.ok
  } catch {
    return false
  }
}

/**
 * The six agent properties for a model call, from the provider's usage and the provider's PUBLIC list price in USD per
 * million tokens (the standard prices at list even on a subscription). Pass the rate from your own price table.
 */
export function agentProps(
  model: string,
  provider: string,
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
  durationMs: number,
  rate: Rate,
) {
  const tokens_in = Math.max(0, Number(usage?.input_tokens) || 0)
  const tokens_out = Math.max(0, Number(usage?.output_tokens) || 0)
  return {
    model,
    provider,
    tokens_in,
    tokens_out,
    cost_usd: costUsd(tokens_in, tokens_out, rate),
    duration_ms: Math.max(0, Math.round(durationMs)),
  }
}

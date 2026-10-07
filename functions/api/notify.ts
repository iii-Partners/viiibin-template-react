/// <reference types="@cloudflare/workers-types" />
/**
 * POST /api/notify — this app's one outbound message path (DP-9, iii-eye#527): a transactional email through Resend or
 * an SMS through Twilio. Protected like every /api route (functions/_middleware.ts): a signed-in user's JWT or a vk_ key.
 *
 *   body     { channel: 'email' | 'sms', to: string, template?: 'welcome' | 'code' }
 *   202      { ok: true, channel, template, run_id, provider, provider_id }  (+ header x-run-id)
 *   400      bad channel / recipient / template
 *   503      not_configured — names the missing variable instead of pretending to send
 *   502      provider_failed — the provider refused; detail redacted
 *
 * Telemetry (functions/_lib/telemetry.ts): `notification_sent` (class product) on success, `$exception` with error_kind
 * `notification_failed` (class error) otherwise; both carry the run_id the caller gets back. The recipient never enters
 * an event. The delivery tests in tests/delivery/ prove the message really arrives (Mailosaur) with working links and no
 * placeholder text; docs/outbound-messages.md is the inventory this route must stay equal to.
 *
 * Config: RESEND_API_KEY + NOTIFY_FROM ("App <noreply@your-domain>", a domain verified on the Resend account);
 *         TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM (E.164); APP_NAME; APP_URL (the link in the welcome email).
 */
import { emit, emitError, runId, type TelemetryEnv } from '../_lib/telemetry'

interface Env extends TelemetryEnv {
  RESEND_API_KEY?: string
  NOTIFY_FROM?: string
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_FROM?: string
  APP_URL?: string
}

type Channel = 'email' | 'sms'
type Template = 'welcome' | 'code'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

class ProviderError extends Error {
  constructor(public provider: string, public status: number, detail: string) {
    super(`${provider} answered ${status}: ${detail}`)
    this.name = 'ProviderError'
  }
}

/** The welcome email: one link to the app, plain and HTML parts, nothing templated left unfilled. */
function welcomeEmail(app: string, appUrl: string) {
  const subject = `Welcome to ${app}`
  const text = `Welcome to ${app}.\n\nYour account is ready. Open the app here: ${appUrl}\n\nIf you did not sign up, you can ignore this message.`
  const html = `<!doctype html><html lang="en"><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;line-height:1.5;padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">Welcome to ${escapeHtml(app)}</h1>
<p>Your account is ready.</p>
<p><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">Open ${escapeHtml(app)}</a></p>
<p style="color:#555;font-size:13px">If you did not sign up, you can ignore this message.</p>
</body></html>`
  return { subject, text, html }
}

/** A six-digit code. The response never contains it: the recipient's phone is the only place it goes. */
function sixDigits(): string {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return String(100000 + (a[0] % 900000))
}

async function sendEmail(env: Env, to: string, app: string, appUrl: string) {
  if (!env.RESEND_API_KEY) return { notConfigured: 'RESEND_API_KEY' }
  if (!env.NOTIFY_FROM) return { notConfigured: 'NOTIFY_FROM' }
  const m = welcomeEmail(app, appUrl)
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.NOTIFY_FROM, to: [to], subject: m.subject, html: m.html, text: m.text }),
  })
  const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string; name?: string }
  if (!r.ok) throw new ProviderError('resend', r.status, String(j.message || j.name || 'error'))
  return { provider: 'resend', provider_id: String(j.id || '') }
}

async function sendSms(env: Env, to: string, app: string) {
  if (!env.TWILIO_ACCOUNT_SID) return { notConfigured: 'TWILIO_ACCOUNT_SID' }
  if (!env.TWILIO_AUTH_TOKEN) return { notConfigured: 'TWILIO_AUTH_TOKEN' }
  if (!env.TWILIO_FROM) return { notConfigured: 'TWILIO_FROM' }
  const body = `Your ${app} code is ${sixDigits()}. It expires in 10 minutes.`
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: body })
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`, {
    method: 'POST',
    headers: { authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`), 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const j = (await r.json().catch(() => ({}))) as { sid?: string; message?: string }
  if (!r.ok) throw new ProviderError('twilio', r.status, String(j.message || 'error'))
  return { provider: 'twilio', provider_id: String(j.sid || '') }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const run_id = runId('notify')
  const t0 = Date.now()
  let b: { channel?: string; to?: string; template?: string }
  try {
    b = (await request.json()) as typeof b
  } catch {
    return json(400, { error: 'bad_json', run_id }, { 'x-run-id': run_id })
  }
  const channel = b.channel as Channel
  if (channel !== 'email' && channel !== 'sms') return json(400, { error: 'bad_channel', note: 'channel must be email or sms', run_id }, { 'x-run-id': run_id })
  const to = String(b.to || '').trim()
  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json(400, { error: 'bad_recipient', note: 'to must be an email address', run_id }, { 'x-run-id': run_id })
  if (channel === 'sms' && !/^\+[1-9]\d{6,14}$/.test(to)) return json(400, { error: 'bad_recipient', note: 'to must be an E.164 phone number', run_id }, { 'x-run-id': run_id })
  const template = (b.template || (channel === 'sms' ? 'code' : 'welcome')) as Template
  if ((channel === 'email' && template !== 'welcome') || (channel === 'sms' && template !== 'code')) return json(400, { error: 'bad_template', note: 'email sends welcome; sms sends code', run_id }, { 'x-run-id': run_id })
  const app = env.APP_NAME || 'this app'
  const appUrl = env.APP_URL || new URL(request.url).origin
  try {
    const sent = channel === 'email' ? await sendEmail(env, to, app, appUrl) : await sendSms(env, to, app)
    if ('notConfigured' in sent) return json(503, { error: 'not_configured', missing: sent.notConfigured, note: `${channel} is not configured on this deployment: set ${sent.notConfigured}`, run_id }, { 'x-run-id': run_id })
    await emit(env, 'notification_sent', { actor_type: 'agent', actor_id: 'notify', run_id, channel, template, provider: sent.provider, duration_ms: Date.now() - t0 }, context)
    return json(202, { ok: true, channel, template, run_id, provider: sent.provider, provider_id: sent.provider_id }, { 'x-run-id': run_id })
  } catch (e) {
    await emitError(env, e, { error_kind: 'notification_failed', actor_type: 'agent', actor_id: 'notify', run_id, channel, template, provider: (e as ProviderError).provider || 'unknown' }, context)
    return json(502, { ok: false, error: 'provider_failed', detail: String((e as Error)?.message || e).slice(0, 200), run_id }, { 'x-run-id': run_id })
  }
}

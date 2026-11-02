/// <reference types="@cloudflare/workers-types" />
/**
 * POST /api/ask — one turn of the Ask conversation, relayed to Claude.
 *
 * The browser holds Northlight OS's data and runs every tool itself (src/os/ask/tools.ts). This endpoint adds what the
 * browser must not choose — the model, the instructions and the tool definitions (src/os/ask/contract.ts) — sends the
 * conversation to the Messages API, and returns Claude's content and stop reason unchanged, so the browser can run the
 * tools Claude asked for and send the next turn. It keeps no state between requests.
 *
 * Auth: /api/* is protected by functions/_middleware.ts, so only a signed-in user (or a vk_ key) reaches this.
 * Config: ANTHROPIC_API_KEY (secret). Without it the endpoint answers 503 `not configured (ANTHROPIC_API_KEY)` and the
 * Ask view falls back to its built-in matcher.
 */
import Anthropic from '@anthropic-ai/sdk'
import { ASK_MODEL, ASK_SYSTEM, ASK_TOOLS } from '../../src/os/ask/contract'

interface Env {
  ANTHROPIC_API_KEY?: string
}

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/** A conversation is short in practice; these caps stop a runaway client from sending an unbounded history. */
const MAX_MESSAGES = 80
const MAX_BYTES = 600_000

function validMessages(x: unknown): x is Anthropic.MessageParam[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.length <= MAX_MESSAGES &&
    x.every((m) => m && typeof m === 'object' && ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'assistant') && (typeof (m as { content?: unknown }).content === 'string' || Array.isArray((m as { content?: unknown }).content))) &&
    (x[0] as { role: string }).role === 'user'
  )
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.ANTHROPIC_API_KEY) return json(503, { error: 'not configured (ANTHROPIC_API_KEY)' })
  const raw = await request.text()
  if (raw.length > MAX_BYTES) return json(413, { error: 'conversation_too_long' })
  let body: { messages?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  if (!validMessages(body.messages)) return json(400, { error: 'invalid_messages' })

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  try {
    const response = await client.beta.messages.create({
      model: ASK_MODEL,
      max_tokens: 16000,
      // a declined request is re-run server-side on the fallback Anthropic recommends for its refusal category
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      // the tool list and the instructions never change between turns, so they are cached; the top-level breakpoint
      // caches the growing conversation as well
      cache_control: { type: 'ephemeral' },
      system: [{ type: 'text', text: ASK_SYSTEM, cache_control: { type: 'ephemeral' } }],
      tools: ASK_TOOLS,
      messages: body.messages as Anthropic.Beta.BetaMessageParam[],
    })
    return json(200, { content: response.content, stop_reason: response.stop_reason })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(429, { error: 'rate_limited' })
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return json(502, { error: 'upstream_credentials_rejected' })
    if (e instanceof Anthropic.BadRequestError) return json(400, { error: 'upstream_rejected_request' })
    if (e instanceof Anthropic.APIError) return json(502, { error: 'upstream_error', status: e.status })
    return json(502, { error: 'upstream_unreachable' })
  }
}

export const onRequest: PagesFunction<Env> = (context) => (context.request.method === 'POST' ? onRequestPost(context) : json(405, { error: 'method_not_allowed' }))

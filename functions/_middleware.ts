/// <reference types="@cloudflare/workers-types" />

/**
 * Auth enforcement for this business's OWN backend surfaces (#3406).
 *
 * Every request to /api/* and the /mcp tool endpoint must carry a valid credential
 * issued by THIS project's own Auth0 issuer — an end-user OAuth JWT (verified against
 * the issuer's JWKS) or a `vk_` machine API key. The frontend's Auth0 login is
 * client-side and does NOT protect the backend; this does. Fails CLOSED: if the
 * issuer isn't configured, api/mcp return 503 rather than serving open.
 *
 * Public (no auth): the static frontend, and GET /mcp (discovery — it advertises HOW
 * to authenticate, per the OAuth protected-resource model). POST /mcp (tool calls) and
 * all /api/* are protected.
 *
 * Runtime config (Pages project vars/secrets the platform sets — NOT the build-time
 * VITE_* vars): AUTH0_DOMAIN (required), AUTH0_AUDIENCE (recommended), API_KEYS
 * (optional comma-separated vk_ allowlist for M2M).
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { emitError, runId, type TelemetryEnv } from './_lib/telemetry'

interface Env extends TelemetryEnv {
  AUTH0_DOMAIN?: string
  AUTH0_AUDIENCE?: string
  API_KEYS?: string
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

/** Which requests must be authenticated. GET /api/health is public: it says the functions are up and nothing else. */
function isProtected(pathname: string, method: string): boolean {
  if (pathname === '/api/health') return method !== 'GET'
  if (pathname.startsWith('/api/')) return true
  if (pathname === '/mcp' || pathname.startsWith('/mcp/')) return method !== 'GET' // GET = public discovery
  return false
}

/** 401 that tells the client WHERE to authenticate (RFC 9728 / RFC 6750). */
function unauthorized(origin: string, issuer: string, message: string): Response {
  return json(
    401,
    { error: 'unauthorized', message },
    {
      'www-authenticate': `Bearer realm="${origin}", resource_metadata="${origin}/.well-known/oauth-protected-resource", issuer="${issuer}"`,
    },
  )
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)
  // TM-8 (iii-eye#528): an error no function caught is reported as $exception unhandled_error on the fleet schema
  // (message and stack redacted by the kit; the route by its first segments, never an id) before it becomes a 500.
  try {
    return await guard(context, url)
  } catch (e) {
    await emitError(env, e, { error_kind: 'unhandled_error', actor_type: 'agent', actor_id: 'pages-function', run_id: runId('req'), method: request.method, route: url.pathname.split('/').slice(0, 3).join('/') }, context)
    return json(500, { error: 'server' })
  }
}

async function guard(context: Parameters<PagesFunction<Env>>[0], url: URL): Promise<Response> {
  const { request, env, next } = context
  if (!isProtected(url.pathname, request.method)) return next()

  const authz = request.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7).trim() : ''
  const domain = env.AUTH0_DOMAIN
  const issuer = domain ? `https://${domain.replace(/\/+$/, '')}/` : ''

  // Machine-to-machine API key (vk_) — same keys the platform issues. An explicitly listed key is a credential this
  // project configured, so it is accepted whether or not an end-user issuer exists yet (the delivery tests and other
  // machines use it); an unknown key is refused, and with no key at all the issuer rule below still applies.
  if (token.startsWith('vk_')) {
    const allowed = (env.API_KEYS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (allowed.includes(token)) {
      ;(context.data as Record<string, unknown>).identity = { kind: 'machine' }
      return next()
    }
    if (!issuer) return json(401, { error: 'unauthorized', message: 'invalid api key' })
    return unauthorized(url.origin, issuer, 'invalid api key')
  }

  if (!issuer) {
    // A governed app without a configured issuer must NOT serve open api/mcp.
    return json(503, {
      error: 'identity_not_configured',
      message: 'AUTH0_DOMAIN is not set for this project — api/mcp are protected and cannot verify credentials.',
    })
  }
  if (!token) return unauthorized(url.origin, issuer, 'missing bearer token')

  // End-user / OAuth 2.1 access token — verify signature + iss (+ aud) against the
  // project's OWN Auth0 issuer JWKS. jose caches the JWKS fetch internally.
  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`))
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      ...(env.AUTH0_AUDIENCE ? { audience: env.AUTH0_AUDIENCE } : {}),
    })
    ;(context.data as Record<string, unknown>).identity = { kind: 'user', sub: payload.sub, claims: payload }
    return next()
  } catch {
    return unauthorized(url.origin, issuer, 'invalid or expired token')
  }
}

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

interface Env {
  AUTH0_DOMAIN?: string
  AUTH0_AUDIENCE?: string
  API_KEYS?: string
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

/** Which requests must be authenticated. */
function isProtected(pathname: string, method: string): boolean {
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
  const { request, env, next } = context
  const url = new URL(request.url)
  if (!isProtected(url.pathname, request.method)) return next()

  const domain = env.AUTH0_DOMAIN
  if (!domain) {
    // A governed app without a configured issuer must NOT serve open api/mcp.
    return json(503, {
      error: 'identity_not_configured',
      message: 'AUTH0_DOMAIN is not set for this project — api/mcp are protected and cannot verify credentials.',
    })
  }
  const issuer = `https://${domain.replace(/\/+$/, '')}/`

  const authz = request.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7).trim() : ''
  if (!token) return unauthorized(url.origin, issuer, 'missing bearer token')

  // Machine-to-machine API key (vk_) — same keys the platform issues.
  if (token.startsWith('vk_')) {
    const allowed = (env.API_KEYS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (allowed.includes(token)) {
      ;(context.data as Record<string, unknown>).identity = { kind: 'machine' }
      return next()
    }
    return unauthorized(url.origin, issuer, 'invalid api key')
  }

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

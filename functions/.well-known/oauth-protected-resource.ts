/// <reference types="@cloudflare/workers-types" />

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) — tells an MCP/API client WHERE to
 * authenticate for THIS business: its own Auth0 issuer is the authorization server,
 * and `{origin}/mcp` is the protected resource. Public (a discovery document).
 */
interface Env {
  AUTH0_DOMAIN?: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const domain = context.env.AUTH0_DOMAIN
  const issuer = domain ? `https://${domain.replace(/\/+$/, '')}/` : null
  return Response.json({
    resource: `${url.origin}/mcp`,
    authorization_servers: issuer ? [issuer] : [],
    bearer_methods_supported: ['header'],
    resource_documentation: `${url.origin}/mcp`,
  })
}

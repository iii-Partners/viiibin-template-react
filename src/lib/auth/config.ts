const rawDomain = (import.meta.env.VITE_AUTH0_DOMAIN || '').trim()
const rawClientId = (import.meta.env.VITE_AUTH0_CLIENT_ID || '').trim()

/**
 * Auth stays OFF unless a *real* Auth0 domain and client id are configured.
 *
 * A real Auth0 domain is a hostname like `tenant.us.auth0.com` or a verified
 * custom domain — it always contains a dot and never a scheme or spaces.
 * Placeholder / example values must NEVER enable auth: if they did, the SPA
 * would redirect to `https://<value>/authorize` on load and die with
 * DNS_PROBE_FINISHED_NXDOMAIN. This is what makes a fresh, unconfigured preview
 * render cleanly instead of bouncing to a broken login.
 */
const PLACEHOLDER = /(placeholder|example|changeme|your[-_.]?(domain|app|tenant|id)|xxx+|todo)/i

function isRealAuthValue(v: string): boolean {
  return v.length > 0 && !v.includes(' ') && !PLACEHOLDER.test(v)
}

export const auth0Config = {
  domain: rawDomain,
  clientId: rawClientId,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  redirectUri:
    typeof window !== 'undefined' ? `${window.location.origin}/callback` : '/callback',
}

export const isAuthEnabled =
  rawDomain.includes('.') && isRealAuthValue(rawDomain) && isRealAuthValue(rawClientId)

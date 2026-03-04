export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  redirectUri: `${window.location.origin}/callback`,
}

export const isAuthEnabled = Boolean(auth0Config.domain && auth0Config.clientId)

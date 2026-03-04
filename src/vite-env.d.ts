/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_AUTH0_CLIENT_ID: string
  readonly VITE_AUTH0_AUDIENCE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_AI_PROVIDER: 'none' | 'anthropic' | 'openai'
  readonly VITE_AI_MODEL: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_FCM_SENDER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

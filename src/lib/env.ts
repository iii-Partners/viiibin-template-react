import { z } from 'zod'

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_APP_DESCRIPTION: z.string().default(''),
  VITE_AUTH0_DOMAIN: z.string().default(''),
  VITE_AUTH0_CLIENT_ID: z.string().default(''),
  VITE_AUTH0_AUDIENCE: z.string().default(''),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_AI_PROVIDER: z.enum(['none', 'anthropic', 'openai']).default('none'),
  VITE_AI_MODEL: z.string().default('claude-sonnet-4-20250514'),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  VITE_PRIMARY_COLOR: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).default('#6366f1'),
  VITE_FCM_SENDER_ID: z.string().default(''),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  return envSchema.parse(import.meta.env)
}

/** Validated, typed environment variables. Access once at app init or per-module. */
export const env = getEnv()

import { NoOpProvider, type AnalyticsProvider } from './provider'
import { PostHogProvider, type PostHogConfig } from './posthog'
import { consentManager } from './consent'
import { env } from '@/lib/env'

type AnalyticsConfig = {
  provider?: 'none' | 'custom' | 'posthog'
  /** Custom provider instance — pass your own AnalyticsProvider implementation */
  customProvider?: AnalyticsProvider
  /** Provider-specific configuration (for 'posthog': PostHogConfig) */
  config?: Record<string, unknown>
}

/**
 * Analytics singleton.
 * All tracking calls go through this object. The underlying provider
 * can be swapped at runtime via initAnalytics().
 *
 * Default: NoOpProvider (no tracking without explicit configuration).
 */
class Analytics {
  private provider: AnalyticsProvider = new NoOpProvider()

  /** Initialize or switch the analytics provider */
  init(analyticsConfig: AnalyticsConfig = {}): void {
    const { provider = 'none', customProvider, config } = analyticsConfig

    if (provider === 'custom' && customProvider) {
      this.provider = customProvider
    } else if (provider === 'posthog' && config && typeof config.key === 'string' && config.key) {
      this.provider = new PostHogProvider(config as PostHogConfig)
    } else {
      this.provider = new NoOpProvider()
    }

    this.provider.init(config)
  }

  /** Track a named event */
  track(event: string, properties?: Record<string, unknown>): void {
    this.provider.track(event, properties)
  }

  /** Identify a user */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.provider.identify(userId, traits)
  }

  /** Track a page view */
  page(name: string, properties?: Record<string, unknown>): void {
    this.provider.page(name, properties)
  }

  /** Reset identity (call on logout) */
  reset(): void {
    this.provider.reset()
  }

  /** Replace the active provider at runtime */
  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider
  }
}

export const analytics = new Analytics()

export function initAnalytics(config?: AnalyticsConfig): void {
  analytics.init(config)
}

/** PostHog settings from the build-time env (VITE_POSTHOG_KEY et al.), or null when telemetry is not configured. */
export function postHogConfigFromEnv(): PostHogConfig | null {
  if (!env.VITE_ENABLE_ANALYTICS || !env.VITE_POSTHOG_KEY) return null
  return {
    key: env.VITE_POSTHOG_KEY,
    host: env.VITE_POSTHOG_HOST,
    ventureId: env.VITE_VENTURE_ID || env.VITE_APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown-venture',
    pillar: env.VITE_PILLAR,
    env: env.VITE_APP_ENV || (import.meta.env.PROD ? 'production' : 'development'),
  }
}

/**
 * Install PostHog on the fleet schema when analytics is enabled, configured, and the visitor has consented; otherwise
 * keep (or return to) the no-op provider. Called at startup and whenever consent changes.
 */
export function applyAnalyticsConsent(): void {
  const cfg = postHogConfigFromEnv()
  if (cfg && consentManager.hasConsent('analytics')) analytics.init({ provider: 'posthog', config: cfg })
  else analytics.init({ provider: 'none' })
}

export type { AnalyticsConfig, AnalyticsProvider }

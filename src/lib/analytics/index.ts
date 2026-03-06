import { NoOpProvider, type AnalyticsProvider } from './provider'

type AnalyticsConfig = {
  provider?: 'none' | 'custom'
  /** Custom provider instance — pass your own AnalyticsProvider implementation */
  customProvider?: AnalyticsProvider
  /** Provider-specific configuration */
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

export type { AnalyticsConfig, AnalyticsProvider }

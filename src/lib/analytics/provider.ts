/**
 * Analytics provider interface.
 * Implement this interface to integrate with any analytics service
 * (e.g., Mixpanel, Amplitude, PostHog, Google Analytics).
 */
export type AnalyticsProvider = {
  /** Initialize the provider with configuration */
  init(config?: Record<string, unknown>): void
  /** Track a named event with optional properties */
  track(event: string, properties?: Record<string, unknown>): void
  /** Identify a user with traits */
  identify(userId: string, traits?: Record<string, unknown>): void
  /** Track a page view */
  page(name: string, properties?: Record<string, unknown>): void
  /** Reset user identity (on logout) */
  reset(): void
}

/**
 * Default no-op analytics provider.
 * Used when no analytics service is configured or when the user
 * has not consented to analytics tracking.
 */
export class NoOpProvider implements AnalyticsProvider {
  init(): void {
    // No-op
  }

  track(): void {
    // No-op
  }

  identify(): void {
    // No-op
  }

  page(): void {
    // No-op
  }

  reset(): void {
    // No-op
  }
}

import posthog from 'posthog-js'
import type { AnalyticsProvider } from './provider'

/**
 * PostHog on the fleet telemetry schema (TM-8, iii-eye#528).
 *
 * Every browser event carries the standard's common properties as PostHog super properties, so EYE's six-hour read of
 * this app's project grades it `reporting`: venture_id, pillar, actor_type (human), actor_id (PostHog's own anonymous
 * distinct id, never an email), run_id (the PostHog session id), ticket (`none`), executor (`browser`), env, class
 * (`product`). Nothing private: identify() strips traits that look like personal data before they leave the browser.
 * Consent-gated by useConsent(): the provider is only installed when the visitor has allowed analytics.
 */
export type PostHogConfig = {
  key: string
  host?: string
  ventureId: string
  pillar: string
  env: string
}

const PRIVATE_TRAIT = /(^|_)(e_?mails?|phone|mobile|tel|first_?name|last_?name|full_?name|name|address|dob|birth|ssn|password|token|secret)(_|$)/i

function safeTraits(traits?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!traits) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(traits)) {
    if (PRIVATE_TRAIT.test(k)) continue
    if (typeof v === 'string' && /@/.test(v)) continue
    out[k] = v
  }
  return out
}

export class PostHogProvider implements AnalyticsProvider {
  private ready = false
  private readonly cfg: PostHogConfig

  constructor(cfg: PostHogConfig) {
    this.cfg = cfg
  }

  init(): void {
    if (this.ready || !this.cfg.key) return
    posthog.init(this.cfg.key, {
      api_host: this.cfg.host || 'https://us.i.posthog.com',
      capture_pageview: false, // useAnalytics() tracks route changes through page()
      capture_pageleave: true,
      autocapture: false,
      person_profiles: 'identified_only',
      persistence: 'localStorage+cookie',
    })
    this.registerSchema()
    this.ready = true
  }

  private registerSchema(): void {
    posthog.register({
      venture_id: this.cfg.ventureId,
      pillar: this.cfg.pillar,
      actor_type: 'human',
      actor_id: posthog.get_distinct_id(),
      run_id: posthog.get_session_id() || `session-${Date.now().toString(36)}`,
      ticket: 'none',
      executor: 'browser',
      env: this.cfg.env,
      class: 'product',
      schema: 'iii-telemetry-v1',
    })
  }

  track(event: string, properties?: Record<string, unknown>): void {
    if (!this.ready) return
    posthog.capture(event, safeTraits(properties))
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.ready) return
    posthog.identify(userId, safeTraits(traits))
    posthog.register({ actor_id: posthog.get_distinct_id() })
  }

  page(name: string, properties?: Record<string, unknown>): void {
    if (!this.ready) return
    posthog.capture('$pageview', { ...safeTraits(properties), page: name, $current_url: typeof location !== 'undefined' ? location.href : undefined })
  }

  reset(): void {
    if (!this.ready) return
    posthog.reset()
    this.registerSchema()
  }
}

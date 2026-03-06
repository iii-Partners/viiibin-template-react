const CONSENT_STORAGE_KEY = 'analytics-consent'

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

export type ConsentState = Record<ConsentCategory, boolean>

const defaultConsent: ConsentState = {
  necessary: true, // Always required, cannot be disabled
  analytics: false,
  marketing: false,
}

/**
 * Manages user consent for tracking categories.
 * Persists to localStorage. The 'necessary' category is always enabled.
 */
export class ConsentManager {
  private state: ConsentState

  constructor() {
    this.state = this.load()
  }

  /** Get the current consent state */
  getConsent(): ConsentState {
    return { ...this.state }
  }

  /** Check if a specific category is consented to */
  hasConsent(category: ConsentCategory): boolean {
    if (category === 'necessary') return true
    return this.state[category] ?? false
  }

  /** Check if the user has made any consent choice */
  hasUserConsented(): boolean {
    try {
      return localStorage.getItem(CONSENT_STORAGE_KEY) !== null
    } catch {
      return false
    }
  }

  /** Update consent for one or more categories */
  updateConsent(updates: Partial<ConsentState>): ConsentState {
    this.state = {
      ...this.state,
      ...updates,
      necessary: true, // Always enforce necessary
    }
    this.save()
    return this.getConsent()
  }

  /** Accept all categories */
  acceptAll(): ConsentState {
    return this.updateConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  }

  /** Reject all optional categories */
  rejectAll(): ConsentState {
    return this.updateConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    })
  }

  /** Reset to defaults and clear storage */
  reset(): void {
    this.state = { ...defaultConsent }
    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  private load(): ConsentState {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ConsentState>
        return {
          necessary: true,
          analytics: parsed.analytics ?? false,
          marketing: parsed.marketing ?? false,
        }
      }
    } catch {
      // Ignore parse errors
    }
    return { ...defaultConsent }
  }

  private save(): void {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // Ignore storage errors
    }
  }
}

/** Singleton consent manager instance */
export const consentManager = new ConsentManager()

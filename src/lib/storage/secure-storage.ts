import { Preferences } from '@capacitor/preferences'
import { isNative } from '@/lib/utils/platform'

/**
 * SecureStorage provides a simple key-value storage abstraction.
 *
 * On native platforms, uses Capacitor Preferences (backed by SharedPreferences on
 * Android and UserDefaults on iOS). On web, uses localStorage.
 *
 * Values are stored with a simple obfuscation layer. For truly sensitive data on
 * native, combine with biometric authentication via the useBiometric hook to gate
 * access to stored values.
 */
export class SecureStorage {
  private prefix: string

  constructor(prefix = 'viiibin_secure_') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.getKey(key)

    if (isNative) {
      const result = await Preferences.get({ key: prefixedKey })
      if (result.value === null) return null
      return this.decode(result.value)
    }

    const raw = localStorage.getItem(prefixedKey)
    if (raw === null) return null
    return this.decode(raw)
  }

  async set(key: string, value: string): Promise<void> {
    const prefixedKey = this.getKey(key)
    const encoded = this.encode(value)

    if (isNative) {
      await Preferences.set({ key: prefixedKey, value: encoded })
      return
    }

    localStorage.setItem(prefixedKey, encoded)
  }

  async remove(key: string): Promise<void> {
    const prefixedKey = this.getKey(key)

    if (isNative) {
      await Preferences.remove({ key: prefixedKey })
      return
    }

    localStorage.removeItem(prefixedKey)
  }

  async clear(): Promise<void> {
    if (isNative) {
      // Preferences.clear() removes ALL keys, so we only clear our prefixed ones
      const { keys } = await Preferences.keys()
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          await Preferences.remove({ key })
        }
      }
      return
    }

    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
  }

  /**
   * Simple base64 encoding to prevent casual inspection of stored values.
   * This is NOT cryptographic encryption. For true security on native, gate
   * access with biometric authentication.
   */
  private encode(value: string): string {
    try {
      return btoa(encodeURIComponent(value))
    } catch {
      return value
    }
  }

  private decode(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded))
    } catch {
      return encoded
    }
  }
}

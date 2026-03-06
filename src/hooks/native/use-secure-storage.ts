import { useCallback, useEffect, useState } from 'react'
import { SecureStorage } from '@/lib/storage/secure-storage'

const storage = new SecureStorage()

export function useSecureStorage(key: string) {
  const [value, setValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const stored = await storage.get(key)
        if (!cancelled) {
          setValue(stored)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [key])

  const setStoredValue = useCallback(
    async (newValue: string) => {
      await storage.set(key, newValue)
      setValue(newValue)
    },
    [key],
  )

  const removeValue = useCallback(async () => {
    await storage.remove(key)
    setValue(null)
  }, [key])

  return { value, setValue: setStoredValue, removeValue, loading }
}

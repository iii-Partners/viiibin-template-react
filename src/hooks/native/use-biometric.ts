import { useCallback, useEffect, useState } from 'react'
import { isWeb } from '@/lib/utils/platform'

type BiometryTypeName =
  | 'touchId'
  | 'faceId'
  | 'fingerprintAuthentication'
  | 'faceAuthentication'
  | 'irisAuthentication'
  | 'none'

type BiometricState = {
  isAvailable: boolean
  biometryType: BiometryTypeName
  authenticate: (reason?: string) => Promise<boolean>
  error: string | null
}

/**
 * Maps the BiometryType enum value to a friendly string name.
 * Enum values from @aparajita/capacitor-biometric-auth:
 * none=0, touchId=1, faceId=2, fingerprintAuthentication=3,
 * faceAuthentication=4, irisAuthentication=5
 */
function mapBiometryType(value: number): BiometryTypeName {
  switch (value) {
    case 1:
      return 'touchId'
    case 2:
      return 'faceId'
    case 3:
      return 'fingerprintAuthentication'
    case 4:
      return 'faceAuthentication'
    case 5:
      return 'irisAuthentication'
    default:
      return 'none'
  }
}

export function useBiometric(): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false)
  const [biometryType, setBiometryType] = useState<BiometryTypeName>('none')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isWeb) {
      setIsAvailable(false)
      setBiometryType('none')
      return
    }

    async function checkAvailability() {
      try {
        const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
        const result = await BiometricAuth.checkBiometry()

        setIsAvailable(result.isAvailable)
        setBiometryType(mapBiometryType(result.biometryType))
      } catch (err) {
        setIsAvailable(false)
        setBiometryType('none')
        const message = err instanceof Error ? err.message : 'Biometric check failed'
        setError(message)
      }
    }

    void checkAvailability()
  }, [])

  const authenticate = useCallback(
    async (reason?: string): Promise<boolean> => {
      setError(null)

      if (isWeb || !isAvailable) {
        return false
      }

      try {
        const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')
        await BiometricAuth.authenticate({
          reason: reason ?? 'Please authenticate',
          cancelTitle: 'Cancel',
          allowDeviceCredential: true,
        })
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed'
        setError(message)
        return false
      }
    },
    [isAvailable],
  )

  return { isAvailable, biometryType, authenticate, error }
}

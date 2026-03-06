import { useCallback, useEffect, useState } from 'react'
import { isNative } from '@/lib/utils/platform'

type DeviceInfo = {
  name: string | undefined
  model: string
  platform: string
  operatingSystem: string
  osVersion: string
  manufacturer: string
  isVirtual: boolean
  webViewVersion: string
} | null

type BatteryInfo = {
  batteryLevel: number
  isCharging: boolean
} | null

/**
 * Wraps @capacitor/device to provide device info, battery status, and language code.
 * On web, device info is populated from the user agent where available.
 */
export function useDevice() {
  const [info, setInfo] = useState<DeviceInfo>(null)
  const [batteryInfo, setBatteryInfo] = useState<BatteryInfo>(null)
  const [languageCode, setLanguageCode] = useState<string>(
    typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
  )

  useEffect(() => {
    const loadDeviceInfo = async () => {
      if (isNative) {
        try {
          const { Device } = await import('@capacitor/device')
          const deviceInfo = await Device.getInfo()
          setInfo({
            name: deviceInfo.name ?? undefined,
            model: deviceInfo.model,
            platform: deviceInfo.platform,
            operatingSystem: deviceInfo.operatingSystem,
            osVersion: deviceInfo.osVersion,
            manufacturer: deviceInfo.manufacturer,
            isVirtual: deviceInfo.isVirtual,
            webViewVersion: deviceInfo.webViewVersion,
          })

          const battery = await Device.getBatteryInfo()
          setBatteryInfo({
            batteryLevel: battery.batteryLevel ?? -1,
            isCharging: battery.isCharging ?? false,
          })

          const lang = await Device.getLanguageCode()
          setLanguageCode(lang.value)
        } catch (error) {
          console.error('Failed to load device info:', error)
        }
      } else {
        // Web fallback
        setInfo({
          name: undefined,
          model: 'web',
          platform: 'web',
          operatingSystem: navigator.platform || 'unknown',
          osVersion: '',
          manufacturer: '',
          isVirtual: false,
          webViewVersion: navigator.userAgent,
        })
      }
    }

    loadDeviceInfo().catch(console.error)
  }, [])

  const refreshBattery = useCallback(async () => {
    if (!isNative) return
    try {
      const { Device } = await import('@capacitor/device')
      const battery = await Device.getBatteryInfo()
      setBatteryInfo({
        batteryLevel: battery.batteryLevel ?? -1,
        isCharging: battery.isCharging ?? false,
      })
    } catch {
      // Device plugin not available
    }
  }, [])

  return { info, batteryInfo, languageCode, refreshBattery }
}

import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const isIos = Capacitor.getPlatform() === 'ios'
export const isAndroid = Capacitor.getPlatform() === 'android'
export const isWeb = Capacitor.getPlatform() === 'web'

export function getPlatform() {
  return {
    isNative,
    isIos,
    isAndroid,
    isWeb,
    platform: Capacitor.getPlatform(),
  }
}

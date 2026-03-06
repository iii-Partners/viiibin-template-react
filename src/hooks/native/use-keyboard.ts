import { useCallback, useEffect, useState } from 'react'
import { isNative } from '@/lib/utils/platform'

type KeyboardState = {
  isVisible: boolean
  keyboardHeight: number
}

/**
 * Wraps @capacitor/keyboard for native keyboard visibility tracking.
 * On web, returns isVisible: false and height: 0.
 */
export function useKeyboard() {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  })

  useEffect(() => {
    if (!isNative) return

    const listeners: Array<{ remove: () => void }> = []

    const setup = async () => {
      const { Keyboard } = await import('@capacitor/keyboard')

      const showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
        setState({ isVisible: true, keyboardHeight: info.keyboardHeight })
      })
      listeners.push(showHandle)

      const hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
        setState({ isVisible: false, keyboardHeight: 0 })
      })
      listeners.push(hideHandle)
    }

    setup().catch(console.error)

    return () => {
      for (const listener of listeners) {
        listener.remove()
      }
    }
  }, [])

  const show = useCallback(async () => {
    if (!isNative) return
    try {
      const { Keyboard } = await import('@capacitor/keyboard')
      await Keyboard.show()
    } catch {
      // Keyboard plugin not available
    }
  }, [])

  const hide = useCallback(async () => {
    if (!isNative) return
    try {
      const { Keyboard } = await import('@capacitor/keyboard')
      await Keyboard.hide()
    } catch {
      // Keyboard plugin not available
    }
  }, [])

  return {
    isVisible: state.isVisible,
    keyboardHeight: state.keyboardHeight,
    show,
    hide,
  }
}

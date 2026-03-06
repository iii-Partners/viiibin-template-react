import { useCallback, useRef, useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNative } from '@/lib/utils/platform'

export type Photo = {
  dataUrl: string
  format: string
}

export function useCamera() {
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const takePhoto = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      if (isNative) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        })
        const result: Photo = {
          dataUrl: image.dataUrl ?? '',
          format: image.format,
        }
        setPhoto(result)
        return result
      }

      // Web fallback: use file input with capture attribute
      return await openFilePicker('environment')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to take photo'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const pickFromGallery = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      if (isNative) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        })
        const result: Photo = {
          dataUrl: image.dataUrl ?? '',
          format: image.format,
        }
        setPhoto(result)
        return result
      }

      // Web fallback: use file input
      return await openFilePicker()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick photo'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  function openFilePicker(capture?: string): Promise<Photo | null> {
    return new Promise((resolve) => {
      // Clean up any existing input
      if (fileInputRef.current) {
        fileInputRef.current.remove()
      }

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      if (capture) {
        input.setAttribute('capture', capture)
      }
      input.style.display = 'none'
      fileInputRef.current = input

      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) {
          resolve(null)
          input.remove()
          return
        }

        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const format = file.type.split('/')[1] ?? 'jpeg'
          const result: Photo = { dataUrl, format }
          setPhoto(result)
          resolve(result)
          input.remove()
        }
        reader.onerror = () => {
          setError('Failed to read file')
          resolve(null)
          input.remove()
        }
        reader.readAsDataURL(file)
      }

      document.body.appendChild(input)
      input.click()
    })
  }

  return { takePhoto, pickFromGallery, photo, error, loading }
}

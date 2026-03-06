import { useCallback, useRef, useState } from 'react'
import { Geolocation } from '@capacitor/geolocation'
import type { Position } from '@capacitor/geolocation'

export type GeoPosition = {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

function toGeoPosition(position: Position): GeoPosition {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    altitudeAccuracy: position.coords.altitudeAccuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: position.timestamp,
  }
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const watchIdRef = useRef<string | null>(null)

  const getCurrentPosition = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      })
      const result = toGeoPosition(pos)
      setPosition(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get position'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const watchPosition = useCallback(
    async (onPosition?: (pos: GeoPosition) => void) => {
      setError(null)

      // Clear existing watch
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current })
      }

      try {
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (pos, err) => {
            if (err) {
              setError(err.message)
              return
            }
            if (pos) {
              const result = toGeoPosition(pos)
              setPosition(result)
              onPosition?.(result)
            }
          },
        )
        watchIdRef.current = id
        return id
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to watch position'
        setError(message)
        return null
      }
    },
    [],
  )

  const clearWatch = useCallback(async () => {
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current })
      watchIdRef.current = null
    }
  }, [])

  return { position, error, loading, getCurrentPosition, watchPosition, clearWatch }
}

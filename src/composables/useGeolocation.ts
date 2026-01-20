import { onBeforeUnmount, ref } from 'vue'

type LatLng = { lat: number; lng: number; accuracy?: number }

const defaultOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 5000,
}

export function useGeolocation(fallbackLocation?: LatLng) {
  const position = ref<GeolocationPosition | null>(null)
  const accuracy = ref<number | null>(null)
  const error = ref<string | null>(null)
  const permissionDenied = ref(false)
  const loading = ref(false)
  const lastUpdate = ref<Date | null>(null)
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const watchId = ref<number | null>(null)

  const applyPosition = (coords: LatLng) => {
    const timestamp = Date.now()
    position.value = {
      coords: {
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy ?? 500,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp,
    } as GeolocationPosition
    accuracy.value = coords.accuracy ?? 500
    lastUpdate.value = new Date(timestamp)
  }

  const startWatching = (options: PositionOptions = defaultOptions) => {
    if (!isSupported) {
      if (fallbackLocation) {
        applyPosition(fallbackLocation)
      }
      error.value = 'Геолокация не поддерживается этим устройством.'
      return
    }

    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
    }

    loading.value = true
    error.value = null
    permissionDenied.value = false

    watchId.value = navigator.geolocation.watchPosition(
      (pos) => {
        position.value = pos
        accuracy.value = pos.coords.accuracy
        lastUpdate.value = new Date(pos.timestamp)
        loading.value = false
      },
      (err) => {
        loading.value = false
        error.value = err.message
        permissionDenied.value = err.code === err.PERMISSION_DENIED
        if (fallbackLocation) {
          applyPosition(fallbackLocation)
        }
      },
      { ...defaultOptions, ...options },
    )
  }

  const stopWatching = () => {
    if (watchId.value !== null && isSupported) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
  }

  const retry = () => {
    error.value = null
    startWatching()
  }

  const setFallbackPosition = (coords: LatLng) => applyPosition(coords)

  onBeforeUnmount(() => {
    stopWatching()
  })

  return {
    position,
    accuracy,
    error,
    loading,
    permissionDenied,
    isSupported,
    lastUpdate,
    startWatching,
    stopWatching,
    retry,
    setFallbackPosition,
  }
}

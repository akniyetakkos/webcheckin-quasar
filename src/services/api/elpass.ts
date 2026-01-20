export type CheckStatus = 'idle' | 'checked_in' | 'checked_out'

export type CheckActionType = 'check-in' | 'check-out'

export interface CheckAction {
  type: CheckActionType
  timestamp: number
  locationName: string
  coords?: { lat: number; lng: number }
}

export interface StatusResponse {
  status: CheckStatus
  action: CheckAction | null
}

export interface CheckPayload {
  lat: number
  lng: number
  timestamp?: number
  locationName: string
}

const withLatency = async <T>(data: () => T): Promise<T> =>
  new Promise((resolve, reject) => {
    const delay = 600 + Math.random() * 700
    setTimeout(() => {
      if (Math.random() < 0.15) {
        reject(new Error('Mock API: временная ошибка. Попробуйте еще раз.'))
        return
      }
      resolve(data())
    }, delay)
  })

export async function getStatus(): Promise<StatusResponse> {
  return withLatency(() => ({
    status: 'checked_out',
    action: null,
  }))
}

export async function postCheckIn(payload: CheckPayload): Promise<StatusResponse> {
  const timestamp = payload.timestamp ?? Date.now()
  return withLatency(() => ({
    status: 'checked_in' as CheckStatus,
    action: {
      type: 'check-in',
      timestamp,
      locationName: payload.locationName,
      coords: { lat: payload.lat, lng: payload.lng },
    },
  }))
}

export async function postCheckOut(payload: CheckPayload): Promise<StatusResponse> {
  const timestamp = payload.timestamp ?? Date.now()
  return withLatency(() => ({
    status: 'checked_out' as CheckStatus,
    action: {
      type: 'check-out',
      timestamp,
      locationName: payload.locationName,
      coords: { lat: payload.lat, lng: payload.lng },
    },
  }))
}

import { defineStore } from 'pinia'
import {
  type CheckAction,
  type CheckPayload,
  type CheckStatus,
  getStatus,
  postCheckIn,
  postCheckOut,
} from '@/services/api/elpass'

interface CheckInState {
  status: CheckStatus
  loading: boolean
  lastAction: CheckAction | null
}

export const useCheckInStore = defineStore('checkIn', {
  state: (): CheckInState => ({
    status: 'idle',
    loading: false,
    lastAction: null,
  }),
  getters: {
    isWorking: (state) => state.loading,
  },
  actions: {
    async init() {
      this.loading = true
      try {
        const res = await getStatus()
        this.status = res.status
        this.lastAction = res.action
      } finally {
        this.loading = false
      }
    },
    async checkIn(payload: CheckPayload) {
      if (this.loading) return
      this.loading = true
      try {
        const res = await postCheckIn(payload)
        this.status = res.status
        this.lastAction = res.action
        return res
      } finally {
        this.loading = false
      }
    },
    async checkOut(payload: CheckPayload) {
      if (this.loading) return
      this.loading = true
      try {
        const res = await postCheckOut(payload)
        this.status = res.status
        this.lastAction = res.action
        return res
      } finally {
        this.loading = false
      }
    },
    async toggle(payload: CheckPayload) {
      return this.status === 'checked_in' ? this.checkOut(payload) : this.checkIn(payload)
    },
  },
})

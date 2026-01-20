import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useNetworkStatus() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  const update = () => {
    online.value = typeof navigator === 'undefined' ? true : navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { online }
}

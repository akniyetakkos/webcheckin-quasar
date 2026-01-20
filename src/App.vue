<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import MapView from '@/components/MapView.vue'
import CheckInSummary from '@/components/CheckInSummary.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { WORK_LOCATION } from '@/constants/workLocation'
import { useCheckInStore } from '@/stores/checkIn'
import { distanceInMeters, formatTime } from '@/utils/geo'

const $q = useQuasar()
const checkInStore = useCheckInStore()
const { online } = useNetworkStatus()
const summaryOpen = ref(false)

const {
  position,
  accuracy,
  error,
  permissionDenied,
  isSupported,
  loading: geoLoading,
  lastUpdate,
  startWatching,
  setFallbackPosition,
} = useGeolocation({ lat: WORK_LOCATION.lat, lng: WORK_LOCATION.lng })

const userPoint = computed(() =>
  position.value
    ? {
        lat: position.value.coords.latitude,
        lng: position.value.coords.longitude,
      }
    : null,
)

const distanceToWork = computed(() =>
  userPoint.value ? distanceInMeters(userPoint.value, WORK_LOCATION) : null,
)

const isWithinRadius = computed(() => {
  if (!distanceToWork.value) return false
  return distanceToWork.value <= WORK_LOCATION.radius
})

const canCheck = computed(
  () =>
    !!userPoint.value && isWithinRadius.value && online.value && !checkInStore.isWorking && !geoLoading.value,
)

const actionLabel = computed(() => (checkInStore.status === 'checked_in' ? 'Check-Out' : 'Check-In'))

const statusLabel = computed(() => {
  switch (checkInStore.status) {
    case 'checked_in':
      return 'На смене'
    case 'checked_out':
      return 'Вне смены'
    default:
      return 'Ожидание'
  }
})

const statusColor = computed(() => {
  switch (checkInStore.status) {
    case 'checked_in':
      return 'positive'
    case 'checked_out':
      return 'grey-7'
    default:
      return 'warning'
  }
})

const handleToggle = async () => {
  if (!userPoint.value) {
    $q.notify({ type: 'warning', message: 'Геопозиция недоступна' })
    return
  }

  try {
    await checkInStore.toggle({
      lat: userPoint.value.lat,
      lng: userPoint.value.lng,
      locationName: WORK_LOCATION.name,
      timestamp: Date.now(),
    })
    summaryOpen.value = true
    $q.notify({
      type: 'positive',
      message: `Успешно: ${checkInStore.status === 'checked_in' ? 'Check-In' : 'Check-Out'}`,
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Не удалось выполнить действие',
    })
  }
}

const useFallback = () => {
  setFallbackPosition({ lat: WORK_LOCATION.lat, lng: WORK_LOCATION.lng })
  $q.notify({
    type: 'info',
    message: 'Используем запасную точку (mock)',
  })
}

onMounted(() => {
  startWatching()
  checkInStore.init().catch((err) => {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Не удалось получить статус',
    })
  })
})

watch(error, (val) => {
  if (val) {
    $q.notify({ type: 'warning', message: val })
  }
})
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>WebCheckIn (mock)</q-toolbar-title>
        <q-badge :color="online ? 'positive' : 'negative'" align="middle">
          {{ online ? 'Online' : 'Offline' }}
        </q-badge>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md">
        <div class="q-gutter-md">
          <q-banner v-if="!online" dense rounded class="bg-grey-3 text-black">
            Нет соединения. Действия будут доступны, когда интернет восстановится.
          </q-banner>

          <q-banner
            v-if="permissionDenied"
            dense
            rounded
            class="bg-orange-1 text-orange-9"
            inline-actions
          >
            Доступ к геолокации отклонен. Разрешите доступ или используйте запасную локацию.
            <template #action>
              <q-btn flat label="Запасной вариант" color="orange-9" @click="useFallback" />
            </template>
          </q-banner>

          <MapView
            :position="userPoint"
            :accuracy="accuracy ?? 0"
            :work-location="WORK_LOCATION"
            :is-within-radius="isWithinRadius"
            :last-update="lastUpdate"
            @center="startWatching"
          />

          <q-card>
            <q-card-section class="row items-center justify-between">
              <div>
                <div class="text-caption text-grey-7">Текущий статус</div>
                <div class="text-h6">{{ statusLabel }}</div>
                <div class="text-caption text-grey-6" v-if="checkInStore.lastAction">
                  Последнее действие:
                  {{ checkInStore.lastAction.type === 'check-in' ? 'Check-In' : 'Check-Out' }}
                  ·
                  {{ formatTime(checkInStore.lastAction.timestamp) }}
                </div>
              </div>
              <q-chip outline :color="statusColor">{{ statusLabel }}</q-chip>
            </q-card-section>
            <q-separator />
            <q-card-section class="row items-center q-gutter-md">
              <div class="column">
                <div class="text-caption text-grey-7">Координаты</div>
                <div class="text-body1">
                  <span v-if="userPoint">
                    {{ userPoint.lat.toFixed(5) }}, {{ userPoint.lng.toFixed(5) }}
                  </span>
                  <span v-else class="text-grey-6">Недоступны</span>
                </div>
              </div>
              <div class="column">
                <div class="text-caption text-grey-7">Точность</div>
                <div class="text-body1">
                  <span v-if="accuracy">{{ Math.round(accuracy) }} м</span>
                  <span v-else class="text-grey-6">-</span>
                </div>
              </div>
              <div class="column">
                <div class="text-caption text-grey-7">Дистанция до точки</div>
                <div class="text-body1">
                  <span v-if="distanceToWork !== null">{{ distanceToWork }} м</span>
                  <span v-else class="text-grey-6">-</span>
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                color="primary"
                unelevated
                :disable="!canCheck"
                :loading="checkInStore.isWorking || geoLoading"
                :label="actionLabel"
                @click="handleToggle"
              />
            </q-card-actions>
          </q-card>

          <q-card>
            <q-card-section>
              <div class="text-subtitle1">Геолокация</div>
              <div class="text-body2 text-grey-7">Точность high accuracy, обновление в реальном времени.</div>
              <div class="text-caption text-grey-6" v-if="!isSupported">
                Браузер не поддерживает Geolocation API — используем fallback.
              </div>
              <div class="text-caption text-grey-6" v-else-if="geoLoading">Получаем координаты...</div>
              <div class="text-caption text-grey-6" v-else-if="lastUpdate">
                Последнее обновление: {{ lastUpdate.toLocaleTimeString() }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <CheckInSummary
          v-model="summaryOpen"
          :action="checkInStore.lastAction"
          :location-name="WORK_LOCATION.name"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

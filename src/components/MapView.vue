<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L, { type Circle, type Map as LeafletMap, type Marker } from 'leaflet'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const props = defineProps<{
  position: { lat: number; lng: number } | null
  accuracy: number | null
  workLocation: { lat: number; lng: number; radius: number; name: string }
  isWithinRadius: boolean
  lastUpdate: Date | null
}>()

const emit = defineEmits<{
  (e: 'center'): void
}>()

const mapRoot = ref<HTMLElement | null>(null)
let map: LeafletMap | null = null
let marker: Marker | null = null
let accuracyCircle: Circle | null = null
let workCircle: Circle | null = null

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

const setWorkArea = () => {
  if (!map) return
  if (workCircle) {
    workCircle.setLatLng([props.workLocation.lat, props.workLocation.lng])
    workCircle.setRadius(props.workLocation.radius)
    return
  }
  workCircle = L.circle([props.workLocation.lat, props.workLocation.lng], {
    radius: props.workLocation.radius,
    color: '#027be3',
    weight: 1,
    fillColor: '#027be3',
    fillOpacity: 0.08,
  }).addTo(map)
}

const updateUserPosition = () => {
  if (!map || !props.position) return
  const { lat, lng } = props.position
  if (!marker) {
    marker = L.marker([lat, lng]).addTo(map)
    map.setView([lat, lng], 17)
  } else {
    marker.setLatLng([lat, lng])
  }
  if (!accuracyCircle) {
    accuracyCircle = L.circle([lat, lng], {
      radius: props.accuracy ?? 0,
      color: '#21ba45',
      weight: 1,
      fillColor: '#21ba45',
      fillOpacity: 0.1,
    }).addTo(map)
  } else {
    accuracyCircle.setLatLng([lat, lng])
    accuracyCircle.setRadius(props.accuracy ?? 0)
  }
}

const centerOnUser = () => {
  if (props.position && map) {
    map.flyTo([props.position.lat, props.position.lng], 17)
  }
  emit('center')
}

onMounted(() => {
  if (!mapRoot.value) return
  map = L.map(mapRoot.value, {
    zoomControl: false,
  }).setView([props.workLocation.lat, props.workLocation.lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  setWorkArea()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

watch(
  () => props.position,
  () => updateUserPosition(),
  { immediate: true },
)

watch(
  () => props.workLocation,
  () => setWorkArea(),
  { deep: true },
)
</script>

<template>
  <div class="map-wrapper">
    <div ref="mapRoot" class="map-root" />
    <div class="map-controls q-pa-sm row items-center justify-between">
      <div class="column">
        <div class="text-caption text-grey-8">
          {{ workLocation.name }}
        </div>
        <div class="text-body2">
          Радиус: {{ workLocation.radius }} м
        </div>
        <div class="text-caption text-grey-7" v-if="lastUpdate">
          Обновлено: {{ lastUpdate.toLocaleTimeString() }}
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-chip
          dense
          :color="isWithinRadius ? 'positive' : 'warning'"
          text-color="white"
        >
          {{ isWithinRadius ? 'В зоне' : 'Вне зоны' }}
        </q-chip>
        <q-btn
          color="primary"
          outline
          dense
          icon="my_location"
          label="Центрировать"
          @click="centerOnUser"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  background: white;
  min-height: 360px;
}

.map-root {
  height: 360px;
  width: 100%;
}

.map-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
}
</style>

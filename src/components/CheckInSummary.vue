<script setup lang="ts">
import { computed } from 'vue'
import { formatTime } from '@/utils/geo'
import type { CheckAction } from '@/services/api/elpass'

const props = defineProps<{
  modelValue: boolean
  action: CheckAction | null
  locationName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const actionTitle = computed(() => {
  if (!props.action) return 'Регистрация'
  return props.action.type === 'check-in' ? 'Вход зафиксирован' : 'Выход зафиксирован'
})
</script>

<template>
  <q-dialog v-model="dialogModel" transition-show="scale" transition-hide="fade">
    <q-card class="q-pa-md" style="min-width: 320px">
      <q-card-section class="row items-center q-gutter-sm">
        <q-avatar color="positive" text-color="white" icon="check" />
        <div>
          <div class="text-subtitle1">{{ actionTitle }}</div>
          <div class="text-caption text-grey-7">
            {{ locationName }}
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="action">
        <div class="q-gutter-y-sm">
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Тип действия</span>
            <span class="text-body2 text-weight-medium">
              {{ action.type === 'check-in' ? 'Check-In' : 'Check-Out' }}
            </span>
          </div>
          <div class="row justify-between">
            <span class="text-caption text-grey-7">Время</span>
            <span class="text-body2 text-weight-medium">
              {{ formatTime(action.timestamp) }}
            </span>
          </div>
          <div class="row justify-between" v-if="action.coords">
            <span class="text-caption text-grey-7">Координаты</span>
            <span class="text-body2 text-weight-medium">
              {{ action.coords.lat.toFixed(5) }}, {{ action.coords.lng.toFixed(5) }}
            </span>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" unelevated label="OK" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

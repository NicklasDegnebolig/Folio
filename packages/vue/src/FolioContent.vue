<script setup lang="ts">
import { onMounted, ref, shallowRef, type Component } from 'vue'
import type { ContentEntry } from 'folio'

const props = defineProps<{
  entry: ContentEntry | null
  components?: Record<string, Component>
}>()

const BodyComponent = shallowRef<Component | null>(null)
const loading = ref(true)
const error = ref<Error | null>(null)

onMounted(async () => {
  if (!props.entry) return
  try {
    const mod = await props.entry.body()
    BodyComponent.value = mod.default
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <slot v-if="error" name="error" :error="error" />
  <slot v-else-if="loading" name="loading" />
  <component
    :is="BodyComponent"
    v-else-if="BodyComponent"
    v-bind="{ components }"
  />
</template>

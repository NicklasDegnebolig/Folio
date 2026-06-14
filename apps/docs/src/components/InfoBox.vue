<script setup lang="ts">
defineProps<{
  type?: 'info' | 'tip' | 'warning'
}>()
</script>

<template>
  <div :class="['infobox', `infobox--${type ?? 'info'}`]">
    <span class="infobox__icon">
      <template v-if="type === 'tip'">💡</template>
      <template v-else-if="type === 'warning'">⚠️</template>
      <template v-else>ℹ️</template>
    </span>
    <div class="infobox__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.infobox {
  display: flex;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  border-radius: 8px;
  border-left: 3px solid;
  margin: 1.25rem 0;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.infobox__icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.infobox__body {
  flex: 1;
}

.infobox--info {
  background: #eef2ff;
  border-color: #5c6ff0;
  color: #2d3178;
}

.infobox--tip {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #14532d;
}

.infobox--warning {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #78350f;
}
</style>

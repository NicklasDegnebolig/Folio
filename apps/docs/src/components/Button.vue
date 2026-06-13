<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}>()
</script>

<template>
  <a
    v-if="href"
    :href="href"
    :class="['btn', `btn--${variant ?? 'primary'}`, `btn--${size ?? 'md'}`]"
  >
    <slot />
  </a>
  <button
    v-else
    :class="['btn', `btn--${variant ?? 'primary'}`, `btn--${size ?? 'md'}`]"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition:
    background 120ms,
    box-shadow 120ms,
    transform 80ms;
  white-space: nowrap;
  line-height: 1;
}

.btn:active {
  transform: translateY(1px);
}

/* sizes */
.btn--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
.btn--md {
  padding: 0.5rem 1.125rem;
  font-size: 0.9375rem;
}
.btn--lg {
  padding: 0.6875rem 1.5rem;
  font-size: 1.0625rem;
}

/* variants */
.btn--primary {
  background: #5c6ff0;
  color: #fff;
  box-shadow: 0 1px 3px rgba(92, 111, 240, 0.35);
}
.btn--primary:hover {
  background: #4a5ce0;
  box-shadow: 0 2px 8px rgba(92, 111, 240, 0.45);
}

.btn--secondary {
  background: #f0f1f7;
  color: #3a3d5c;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.btn--secondary:hover {
  background: #e2e4f0;
}

.btn--ghost {
  background: transparent;
  color: #5c6ff0;
  box-shadow: inset 0 0 0 1.5px #5c6ff0;
}
.btn--ghost:hover {
  background: rgba(92, 111, 240, 0.06);
}
</style>

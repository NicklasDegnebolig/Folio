<script setup lang="ts">
import { computed } from 'vue'
import { useContentList, FolioContent } from '@nicklasdegnebolig/folio-vue'
import Button from './components/Button.vue'
import InfoBox from './components/InfoBox.vue'

const { entries, loading } = useContentList('/')

const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

const active = computed(
  () =>
    entries.value.find((e) => e.path === pathname) ?? entries.value[0] ?? null,
)
</script>

<template>
  <div style="display: flex; gap: 2rem; padding: 2rem; font-family: sans-serif">
    <nav style="min-width: 200px">
      <h3 style="margin-top: 0">Docs</h3>
      <p v-if="loading">Loading…</p>
      <ul v-else style="list-style: none; padding: 0">
        <li v-for="e in entries" :key="e.path" style="margin-bottom: 0.5rem">
          <a
            :href="e.path"
            :style="{
              fontWeight: active?.path === e.path ? 'bold' : 'normal',
              textDecoration: 'none',
              cursor: 'pointer',
            }"
          >
            {{ (e.frontmatter as { title?: string }).title ?? e.path }}
          </a>
        </li>
      </ul>
    </nav>

    <main style="flex: 1">
      <FolioContent
        v-if="active"
        :entry="active"
        :components="{ Button, InfoBox }"
      >
        <template #loading>Loading…</template>
      </FolioContent>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useContentList, FolioContent } from '@folio/vue'
import type { ContentEntry } from 'folio'

const { entries, loading } = useContentList('/docs')
const active = ref<ContentEntry | null>(null)
</script>

<template>
  <div style="display: flex; gap: 2rem; padding: 2rem; font-family: sans-serif">
    <nav style="min-width: 200px">
      <h3 style="margin-top: 0">Docs</h3>
      <p v-if="loading">Loading…</p>
      <ul v-else style="list-style: none; padding: 0">
        <li v-for="e in entries" :key="e.path" style="margin-bottom: 0.5rem">
          <a
            href="#"
            @click.prevent="active = e"
            :style="{
              fontWeight: active?.path === e.path ? 'bold' : 'normal',
              cursor: 'pointer',
            }"
          >
            {{ (e.frontmatter as { title?: string }).title ?? e.path }}
          </a>
        </li>
      </ul>
    </nav>

    <main style="flex: 1">
      <p v-if="!active" style="color: #888">← Select a page</p>
      <FolioContent v-else :entry="active">
        <template #loading>Loading content…</template>
      </FolioContent>
    </main>
  </div>
</template>

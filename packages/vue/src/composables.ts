import { onMounted, ref } from 'vue'
import type { ContentEntry, ListOptions } from 'folio'

export function useContentList(prefix: string, options?: ListOptions) {
  const entries = ref<ContentEntry[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(async () => {
    try {
      const { listContent } = await import(
        /* @vite-ignore */ 'virtual:folio/query'
      )
      entries.value = await listContent(prefix, options)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { entries, loading, error }
}

export function useContent(path: string, options?: ListOptions) {
  const entry = ref<ContentEntry | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(async () => {
    try {
      const { getContent } = await import(
        /* @vite-ignore */ 'virtual:folio/query'
      )
      entry.value = (await getContent(path, options)) ?? null
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { entry, loading, error }
}

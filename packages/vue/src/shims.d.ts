declare module 'virtual:folio/query' {
  import type { ContentEntry, ListOptions } from '@nicklasdegnebolig/folio'
  export function listContent(
    prefix: string,
    options?: ListOptions,
  ): Promise<ContentEntry[]>
  export function getContent(
    path: string,
    options?: ListOptions,
  ): Promise<ContentEntry | undefined>
}

declare module 'virtual:folio/index' {
  import type { IndexEntry } from '@nicklasdegnebolig/folio/internal/scanner'
  export const index: IndexEntry[]
}

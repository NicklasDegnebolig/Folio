import type { IndexEntry } from './scanner.js'
import type { ContentEntry, ListOptions } from './types.js'

function toContentEntry(entry: IndexEntry): ContentEntry {
  return {
    path: entry.path,
    ...(entry.locale !== undefined && { locale: entry.locale }),
    frontmatter: entry.frontmatter,
    body: () => import(/* @vite-ignore */ entry.filePath),
  }
}

export function createQueryAPI(index: IndexEntry[]) {
  async function listContent(
    prefix: string,
    options?: ListOptions,
  ): Promise<ContentEntry[]> {
    let results = index.filter((e) => e.path.startsWith(prefix))
    if (options?.locale) {
      results = results.filter((e) => e.locale === options.locale)
    }
    return results.map(toContentEntry)
  }

  async function getContent(
    path: string,
    options?: ListOptions,
  ): Promise<ContentEntry | undefined> {
    let entry = index.find((e) => e.path === path)
    if (options?.locale) {
      entry = index.find((e) => e.path === path && e.locale === options.locale)
    }
    return entry ? toContentEntry(entry) : undefined
  }

  return { listContent, getContent }
}

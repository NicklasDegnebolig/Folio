import type { IndexEntry } from './scanner.js'

export function buildIndexModule(entries: IndexEntry[]): string {
  const serialised = entries.map((e) => ({
    path: e.path,
    locale: e.locale,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))

  return `export const index = ${JSON.stringify(serialised, null, 2)}`
}

export function buildQueryModule(entries: IndexEntry[]): string {
  const serialised = entries.map((e) => ({
    path: e.path,
    locale: e.locale,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))

  return `
import { createQueryAPI } from 'folio/internal/query'

const _index = ${JSON.stringify(serialised)}

const { listContent, getContent } = createQueryAPI(_index)
export { listContent, getContent }
`
}

export function buildRoutesModule(entries: IndexEntry[]): string {
  const routes = entries.map((e) => e.path)
  return `export const routes = ${JSON.stringify(routes)}`
}

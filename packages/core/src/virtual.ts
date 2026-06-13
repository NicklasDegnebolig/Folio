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
    locale: e.locale !== undefined ? e.locale : undefined,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))

  return `
const _index = ${JSON.stringify(serialised)}

export async function listContent(prefix, options) {
  let results = _index.filter(e => e.path.startsWith(prefix))
  if (options?.locale) results = results.filter(e => e.locale === options.locale)
  return results.map(e => ({
    path: e.path,
    ...(e.locale !== undefined && { locale: e.locale }),
    frontmatter: e.frontmatter,
    body: () => import(/* @vite-ignore */ e.filePath),
  }))
}

export async function getContent(path, options) {
  let entry = _index.find(e => e.path === path)
  if (options?.locale) entry = _index.find(e => e.path === path && e.locale === options.locale)
  if (!entry) return undefined
  return {
    path: entry.path,
    ...(entry.locale !== undefined && { locale: entry.locale }),
    frontmatter: entry.frontmatter,
    body: () => import(/* @vite-ignore */ entry.filePath),
  }
}
`
}

export function buildRoutesModule(entries: IndexEntry[]): string {
  const routes = entries.map((e) => e.path)
  return `export const routes = ${JSON.stringify(routes)}`
}

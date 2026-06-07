import matter from 'gray-matter'
import type { ContentFile, ContentSource, FolioOptions } from './types.js'

export interface IndexEntry {
  path: string
  locale?: string
  frontmatter: Record<string, unknown>
  filePath: string
}

export interface ResolvedPath {
  contentPath: string
  locale?: string
}

export function resolveContentPath(
  relativePath: string,
  locales: string[],
  frontmatterPath?: string,
): ResolvedPath {
  if (frontmatterPath) {
    return { contentPath: frontmatterPath }
  }

  const parts = relativePath.replace(/\.(md|mdx)$/, '').split('/')
  let locale: string | undefined

  if (parts.length > 1 && locales.includes(parts[0]!)) {
    locale = parts.shift()
  }

  const withoutIndex = parts.at(-1) === 'index' ? parts.slice(0, -1) : parts
  const contentPath =
    withoutIndex.length === 0 ? '/' : '/' + withoutIndex.join('/')

  return { contentPath, locale }
}

export async function buildIndex(
  _source: ContentSource,
  _options: Pick<FolioOptions, 'locales'>,
): Promise<IndexEntry[]> {
  return []
}

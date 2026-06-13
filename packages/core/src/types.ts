import type { Component } from 'vue'
import type { IndexEntry } from './scanner.js'

export interface ContentFile {
  filePath: string
  relativePath: string
}

export interface ContentSource {
  listFiles(prefix?: string): Promise<ContentFile[]>
  readFile(filePath: string): Promise<string>
  watch?(onChange: (file: ContentFile) => void): () => void
}

export interface ContentEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  path: string
  locale?: string
  frontmatter: T
  body: () => Promise<{ default: Component }>
}

export interface ListOptions {
  locale?: string
}

export interface SsgOptions {
  render: (path: string, entry: IndexEntry) => Promise<string>
}

export interface FolioOptions {
  contentDir?: string
  locales?: string[]
  jsxImportSource?: string
  ssg?: SsgOptions
}

export const SUPPORTED_EXTENSIONS = ['.md', '.mdx'] as const
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

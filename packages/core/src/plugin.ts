import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { buildIndex } from './scanner.js'
import { FileSystemSource } from './sources/filesystem.js'
import { transformContent } from './transformer.js'
import type { FolioOptions } from './types.js'
import { buildIndexModule, buildQueryModule } from './virtual.js'

const INDEX_ID = 'virtual:folio/index'
const QUERY_ID = 'virtual:folio/query'
const ROUTES_ID = 'virtual:folio/routes'
const RESOLVED_INDEX_ID = '\0' + INDEX_ID
const RESOLVED_QUERY_ID = '\0' + QUERY_ID
const RESOLVED_ROUTES_ID = '\0' + ROUTES_ID

const defaultOptions = {
  contentDir: 'content',
  jsxImportSource: 'vue',
  locales: [],
} satisfies FolioOptions

export function folio(userOptions: FolioOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions }
  let contentDir: string

  return {
    name: 'folio',

    configResolved(config) {
      contentDir = resolve(config.root, options.contentDir ?? 'content')
    },

    transform: {
      filter: { id: /\.(md|mdx)$/ },
      async handler(code, id) {
        return transformContent(code, id, options.jsxImportSource ?? 'vue')
      },
    },

    resolveId(id) {
      if (id === INDEX_ID) return RESOLVED_INDEX_ID
      if (id === QUERY_ID) return RESOLVED_QUERY_ID
      if (id === ROUTES_ID) return RESOLVED_ROUTES_ID
    },

    load: {
      filter: { id: /^\0virtual:folio\/(index|query)$/ },
      async handler(id) {
        const source = new FileSystemSource(contentDir)
        const entries = await buildIndex(source, { locales: options.locales })
        if (id === RESOLVED_QUERY_ID) return buildQueryModule(entries)
        return buildIndexModule(entries)
      },
    },
  }
}

import { resolve } from 'node:path'
import { exactRegex } from '@rolldown/pluginutils'
import type { Plugin } from 'vite'
import { buildIndex } from './scanner.js'
import { FileSystemSource } from './sources/filesystem.js'
import { transformContent } from './transformer.js'
import type { FolioOptions } from './types.js'
import { buildIndexModule } from './virtual.js'

const INDEX_ID = 'virtual:folio/index'
const ROUTES_ID = 'virtual:folio/routes'
const RESOLVED_INDEX_ID = '\0' + INDEX_ID
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

    resolveId: {
      filter: { id: /^virtual:folio\// },
      handler(id) {
        if (id === INDEX_ID) return RESOLVED_INDEX_ID
        if (id === ROUTES_ID) return RESOLVED_ROUTES_ID
      },
    },

    load: {
      filter: { id: exactRegex(RESOLVED_INDEX_ID) },
      async handler() {
        const source = new FileSystemSource(contentDir)
        const entries = await buildIndex(source, { locales: options.locales })
        return buildIndexModule(entries)
      },
    },
  }
}

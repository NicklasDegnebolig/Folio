import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { transformContent } from './transformer.js'
import type { FolioOptions } from './types.js'

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
  }
}

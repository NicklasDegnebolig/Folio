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

  return {
    name: 'folio',

    transform: {
      filter: { id: /\.(md|mdx)$/ },
      async handler(code, id) {
        return transformContent(code, id, options.jsxImportSource ?? 'vue')
      },
    },
  }
}

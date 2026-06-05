import type { FolioOptions } from './types.js'
import type { Plugin } from 'vite'

export function folio(_options: FolioOptions = {}): Plugin {
  return { name: 'folio' }
}

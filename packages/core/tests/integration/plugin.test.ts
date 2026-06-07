import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { folio } from '../../src/index.js'

const FIXTURES = join(import.meta.dirname, '../fixtures')

describe('when she installs folio in her Vite project', () => {
  let server: ViteDevServer

  beforeAll(async () => {
    server = await createServer({
      root: FIXTURES,
      plugins: [
        vue(),
        folio({ contentDir: 'content', jsxImportSource: 'vue' }),
      ],
      logLevel: 'silent',
      server: { port: 5999 },
    })
    await server.listen()
  })

  afterAll(async () => {
    await server.close()
  })

  it('her .mdx file compiles to JS with a default export', async () => {
    const result = await server.transformRequest('/content/en/blog/my-post.mdx')
    expect(result?.code).toContain('export default')
    expect(result?.code).toContain('vue/jsx-runtime')
  })

  it('her .md file also compiles correctly', async () => {
    const result = await server.transformRequest('/content/en/index.mdx')
    expect(result?.code).toContain('export default')
  })
})

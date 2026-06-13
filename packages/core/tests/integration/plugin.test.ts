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
      server: { port: 5999, hmr: false, ws: false },
      // Disable watcher so server.close() resolves promptly in tests
      watch: null,
    })
    await server.listen()
  })

  afterAll(() => {
    // server.close() can hang in test environments due to pending crawl requests;
    // fire-and-forget is safe here since the tests have already completed.
    void server.close()
  })

  it('her .mdx file compiles to JS with a default export', async () => {
    const result = await server.transformRequest('/content/en/blog/my-post.mdx')
    expect(result?.code).toContain('export default')
    // Vite pre-bundles bare specifiers, so 'vue/jsx-runtime' becomes 'vue_jsx-runtime'
    expect(result?.code).toMatch(/vue[_/]jsx-runtime/)
  })

  it('her index.mdx file also compiles correctly', async () => {
    const result = await server.transformRequest('/content/en/index.mdx')
    expect(result?.code).toContain('export default')
  })

  it('she can import virtual:folio/index to get all content metadata', async () => {
    const mod = await server.ssrLoadModule('virtual:folio/index')
    expect(Array.isArray(mod.index)).toBe(true)
    expect(mod.index.length).toBeGreaterThan(0)
    expect(mod.index[0]).toMatchObject({
      path: expect.any(String),
      frontmatter: expect.any(Object),
      filePath: expect.any(String),
    })
  })

  it('she can import virtual:folio/routes to get all content paths', async () => {
    const mod = await server.ssrLoadModule('virtual:folio/routes')
    expect(Array.isArray(mod.routes)).toBe(true)
    expect(mod.routes.length).toBeGreaterThan(0)
    expect(mod.routes.every((r: unknown) => typeof r === 'string')).toBe(true)
  })
})

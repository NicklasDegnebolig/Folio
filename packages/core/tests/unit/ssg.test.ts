import { join } from 'node:path'
import { readFile, rm } from 'node:fs/promises'
import { afterEach, describe, expect, it } from 'vitest'
import { generatePages } from '../../src/ssg.js'
import type { IndexEntry } from '../../src/scanner.js'

const TMP = join(import.meta.dirname, '../fixtures/tmp-ssg-output')

const entries: IndexEntry[] = [
  {
    path: '/docs/getting-started',
    frontmatter: { title: 'Getting Started' },
    filePath: '/fake/content/docs/getting-started.mdx',
  },
  {
    path: '/blog/hello',
    frontmatter: { title: 'Hello' },
    filePath: '/fake/content/blog/hello.mdx',
  },
]

afterEach(async () => {
  await rm(TMP, { recursive: true, force: true })
})

describe('when she runs SSG with a render function', () => {
  it('she gets an index.html written for each content path', async () => {
    await generatePages(entries, TMP, {
      render: async (path) => `<html><body>${path}</body></html>`,
    })

    const a = await readFile(
      join(TMP, 'docs/getting-started/index.html'),
      'utf8',
    )
    const b = await readFile(join(TMP, 'blog/hello/index.html'), 'utf8')

    expect(a).toBe('<html><body>/docs/getting-started</body></html>')
    expect(b).toBe('<html><body>/blog/hello</body></html>')
  })

  it('she can use frontmatter inside the render function', async () => {
    const titles: string[] = []
    await generatePages(entries, TMP, {
      render: async (path, entry) => {
        const title = entry.frontmatter['title'] as string
        titles.push(title)
        return `<html><title>${title}</title></html>`
      },
    })

    expect(titles).toEqual(['Getting Started', 'Hello'])
  })
})

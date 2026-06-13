import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildIndex } from '../../src/scanner.js'
import { FileSystemSource } from '../../src/sources/filesystem.js'
import { createQueryAPI } from '../../src/query.js'

const FIXTURES = join(import.meta.dirname, '../fixtures/content')

async function makeAPI() {
  const source = new FileSystemSource(FIXTURES)
  const index = await buildIndex(source, { locales: ['en', 'da'] })
  return createQueryAPI(index)
}

describe('when she calls listContent with a path prefix', () => {
  it('she only receives entries under that prefix', async () => {
    const { listContent } = await makeAPI()
    const posts = await listContent('/blog')
    expect(posts.every((p) => p.path.startsWith('/blog'))).toBe(true)
    expect(posts.length).toBeGreaterThan(0)
  })

  it('she gets an empty array when no entries match', async () => {
    const { listContent } = await makeAPI()
    const posts = await listContent('/nonexistent')
    expect(posts).toEqual([])
  })
})

describe('when she calls listContent with a locale filter', () => {
  it('she only receives posts in her chosen language', async () => {
    const { listContent } = await makeAPI()
    const posts = await listContent('/blog', { locale: 'da' })
    expect(posts.every((p) => p.locale === 'da')).toBe(true)
  })

  it('she gets an empty array when no posts match that locale', async () => {
    const { listContent } = await makeAPI()
    const posts = await listContent('/blog', { locale: 'fr' })
    expect(posts).toEqual([])
  })
})

describe('when she marks a post as draft', () => {
  it('still appears in listContent so she can preview it', async () => {
    const { listContent } = await makeAPI()
    const posts = await listContent('/blog')
    const draft = posts.find((p) => p.frontmatter['draft'] === true)
    expect(draft).toBeDefined()
  })
})

describe('when she calls getContent with a path', () => {
  it('she receives the entry for that path', async () => {
    const { getContent } = await makeAPI()
    const post = await getContent('/blog/my-post', { locale: 'en' })
    expect(post?.path).toBe('/blog/my-post')
    expect(post?.frontmatter['title']).toBe('My Post')
  })

  it('she gets undefined when no entry matches', async () => {
    const { getContent } = await makeAPI()
    const post = await getContent('/nonexistent')
    expect(post).toBeUndefined()
  })
})

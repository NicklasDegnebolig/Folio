import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { resolveContentPath, buildIndex } from '../../src/scanner.js'
import { FileSystemSource } from '../../src/sources/filesystem.js'

const FIXTURES = join(import.meta.dirname, '../fixtures/content')

describe('when she places a post directly in the content directory', () => {
  it('the path maps to the file name without extension', () => {
    const result = resolveContentPath('blog/my-post.mdx', [])
    expect(result.contentPath).toBe('/blog/my-post')
    expect(result.locale).toBeUndefined()
  })

  it('an index file resolves to its parent directory', () => {
    const result = resolveContentPath('docs/index.mdx', [])
    expect(result.contentPath).toBe('/docs')
  })

  it('a root index file resolves to /', () => {
    const result = resolveContentPath('index.mdx', [])
    expect(result.contentPath).toBe('/')
  })
})

describe('when she places a post in a locale directory', () => {
  it('strips the locale prefix from the path she queries', () => {
    const result = resolveContentPath('en/blog/my-post.mdx', ['en', 'da'])
    expect(result.contentPath).toBe('/blog/my-post')
  })

  it('tags the entry so she can filter by locale', () => {
    const result = resolveContentPath('en/blog/my-post.mdx', ['en', 'da'])
    expect(result.locale).toBe('en')
  })

  it('does not strip a directory that is not a declared locale', () => {
    const result = resolveContentPath('blog/my-post.mdx', ['en', 'da'])
    expect(result.contentPath).toBe('/blog/my-post')
    expect(result.locale).toBeUndefined()
  })
})

describe('when she overrides the path in frontmatter', () => {
  it('the frontmatter path wins over the filesystem path', () => {
    const result = resolveContentPath('blog/old-slug.mdx', [], '/new-slug')
    expect(result.contentPath).toBe('/new-slug')
  })
})

describe('when she builds the content index from a directory', () => {
  it('she gets an entry for every supported file', async () => {
    const source = new FileSystemSource(FIXTURES)
    const index = await buildIndex(source, { locales: ['en', 'da'] })
    expect(index.length).toBe(4)
  })

  it('each entry has a path, locale, and frontmatter', async () => {
    const source = new FileSystemSource(FIXTURES)
    const index = await buildIndex(source, { locales: ['en', 'da'] })
    const post = index.find(
      (e) => e.path === '/blog/my-post' && e.locale === 'en',
    )
    expect(post).toBeDefined()
    expect(post?.frontmatter.title).toBe('My Post')
  })
})

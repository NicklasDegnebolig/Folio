import { join } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { FileSystemSource } from '../../src/sources/filesystem.js'

const FIXTURES = join(import.meta.dirname, '../fixtures/content')

describe('when she provides a content directory', () => {
  let source: FileSystemSource

  beforeEach(() => {
    source = new FileSystemSource(FIXTURES)
  })

  it('she gets a list of all supported files', async () => {
    const files = await source.listFiles()
    expect(files.length).toBeGreaterThan(0)
    expect(
      files.every(
        (f) => f.filePath.endsWith('.md') || f.filePath.endsWith('.mdx'),
      ),
    ).toBe(true)
  })

  it('each file has an absolute filePath and a relativePath', async () => {
    const files = await source.listFiles()
    const file = files[0]
    expect(file.filePath).toMatch(/^\//)
    expect(file.relativePath).not.toMatch(/^\//)
  })

  it('she can filter files by a path prefix', async () => {
    const files = await source.listFiles('en/blog')
    expect(files.every((f) => f.relativePath.startsWith('en/blog'))).toBe(true)
    expect(files.length).toBe(2)
  })

  it('she can read a file by its absolute path', async () => {
    const files = await source.listFiles()
    const content = await source.readFile(files[0]!.filePath)
    expect(typeof content).toBe('string')
    expect(content.length).toBeGreaterThan(0)
  })
})

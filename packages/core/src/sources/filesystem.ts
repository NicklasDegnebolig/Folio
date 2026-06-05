import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import type { ContentFile, ContentSource } from '../types.js'
import { SUPPORTED_EXTENSIONS } from '../types.js'

async function walk(dir: string, root: string): Promise<ContentFile[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: ContentFile[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath, root)))
    } else if (
      SUPPORTED_EXTENSIONS.includes(
        extname(entry.name) as (typeof SUPPORTED_EXTENSIONS)[number],
      )
    ) {
      files.push({
        filePath: fullPath,
        relativePath: relative(root, fullPath).replace(/\\/g, '/'),
      })
    }
  }

  return files
}

export class FileSystemSource implements ContentSource {
  constructor(private readonly root: string) {}

  async listFiles(prefix?: string): Promise<ContentFile[]> {
    const files = await walk(this.root, this.root)
    if (!prefix) return files
    return files.filter((f) => f.relativePath.startsWith(prefix))
  }

  async readFile(filePath: string): Promise<string> {
    return readFile(filePath, 'utf-8')
  }
}

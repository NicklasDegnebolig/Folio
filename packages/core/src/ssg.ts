import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IndexEntry } from './scanner.js'
import type { SsgOptions } from './types.js'

export async function generatePages(
  entries: IndexEntry[],
  outDir: string,
  options: SsgOptions,
): Promise<void> {
  await Promise.all(
    entries.map(async (entry) => {
      const html = await options.render(entry.path, entry)
      // strip leading slash so join() gives e.g. outDir/docs/getting-started
      const rel = entry.path.replace(/^\//, '')
      const dir = join(outDir, rel)
      await mkdir(dir, { recursive: true })
      await writeFile(join(dir, 'index.html'), html, 'utf8')
    }),
  )
}

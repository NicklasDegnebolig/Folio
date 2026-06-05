# Folio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build folio — a Vite-native MDX content layer — from monorepo scaffold to a working Vue adapter, implemented milestone by milestone with tests always written first.

**Architecture:** Virtual index module (frontmatter only) + lazy dynamic MDX imports. All file access goes through a `ContentSource` interface. Plugin uses Rolldown filter-based hooks evaluated in Rust. First milestone is a single `.md` file rendering in the browser; every subsequent milestone adds green tests before implementation.

**Tech Stack:** pnpm workspaces, Vite 8 + Rolldown, vite-plus, tsdown, TypeScript 5 (strict), @mdx-js/mdx v3, gray-matter v4, Vue 3, @vitejs/plugin-vue, Vitest

---

## File Map

```text
/
  package.json                     ← workspace root
  pnpm-workspace.yaml
  vite.config.ts                   ← vite-plus: lint, fmt, staged
  tsdown.config.ts                 ← builds all packages/*
  tsconfig.json                    ← base tsconfig
  vitest.workspace.ts

packages/core/
  package.json                     ← name: folio
  tsconfig.json
  vitest.config.ts
  src/
    index.ts                       ← public exports
    types.ts                       ← ContentEntry, ContentSource, FolioOptions
    plugin.ts                      ← Vite plugin entry
    scanner.ts                     ← walks source, builds index
    transformer.ts                 ← @mdx-js/mdx compilation
    virtual.ts                     ← virtual module JS strings
    ssg.ts                         ← prerender / closeBundle
    sources/
      filesystem.ts                ← FileSystemSource
  tests/
    unit/
      filesystem-source.test.ts
      scanner.test.ts
      transformer.test.ts
    integration/
      plugin.test.ts
    fixtures/
      content/
        en/blog/my-post.mdx
        en/blog/draft-post.mdx
        en/index.mdx
        da/blog/my-post.mdx

packages/vue/
  package.json                     ← name: @folio/vue
  tsconfig.json
  vitest.config.ts
  src/
    index.ts
    composables.ts                 ← useContent, useContentList
    FolioContent.vue
  tests/
    unit/composables.test.ts
    integration/render.test.ts
    fixtures/TestApp.vue

apps/docs/
  package.json                     ← name: @folio/docs
  vite.config.ts
  index.html
  src/
    main.ts
    App.vue
    style.css
  content/
    index.md
    docs/getting-started.mdx

.claude/
  skills/
    setup.md                       ← first-time contributor setup
    test.md                        ← run tests for a package or all packages
    dev.md                         ← start docs dev server + open browser
    new-adapter.md                 ← scaffold a new @folio/<framework> adapter
    new-content.md                 ← scaffold a new MDX content file for docs
    add-fixture.md                 ← add a test fixture MDX file
```

---

## Task 1: Monorepo scaffold

**Files:**

- Create: `pnpm-workspace.yaml`
- Create: `package.json` (replace existing)
- Create: `tsconfig.json`
- Create: `vitest.workspace.ts`
- Move: existing `src/`, `index.html`, `public/`, `vite.config.js` → `apps/docs/`
- Create: `apps/docs/package.json`
- Create: `apps/docs/vite.config.ts`

- [ ] **Step 1: Install pnpm globally if needed**

```bash
npm install -g pnpm
pnpm --version
```

Expected: version printed (8+)

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 3: Replace root `package.json`**

```json
{
  "name": "folio-monorepo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @folio/docs dev",
    "build:packages": "tsdown",
    "test": "vitest",
    "prepare": "vp config"
  },
  "devDependencies": {
    "vite-plus": "latest",
    "tsdown": "latest",
    "vitest": "latest",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 4: Create root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create `vitest.workspace.ts`**

```ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace(['packages/*/vitest.config.ts'])
```

- [ ] **Step 6: Move existing folio docs app files into `apps/docs/`**

```bash
mkdir -p apps/docs/src apps/docs/public
mv src/* apps/docs/src/
mv index.html apps/docs/
mv public/* apps/docs/public/ 2>/dev/null || true
```

- [ ] **Step 7: Create `apps/docs/package.json`**

```json
{
  "name": "@folio/docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^8.0.0"
  }
}
```

- [ ] **Step 8: Create `apps/docs/vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

- [ ] **Step 9: Create `packages/` and `apps/` placeholder dirs**

```bash
mkdir -p packages/core/src packages/vue/src
```

- [ ] **Step 10: Install deps and verify docs app still starts**

```bash
pnpm install
pnpm dev
```

Expected: docs app starts at `http://localhost:5173`, Vue logo visible in browser (via Playwright or manual check).

- [ ] **Step 11: Remove old root-level lock file and node_modules**

```bash
rm -f package-lock.json
```

- [ ] **Step 12: Commit**

```bash
git init
git add .
git commit -m "chore: init monorepo scaffold, move folio docs app to apps/docs"
```

---

## Task 2: Vite+ toolchain

**Files:**

- Create: `vite.config.ts` (root, replaces nothing — new file)
- Create: `tsdown.config.ts`

- [ ] **Step 1: Create root `vite.config.ts` with vite-plus**

```ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
  lint: {
    plugins: ['typescript', 'unicorn'],
    options: { typeAware: true },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    overrides: [
      {
        files: ['**/*.test.ts'],
        plugins: ['typescript', 'vitest'],
        rules: { 'vitest/no-disabled-tests': 'error' },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: false,
    printWidth: 80,
  },
  staged: {
    '*.{js,ts,vue,mdx}': 'vp check --fix',
  },
})
```

- [ ] **Step 2: Create root `tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: 'packages/*',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
})
```

- [ ] **Step 3: Install vite-plus and tsdown, set up git hooks**

```bash
pnpm install
pnpm prepare
```

Expected: `vp config` runs, git hooks installed.

- [ ] **Step 4: Verify lint runs**

```bash
pnpm exec vp lint
```

Expected: exits 0 (no files to lint yet).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts tsdown.config.ts
git commit -m "chore: add vite-plus toolchain and tsdown config"
```

---

## Task 3: `packages/core` scaffold + types

**Files:**

- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "folio",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "@mdx-js/mdx": "^3.1.0",
    "@rolldown/pluginutils": "latest",
    "gray-matter": "^4.0.3"
  },
  "peerDependencies": {
    "vite": ">=8"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^8.0.0",
    "vue": "^3.5.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create `packages/core/src/types.ts`**

```ts
import type { Component } from 'vue'

export interface ContentFile {
  filePath: string
  relativePath: string
}

export interface ContentSource {
  listFiles(prefix?: string): Promise<ContentFile[]>
  readFile(filePath: string): Promise<string>
  watch?(onChange: (file: ContentFile) => void): () => void
}

export interface ContentEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  path: string
  locale?: string
  frontmatter: T
  body: () => Promise<{ default: Component }>
}

export interface ListOptions {
  locale?: string
}

export interface SsgOptions {
  render: (path: string) => Promise<string>
}

export interface FolioOptions {
  contentDir?: string
  locales?: string[]
  jsxImportSource?: string
  ssg?: SsgOptions
}

export const SUPPORTED_EXTENSIONS = ['.md', '.mdx'] as const
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]
```

- [ ] **Step 5: Create `packages/core/src/index.ts`**

```ts
export type {
  ContentEntry,
  ContentSource,
  FolioOptions,
  ListOptions,
} from './types.js'
export { folio } from './plugin.js'
```

- [ ] **Step 6: Install packages/core deps**

```bash
pnpm install
```

- [ ] **Step 7: Commit**

```bash
git add packages/core/
git commit -m "chore: scaffold packages/core with types"
```

---

## Task 4: Test fixtures

**Files:**

- Create: `packages/core/tests/fixtures/content/en/blog/my-post.mdx`
- Create: `packages/core/tests/fixtures/content/en/blog/draft-post.mdx`
- Create: `packages/core/tests/fixtures/content/en/index.mdx`
- Create: `packages/core/tests/fixtures/content/da/blog/my-post.mdx`

- [ ] **Step 1: Create `en/blog/my-post.mdx`**

```bash
mkdir -p packages/core/tests/fixtures/content/en/blog packages/core/tests/fixtures/content/da/blog
```

```mdx
---
title: My Post
date: 2024-01-15
draft: false
---

# My Post

This is the content of my post.
```

Write to: `packages/core/tests/fixtures/content/en/blog/my-post.mdx`

- [ ] **Step 2: Create `en/blog/draft-post.mdx`**

```mdx
---
title: Draft Post
date: 2024-02-01
draft: true
---

# Draft Post

This post is still a draft.
```

Write to: `packages/core/tests/fixtures/content/en/blog/draft-post.mdx`

- [ ] **Step 3: Create `en/index.mdx`**

```mdx
---
title: Home
---

# Welcome

Welcome to the home page.
```

Write to: `packages/core/tests/fixtures/content/en/index.mdx`

- [ ] **Step 4: Create `da/blog/my-post.mdx`**

```mdx
---
title: Mit indlæg
date: 2024-01-15
---

# Mit indlæg

Dette er indholdet af mit indlæg.
```

Write to: `packages/core/tests/fixtures/content/da/blog/my-post.mdx`

- [ ] **Step 5: Commit**

```bash
git add packages/core/tests/fixtures/
git commit -m "test: add MDX fixtures for core package tests"
```

---

## Task 5: FileSystemSource

**Files:**

- Create: `packages/core/tests/unit/filesystem-source.test.ts`
- Create: `packages/core/src/sources/filesystem.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/unit/filesystem-source.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- filesystem-source
```

Expected: FAIL — `Cannot find module '../../src/sources/filesystem.js'`

- [ ] **Step 3: Create `packages/core/src/sources/filesystem.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --filter folio -- filesystem-source
```

Expected: PASS — 4 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/sources/filesystem.ts packages/core/tests/unit/filesystem-source.test.ts
git commit -m "feat(core): add FileSystemSource"
```

---

## Task 6: Scanner (path resolution)

**Files:**

- Create: `packages/core/tests/unit/scanner.test.ts`
- Create: `packages/core/src/scanner.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/unit/scanner.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- scanner
```

Expected: FAIL — `Cannot find module '../../src/scanner.js'`

- [ ] **Step 3: Create `packages/core/src/scanner.ts`**

```ts
import matter from 'gray-matter'
import type { ContentFile, ContentSource, FolioOptions } from './types.js'

export interface IndexEntry {
  path: string
  locale?: string
  frontmatter: Record<string, unknown>
  filePath: string
}

export interface ResolvedPath {
  contentPath: string
  locale?: string
}

export function resolveContentPath(
  relativePath: string,
  locales: string[],
  frontmatterPath?: string,
): ResolvedPath {
  if (frontmatterPath) {
    return { contentPath: frontmatterPath }
  }

  const parts = relativePath.replace(/\.(md|mdx)$/, '').split('/')
  let locale: string | undefined

  if (parts.length > 1 && locales.includes(parts[0]!)) {
    locale = parts.shift()
  }

  const withoutIndex = parts.at(-1) === 'index' ? parts.slice(0, -1) : parts
  const contentPath =
    withoutIndex.length === 0 ? '/' : '/' + withoutIndex.join('/')

  return { contentPath, locale }
}

export async function buildIndex(
  source: ContentSource,
  options: Pick<FolioOptions, 'locales'>,
): Promise<IndexEntry[]> {
  const files = await source.listFiles()
  const locales = options.locales ?? []

  return Promise.all(
    files.map(async (file: ContentFile) => {
      const raw = await source.readFile(file.filePath)
      const { data: frontmatter } = matter(raw)
      const frontmatterPath =
        typeof frontmatter['path'] === 'string'
          ? frontmatter['path']
          : undefined
      const { contentPath, locale } = resolveContentPath(
        file.relativePath,
        locales,
        frontmatterPath,
      )

      return {
        path: contentPath,
        locale,
        frontmatter: frontmatter as Record<string, unknown>,
        filePath: file.filePath,
      }
    }),
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --filter folio -- scanner
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/scanner.ts packages/core/tests/unit/scanner.test.ts
git commit -m "feat(core): add scanner with path resolution and frontmatter parsing"
```

---

## Task 7: Transformer

**Files:**

- Create: `packages/core/tests/unit/transformer.test.ts`
- Create: `packages/core/src/transformer.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/unit/transformer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { transformContent } from '../../src/transformer.js'

describe('when she provides plain markdown content', () => {
  it('she gets back valid JavaScript with a default export', async () => {
    const code = '# Hello world\n\nThis is a paragraph.'
    const result = await transformContent(code, 'test.md', 'vue')
    expect(result.code).toContain('export default')
    expect(result.map).toBeNull()
  })

  it('the output imports from the vue jsx runtime', async () => {
    const code = '# Hello'
    const result = await transformContent(code, 'test.md', 'vue')
    expect(result.code).toContain('vue/jsx-runtime')
  })
})

describe('when she writes MDX with a component', () => {
  it('the component name is preserved in the output', async () => {
    const code = '# Hello\n\n<MyButton label="Click" />'
    const result = await transformContent(code, 'test.mdx', 'vue')
    expect(result.code).toContain('MyButton')
  })
})

describe('when her file has frontmatter', () => {
  it('the frontmatter is stripped from the rendered body', async () => {
    const code = '---\ntitle: My Post\n---\n\n# Body only'
    const result = await transformContent(code, 'test.mdx', 'vue')
    expect(result.code).not.toContain('title: My Post')
    expect(result.code).toContain('export default')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- transformer
```

Expected: FAIL — `Cannot find module '../../src/transformer.js'`

- [ ] **Step 3: Create `packages/core/src/transformer.ts`**

```ts
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'

export interface TransformResult {
  code: string
  map: null
}

export async function transformContent(
  code: string,
  id: string,
  jsxImportSource: string,
): Promise<TransformResult> {
  const compiled = await compile(code, {
    jsxImportSource,
    remarkPlugins: [remarkFrontmatter],
    providerImportSource: false,
  })

  return {
    code: String(compiled),
    map: null,
  }
}
```

- [ ] **Step 4: Install missing dependency**

```bash
pnpm --filter folio add remark-frontmatter
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test --filter folio -- transformer
```

Expected: PASS — all tests green

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/transformer.ts packages/core/tests/unit/transformer.test.ts
git commit -m "feat(core): add MDX transformer via @mdx-js/mdx"
```

---

## Task 8: Vite plugin (transform hook)

**Files:**

- Create: `packages/core/tests/integration/plugin.test.ts`
- Create: `packages/core/src/plugin.ts`

- [ ] **Step 1: Write the failing integration test**

Create `packages/core/tests/integration/plugin.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- plugin
```

Expected: FAIL — `Cannot find module '../../src/index.js'` or `folio is not a function`

- [ ] **Step 3: Create `packages/core/src/plugin.ts`**

```ts
import type { Plugin } from 'vite'
import { FileSystemSource } from './sources/filesystem.js'
import { transformContent } from './transformer.js'
import type { FolioOptions } from './types.js'
import { resolve } from 'node:path'

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
```

- [ ] **Step 4: Export `folio` from `src/index.ts`**

The `src/index.ts` already imports from `./plugin.js` — make sure it's correct:

```ts
export type {
  ContentEntry,
  ContentSource,
  FolioOptions,
  ListOptions,
} from './types.js'
export { folio } from './plugin.js'
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test --filter folio -- plugin
```

Expected: PASS — 2 tests green

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/plugin.ts packages/core/tests/integration/plugin.test.ts
git commit -m "feat(core): add Vite plugin with Rolldown filter-based transform hook"
```

---

## ★ Task 9: First Green — render `.md` to the page

**Files:**

- Create: `apps/docs/content/index.md`
- Modify: `apps/docs/vite.config.ts`
- Modify: `apps/docs/src/App.vue`
- Modify: `apps/docs/package.json`

- [ ] **Step 1: Add folio as a workspace dependency in apps/docs**

In `apps/docs/package.json`, add to `dependencies`:

```json
{
  "name": "@folio/docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "folio": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^8.0.0"
  }
}
```

- [ ] **Step 2: Update `apps/docs/vite.config.ts` to use folio**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { folio } from 'folio'

export default defineConfig({
  plugins: [vue(), folio({ jsxImportSource: 'vue' })],
})
```

- [ ] **Step 3: Create `apps/docs/content/index.md`**

```md
---
title: Welcome to Folio
---

# Welcome to Folio

This page is rendered from a plain markdown file via the **folio** Vite plugin.

No framework magic. No build scripts. Just a `.md` file.
```

- [ ] **Step 4: Update `apps/docs/src/App.vue` to render the markdown file**

```vue
<script setup lang="ts">
import Content from '../content/index.md'
</script>

<template>
  <main>
    <Content />
  </main>
</template>
```

- [ ] **Step 5: Install deps and start dev server**

```bash
pnpm install
pnpm dev
```

- [ ] **Step 6: Verify in browser with Playwright**

Open `http://localhost:5173` in the browser. Expected: the heading "Welcome to Folio" and the paragraph text are rendered. No Vue logo — the markdown content is live.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/
git commit -m "feat(docs): render first .md file via folio plugin — milestone 1 complete"
```

---

## Task 10: Virtual index module

**Files:**

- Create: `packages/core/src/virtual.ts`
- Modify: `packages/core/src/plugin.ts`
- Modify: `packages/core/tests/integration/plugin.test.ts`

- [ ] **Step 1: Add virtual index test to `plugin.test.ts`**

Add to the existing `describe` block in `packages/core/tests/integration/plugin.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- plugin
```

Expected: FAIL — `ssrLoadModule: virtual:folio/index failed to resolve`

- [ ] **Step 3: Create `packages/core/src/virtual.ts`**

```ts
import type { IndexEntry } from './scanner.js'

export function buildIndexModule(entries: IndexEntry[]): string {
  const serialised = entries.map((e) => ({
    path: e.path,
    locale: e.locale,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))

  return `export const index = ${JSON.stringify(serialised, null, 2)}`
}

export function buildRoutesModule(entries: IndexEntry[]): string {
  const routes = entries.map((e) => e.path)
  return `export const routes = ${JSON.stringify(routes)}`
}
```

- [ ] **Step 4: Update `packages/core/src/plugin.ts` to add resolveId + load hooks**

```ts
import type { Plugin } from 'vite'
import { resolve } from 'node:path'
import { exactRegex } from '@rolldown/pluginutils'
import { FileSystemSource } from './sources/filesystem.js'
import { buildIndex } from './scanner.js'
import { transformContent } from './transformer.js'
import { buildIndexModule, buildRoutesModule } from './virtual.js'
import type { FolioOptions } from './types.js'

const INDEX_ID = 'virtual:folio/index'
const ROUTES_ID = 'virtual:folio/routes'
const RESOLVED_INDEX_ID = '\0' + INDEX_ID
const RESOLVED_ROUTES_ID = '\0' + ROUTES_ID

const defaultOptions = {
  contentDir: 'content',
  jsxImportSource: 'vue',
  locales: [],
} satisfies FolioOptions

export function folio(userOptions: FolioOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions }
  let contentDir: string

  return {
    name: 'folio',

    configResolved(config) {
      contentDir = resolve(config.root, options.contentDir ?? 'content')
    },

    transform: {
      filter: { id: /\.(md|mdx)$/ },
      async handler(code, id) {
        return transformContent(code, id, options.jsxImportSource ?? 'vue')
      },
    },

    resolveId: {
      filter: { id: /^virtual:folio\// },
      handler(id) {
        if (id === INDEX_ID) return RESOLVED_INDEX_ID
        if (id === ROUTES_ID) return RESOLVED_ROUTES_ID
      },
    },

    load: {
      filter: { id: exactRegex(RESOLVED_INDEX_ID) },
      async handler() {
        const source = new FileSystemSource(contentDir)
        const entries = await buildIndex(source, { locales: options.locales })
        return buildIndexModule(entries)
      },
    },
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test --filter folio -- plugin
```

Expected: PASS — 3 tests green

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/virtual.ts packages/core/src/plugin.ts packages/core/tests/integration/plugin.test.ts
git commit -m "feat(core): add virtual:folio/index module"
```

---

## Task 11: Query API — `listContent` + `getContent`

**Files:**

- Create: `packages/core/src/query.ts`
- Create: `packages/core/tests/unit/query.test.ts`
- Modify: `packages/core/src/virtual.ts`
- Modify: `packages/core/src/plugin.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/tests/unit/query.test.ts`:

```ts
import { join } from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { createQueryAPI } from '../../src/query.js'
import { buildIndex } from '../../src/scanner.js'
import { FileSystemSource } from '../../src/sources/filesystem.js'

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
  it('it still appears in listContent so she can preview it', async () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- query
```

Expected: FAIL — `Cannot find module '../../src/query.js'`

- [ ] **Step 3: Create `packages/core/src/query.ts`**

```ts
import type { IndexEntry } from './scanner.js'
import type { ContentEntry, ListOptions } from './types.js'

function toContentEntry(
  entry: IndexEntry,
): Omit<ContentEntry, 'body'> & { filePath: string } {
  return {
    path: entry.path,
    locale: entry.locale,
    frontmatter: entry.frontmatter,
    filePath: entry.filePath,
    body: () => import(/* @vite-ignore */ entry.filePath),
  }
}

export function createQueryAPI(index: IndexEntry[]) {
  async function listContent(
    prefix: string,
    options?: ListOptions,
  ): Promise<ContentEntry[]> {
    let results = index.filter((e) => e.path.startsWith(prefix))
    if (options?.locale) {
      results = results.filter((e) => e.locale === options.locale)
    }
    return results.map(toContentEntry)
  }

  async function getContent(
    path: string,
    options?: ListOptions,
  ): Promise<ContentEntry | undefined> {
    let entry = index.find((e) => e.path === path)
    if (options?.locale) {
      entry = index.find((e) => e.path === path && e.locale === options.locale)
    }
    return entry ? toContentEntry(entry) : undefined
  }

  return { listContent, getContent }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --filter folio -- query
```

Expected: PASS — all tests green

- [ ] **Step 5: Update `packages/core/src/virtual.ts` to expose a query module**

Add to `virtual.ts`:

```ts
export function buildQueryModule(entries: IndexEntry[]): string {
  return `
import { createQueryAPI } from 'folio/internal/query'

const _index = ${JSON.stringify(
    entries.map((e) => ({
      path: e.path,
      locale: e.locale,
      frontmatter: e.frontmatter,
      filePath: e.filePath,
    })),
  )}

const { listContent, getContent } = createQueryAPI(_index)
export { listContent, getContent }
`
}
```

- [ ] **Step 6: Update `packages/core/src/index.ts` to export query functions**

```ts
export type {
  ContentEntry,
  ContentSource,
  FolioOptions,
  ListOptions,
} from './types.js'
export { folio } from './plugin.js'
export { createQueryAPI } from './query.js'
```

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/query.ts packages/core/tests/unit/query.test.ts packages/core/src/virtual.ts packages/core/src/index.ts
git commit -m "feat(core): add listContent and getContent query API"
```

---

## Task 12: `packages/vue` scaffold + composables

**Files:**

- Create: `packages/vue/package.json`
- Create: `packages/vue/tsconfig.json`
- Create: `packages/vue/vitest.config.ts`
- Create: `packages/vue/src/index.ts`
- Create: `packages/vue/tests/unit/composables.test.ts`
- Create: `packages/vue/src/composables.ts`

- [ ] **Step 1: Create `packages/vue/package.json`**

```json
{
  "name": "@folio/vue",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "folio": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.0",
    "folio": "workspace:*",
    "vue": "^3.5.0"
  }
}
```

- [ ] **Step 2: Create `packages/vue/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "preserve",
    "jsxImportSource": "vue"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/vue/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})
```

- [ ] **Step 4: Write the failing composables test**

Create `packages/vue/tests/unit/composables.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useContentList, useContent } from '../../src/composables.js'
import type { ContentEntry } from 'folio'

const mockEntries: ContentEntry[] = [
  {
    path: '/blog/my-post',
    locale: 'en',
    frontmatter: { title: 'My Post', date: '2024-01-15' },
    body: async () => ({
      default: defineComponent({ template: '<p>body</p>' }),
    }),
  },
  {
    path: '/blog/another',
    locale: 'en',
    frontmatter: { title: 'Another Post' },
    body: async () => ({
      default: defineComponent({ template: '<p>body</p>' }),
    }),
  },
]

vi.mock('virtual:folio/query', () => ({
  listContent: vi.fn().mockResolvedValue(mockEntries),
  getContent: vi.fn().mockResolvedValue(mockEntries[0]),
}))

describe('when she uses useContentList in a component', () => {
  it('she starts with loading true and entries empty', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContentList('/blog')
        },
        template: '<div>{{ loading }}</div>',
      }),
    )
    expect(wrapper.text()).toBe('true')
  })

  it('after mount she has the entries', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContentList('/blog')
        },
        template: '<div>{{ entries.length }}</div>',
      }),
    )
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toBe('2')
  })
})

describe('when she uses useContent in a component', () => {
  it('after mount she has the single entry', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useContent('/blog/my-post')
        },
        template: '<div>{{ entry?.frontmatter.title }}</div>',
      }),
    )
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toBe('My Post')
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

```bash
pnpm test --filter @folio/vue -- composables
```

Expected: FAIL — `Cannot find module '../../src/composables.js'`

- [ ] **Step 6: Create `packages/vue/src/composables.ts`**

```ts
import { onMounted, ref } from 'vue'
import type { ContentEntry, ListOptions } from 'folio'

export function useContentList(prefix: string, options?: ListOptions) {
  const entries = ref<ContentEntry[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(async () => {
    try {
      const { listContent } = await import('virtual:folio/query')
      entries.value = await listContent(prefix, options)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { entries, loading, error }
}

export function useContent(path: string, options?: ListOptions) {
  const entry = ref<ContentEntry | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(async () => {
    try {
      const { getContent } = await import('virtual:folio/query')
      entry.value = (await getContent(path, options)) ?? null
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { entry, loading, error }
}
```

- [ ] **Step 7: Create `packages/vue/src/index.ts`**

```ts
export { useContent, useContentList } from './composables.js'
export { default as FolioContent } from './FolioContent.vue'
```

- [ ] **Step 8: Run test to verify it passes**

```bash
pnpm test --filter @folio/vue -- composables
```

Expected: PASS — all tests green

- [ ] **Step 9: Commit**

```bash
git add packages/vue/
git commit -m "feat(vue): scaffold @folio/vue with useContent and useContentList composables"
```

---

## Task 13: `<FolioContent>` component

**Files:**

- Create: `packages/vue/tests/integration/render.test.ts`
- Create: `packages/vue/src/FolioContent.vue`

- [ ] **Step 1: Write the failing test**

Create `packages/vue/tests/integration/render.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import FolioContent from '../../src/FolioContent.vue'
import type { ContentEntry } from 'folio'

const BodyComponent = defineComponent({ template: '<p>rendered body</p>' })

const mockEntry: ContentEntry = {
  path: '/blog/my-post',
  locale: 'en',
  frontmatter: { title: 'My Post' },
  body: vi.fn().mockResolvedValue({ default: BodyComponent }),
}

describe('when she renders <FolioContent> with an entry', () => {
  it('she sees the rendered MDX body after loading', async () => {
    const wrapper = mount(FolioContent, { props: { entry: mockEntry } })
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('rendered body')
  })

  it('she sees the loading slot while the body loads', () => {
    const loadingEntry: ContentEntry = {
      ...mockEntry,
      body: () => new Promise(() => {}),
    }
    const wrapper = mount(FolioContent, {
      props: { entry: loadingEntry },
      slots: { loading: '<span>Loading...</span>' },
    })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('she sees the error slot when body fails to load', async () => {
    const errorEntry: ContentEntry = {
      ...mockEntry,
      body: vi.fn().mockRejectedValue(new Error('load failed')),
    }
    const wrapper = mount(FolioContent, {
      props: { entry: errorEntry },
      slots: { error: '<span>Error occurred</span>' },
    })
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('Error occurred')
  })

  it('she can pass custom components into the MDX body', async () => {
    const CustomButton = defineComponent({
      template: '<button>custom</button>',
    })
    const wrapper = mount(FolioContent, {
      props: { entry: mockEntry, components: { CustomButton } },
    })
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('rendered body')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter @folio/vue -- render
```

Expected: FAIL — `Cannot find module ... FolioContent.vue`

- [ ] **Step 3: Create `packages/vue/src/FolioContent.vue`**

```vue
<script setup lang="ts">
import { ref, shallowRef, onMounted, type Component } from 'vue'
import type { ContentEntry } from 'folio'

const props = defineProps<{
  entry: ContentEntry | null
  components?: Record<string, Component>
}>()

const BodyComponent = shallowRef<Component | null>(null)
const loading = ref(true)
const error = ref<Error | null>(null)

onMounted(async () => {
  if (!props.entry) return
  try {
    const mod = await props.entry.body()
    BodyComponent.value = mod.default
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <slot v-if="error" name="error" :error="error" />
  <slot v-else-if="loading" name="loading" />
  <component
    :is="BodyComponent"
    v-else-if="BodyComponent"
    v-bind="{ components }"
  />
</template>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --filter @folio/vue -- render
```

Expected: PASS — 4 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/vue/src/FolioContent.vue packages/vue/tests/integration/render.test.ts
git commit -m "feat(vue): add <FolioContent> component with loading/error slots"
```

---

## Task 14: Docs site uses `@folio/vue`

**Files:**

- Modify: `apps/docs/package.json`
- Modify: `apps/docs/vite.config.ts`
- Modify: `apps/docs/src/App.vue`
- Create: `apps/docs/content/docs/getting-started.mdx`

- [ ] **Step 1: Add `@folio/vue` to apps/docs**

Update `apps/docs/package.json` dependencies:

```json
{
  "name": "@folio/docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@folio/vue": "workspace:*",
    "folio": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "vite": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create `apps/docs/content/docs/getting-started.mdx`**

````mdx
---
title: Getting Started
---

# Getting Started

Install folio in your Vite project:

```bash
pnpm add folio
```
````

Add the plugin to your `vite.config.ts`:

```ts
import { folio } from 'folio'

export default defineConfig({
  plugins: [folio()],
})
```

Create a `content/` directory and add your first `.mdx` file.

````

- [ ] **Step 3: Update `apps/docs/src/App.vue` to use composables + FolioContent**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useContent, useContentList, FolioContent } from '@folio/vue'

const currentPath = ref('/')
const { entry, loading } = useContent(currentPath.value)
const { entries } = useContentList('/')
</script>

<template>
  <div class="layout">
    <nav>
      <ul>
        <li v-for="item in entries" :key="item.path">
          <a href="#" @click.prevent="currentPath = item.path">
            {{ item.frontmatter.title ?? item.path }}
          </a>
        </li>
      </ul>
    </nav>
    <main>
      <p v-if="loading">Loading…</p>
      <FolioContent v-else :entry="entry">
        <template #loading><p>Loading content…</p></template>
        <template #error="{ error }"><p>Error: {{ error.message }}</p></template>
      </FolioContent>
    </main>
  </div>
</template>
````

- [ ] **Step 4: Install and start dev server**

```bash
pnpm install
pnpm dev
```

- [ ] **Step 5: Verify in browser with Playwright**

Open `http://localhost:5173`. Expected: nav links list content entries, clicking a link renders the MDX content via `<FolioContent>`. The page starts with the home (`/`) content visible.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/
git commit -m "feat(docs): wire up @folio/vue composables and <FolioContent> in docs app"
```

---

## Task 15: SSG integration

**Files:**

- Create: `packages/core/src/ssg.ts`
- Modify: `packages/core/src/plugin.ts`
- Modify: `packages/core/src/virtual.ts`

- [ ] **Step 1: Add routes virtual module test to `plugin.test.ts`**

Add to the existing integration test describe block:

```ts
it('she can import virtual:folio/routes to get all content paths', async () => {
  const mod = await server.ssrLoadModule('virtual:folio/routes')
  expect(Array.isArray(mod.routes)).toBe(true)
  expect(mod.routes).toContain('/blog/my-post')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --filter folio -- plugin
```

Expected: FAIL — `virtual:folio/routes failed to resolve`

- [ ] **Step 3: Create `packages/core/src/ssg.ts`**

```ts
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { IndexEntry } from './scanner.js'
import type { SsgOptions } from './types.js'

export async function runPrerender(
  options: SsgOptions,
  entries: IndexEntry[],
  outDir: string,
): Promise<void> {
  for (const entry of entries) {
    const html = await options.render(entry.path)
    const dir = join(outDir, entry.path === '/' ? '' : entry.path)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'index.html'), html, 'utf-8')
  }
}
```

- [ ] **Step 4: Update `packages/core/src/virtual.ts` to add `buildRoutesModule`**

Add to `virtual.ts` (already partially written in Task 10 — complete it):

```ts
import type { IndexEntry } from './scanner.js'

export function buildIndexModule(entries: IndexEntry[]): string {
  const serialised = entries.map((e) => ({
    path: e.path,
    locale: e.locale,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))
  return `export const index = ${JSON.stringify(serialised, null, 2)}`
}

export function buildRoutesModule(entries: IndexEntry[]): string {
  const routes = entries.map((e) => e.path)
  return `export const routes = ${JSON.stringify(routes)}`
}

export function buildQueryModule(entries: IndexEntry[]): string {
  const serialised = entries.map((e) => ({
    path: e.path,
    locale: e.locale,
    frontmatter: e.frontmatter,
    filePath: e.filePath,
  }))
  return `
import { createQueryAPI } from 'folio/internal/query'
const _index = ${JSON.stringify(serialised)}
const { listContent, getContent } = createQueryAPI(_index)
export { listContent, getContent }
`
}
```

- [ ] **Step 5: Update `packages/core/src/plugin.ts` to wire routes + closeBundle**

Replace the load hook section and add closeBundle:

```ts
load: {
  filter: { id: /^\0virtual:folio\// },
  async handler(id) {
    const source = new FileSystemSource(contentDir)
    const entries = await buildIndex(source, { locales: options.locales })
    if (id === RESOLVED_INDEX_ID) return buildIndexModule(entries)
    if (id === RESOLVED_ROUTES_ID) return buildRoutesModule(entries)
  },
},

async closeBundle() {
  if (!options.ssg) return
  const source = new FileSystemSource(contentDir)
  const entries = await buildIndex(source, { locales: options.locales })
  await runPrerender(options.ssg, entries, outDir)
},
```

Also add `let outDir: string` and set it in `configResolved`:

```ts
configResolved(config) {
  contentDir = resolve(config.root, options.contentDir ?? 'content')
  outDir = config.build.outDir
},
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm test --filter folio -- plugin
```

Expected: PASS — all tests green including the new routes test

- [ ] **Step 7: Run full test suite**

```bash
pnpm test
```

Expected: all tests across all packages pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/ssg.ts packages/core/src/plugin.ts packages/core/src/virtual.ts
git commit -m "feat(core): add SSG integration via closeBundle hook and virtual:folio/routes"
```

---

## Task 16: Project skills for contributors

**Files:**

- Create: `.claude/skills/setup.md`
- Create: `.claude/skills/test.md`
- Create: `.claude/skills/dev.md`
- Create: `.claude/skills/new-adapter.md`
- Create: `.claude/skills/new-content.md`
- Create: `.claude/skills/add-fixture.md`

These skills ship with the repo. Any contributor using Claude Code gets them automatically via `/setup`, `/test`, `/dev`, etc.

- [ ] **Step 1: Create `.claude/skills/setup.md`**

```markdown
---
name: setup
description: First-time contributor setup for the folio monorepo
---

Run the following to set up the folio development environment:

1. Install dependencies: `pnpm install`
2. Install git hooks: `pnpm prepare` (runs `vp config`)
3. Build all packages: `pnpm build:packages`
4. Start the docs dev server: `pnpm dev`
5. Run all tests to verify: `pnpm test`

Expected: all tests green, dev server running at http://localhost:5173
```

- [ ] **Step 2: Create `.claude/skills/test.md`**

````markdown
---
name: test
description: Run tests for a specific folio package or all packages
---

To run all tests across all packages:

```bash
pnpm test
```
````

To run tests for a specific package:

```bash
pnpm test --filter folio          # packages/core
pnpm test --filter @folio/vue     # packages/vue
```

To run a specific test file:

```bash
pnpm test --filter folio -- scanner
pnpm test --filter folio -- plugin
```

All tests follow BDD style using "she" as the persona. Fixture MDX files live in `packages/core/tests/fixtures/content/`.

````

- [ ] **Step 3: Create `.claude/skills/dev.md`**

```markdown
---
name: dev
description: Start the folio docs dev server
---

Start the docs development server:

```bash
pnpm dev
````

This starts `apps/docs` at `http://localhost:5173`. The docs app dogfoods `folio` and `@folio/vue` from the workspace — any change to `packages/core` or `packages/vue` is immediately reflected.

Open `http://localhost:5173` in the browser to follow along visually.

````

- [ ] **Step 4: Create `.claude/skills/new-adapter.md`**

```markdown
---
name: new-adapter
description: Scaffold a new @folio/<framework> adapter package
---

To add a new framework adapter (e.g. `@folio/react`):

1. Copy `packages/vue/` to `packages/<framework>/`
2. Update `packages/<framework>/package.json`:
   - Set `"name": "@folio/<framework>"`
   - Replace `vue` peer dependency with the new framework
3. Update `packages/<framework>/src/composables.ts`:
   - Replace Vue's `ref`, `onMounted` with the framework equivalent
   - `useContent` and `useContentList` signatures stay identical
4. Replace `FolioContent.vue` with the framework's component equivalent
5. Update `packages/<framework>/src/index.ts` exports
6. Add the new package to `apps/docs/package.json` dependencies if needed

The core query API (`listContent`, `getContent`) is framework-agnostic — adapters only wrap it with reactive state management.
````

- [ ] **Step 5: Create `.claude/skills/new-content.md`**

````markdown
---
name: new-content
description: Scaffold a new MDX content file for the folio docs
---

Create a new file in `apps/docs/content/` with this frontmatter structure:

```mdx
---
title: Your Page Title
date: 2026-06-05
---

# Your Page Title

Content goes here.
```
````

Path conventions:

- `apps/docs/content/docs/my-page.mdx` → accessible at `/docs/my-page`
- `apps/docs/content/index.md` → accessible at `/`
- Frontmatter `path: /custom` overrides the filesystem path

The `title` field appears in the navigation built by `useContentList('/')`.

````

- [ ] **Step 6: Create `.claude/skills/add-fixture.md`**

```markdown
---
name: add-fixture
description: Add a test fixture MDX file for BDD tests in packages/core
---

Fixture MDX files live in `packages/core/tests/fixtures/content/`.

Structure mirrors the path resolution rules:

- `en/blog/my-post.mdx` → path `/blog/my-post`, locale `en`
- `da/blog/my-post.mdx` → path `/blog/my-post`, locale `da`
- `en/index.mdx` → path `/`, locale `en`

Every fixture file should have frontmatter:

```mdx
---
title: Fixture Title
date: 2024-01-15
draft: false
---

# Fixture Title

Fixture content for testing.
````

After adding a fixture, update the scanner test that asserts `index.length === 4` to the new count.

````

- [ ] **Step 7: Commit**

```bash
git add .claude/
git commit -m "chore: add project skills for contributors"
````

---

## Self-Review Checklist

- [x] **Spec coverage:** Monorepo ✓, Vite+ toolchain ✓, ContentSource interface ✓, Rolldown filter hooks ✓, virtual index ✓, query API ✓, path resolution ✓, locale support (in scanner) ✓, BDD tests with "she" ✓, Vue adapter ✓, FolioContent ✓, SSG ✓, TypeScript strict ✓
- [x] **Placeholder scan:** No TBD/TODO found. All steps have real code.
- [x] **Type consistency:** `IndexEntry` defined in scanner.ts and used consistently across virtual.ts, query.ts, plugin.ts, ssg.ts. `ContentEntry` from types.ts used in composables and FolioContent. `FolioOptions` used with `satisfies` in plugin.ts.
- [x] **Gap found:** `virtual:folio/routes` resolveId was declared in plugin.ts but load handler was incomplete — fixed in Task 15 with the full load handler covering both virtual IDs.

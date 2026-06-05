# Folio — Design Spec

**Date:** 2026-06-05  
**Status:** Approved  
**Author:** Nicklas Degnebolig

---

## Overview

**Folio** is a Vite-native MDX content layer — similar to Nuxt Content but framework-agnostic and usable in any Vite project. It lets developers build full static sites from a folder of MDX files, with a clean query API, first-class TypeScript support, and framework-specific adapters for Vue, React, and Svelte.

The `apps/docs` project (folio's own docs site) serves as both the documentation and the live proof-of-concept — folio dogfoods itself.

---

## Implementation Approach

**Test first, always.** Write the failing test before writing any implementation code. Never write implementation to pass a test that doesn't exist yet.

**Small wins, visible progress.** Each milestone ends with more green tests than before and something visible in the browser. The first milestone is the smallest possible thing that counts as working: a single MDX file rendered to the page.

**Milestone order:**

1. Monorepo scaffold + toolchain (Vite+, tsdown, Vitest, pnpm workspaces)
2. **First green: render one `.md` file to the page** — the simplest possible end-to-end
3. MDX support (components in content)
4. Content index + `listContent` / `getContent`
5. Path resolution + locale support
6. `@folio/vue` adapter (composables + `<FolioContent>`)
7. SSG integration

**Dev server always running during implementation.** Use the Playwright MCP and Chrome DevTools MCP to follow along visually in the browser as each milestone completes. Every meaningful change gets verified in the browser, not just in tests.

**Red → Green → Refactor.** No skipping steps. If a test is hard to write, that's a signal the design needs adjustment — not a reason to skip the test.

---

## Monorepo Structure

```text
/
  packages/
    core/           → npm: folio
    vue/            → npm: @folio/vue
  apps/
    docs/           → folio docs app (dogfoods both packages)
      content/      → MDX files that ARE the documentation
      src/          → Vue app that renders them
  package.json      → pnpm workspace root
  vite.config.ts    → Vite+ unified config (lint, fmt, staged, git hooks)
  tsdown.config.ts  → root tsdown config for all library packages
```

### Package names

| Package         | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| `folio`         | Core Vite plugin + plain JS query API. Zero framework dependency. |
| `@folio/vue`    | Vue composables + `<FolioContent>` component                      |
| `@folio/react`  | (future) React hooks adapter                                      |
| `@folio/svelte` | (future) Svelte store adapter                                     |

---

## Architecture Decision: Virtual Index + Lazy MDX Imports

The plugin exposes a **small virtual index** containing only frontmatter and metadata for all content files. Individual MDX files are loaded as **dynamic imports on demand** — MDX compilation only happens for files that are actually rendered.

This means:

- List pages read the index (fast, no MDX compilation)
- Detail pages load one MDX file lazily
- HMR works file-by-file via Vite's module graph
- Incremental builds are a natural extension — only changed files need recompilation

---

## Core Plugin (`folio`)

### Plugin API — Vite 8 + Rolldown

The plugin uses the Rolldown filter-based hook syntax. Filters are evaluated in Rust before the JS handler is called — zero overhead for non-matching files.

```ts
import { exactRegex } from '@rolldown/pluginutils'
import { defineConfig } from 'vite'

export default function folio(options: FolioOptions = {}) {
  const indexId = 'virtual:folio/index'
  const queryId = 'virtual:folio/query'
  const routesId = 'virtual:folio/routes'

  const resolvedIndexId = '\0' + indexId
  const resolvedQueryId = '\0' + queryId
  const resolvedRoutesId = '\0' + routesId

  return {
    name: 'folio',

    // Transform .mdx files → JS modules via @mdx-js/mdx
    transform: {
      filter: { id: /\.mdx$/ },
      handler(code, id) {
        return transformMdx(code, id, options)
      },
    },

    // Virtual module: content index (frontmatter only)
    resolveId: {
      filter: { id: /^virtual:folio\// },
      handler(id) {
        if (id === indexId) return resolvedIndexId
        if (id === queryId) return resolvedQueryId
        if (id === routesId) return resolvedRoutesId
      },
    },

    load: {
      filter: { id: /^\0virtual:folio\// },
      handler(id) {
        if (id === resolvedIndexId) return buildIndexModule(source)
        if (id === resolvedQueryId) return buildQueryModule()
        if (id === resolvedRoutesId) return buildRoutesModule(source)
      },
    },

    // SSG: write static HTML after Rolldown finishes bundling
    async closeBundle() {
      if (!options.ssg) return
      await runPrerender(options.ssg, source)
    },
  }
}
```

### ContentSource Interface — The CMS Hook

Every file access goes through this interface. **Never call `fs` directly** anywhere in the core. This is the single architectural decision that keeps the future CMS door open.

```ts
interface ContentSource {
  listFiles(prefix?: string): Promise<ContentFile[]>
  readFile(path: string): Promise<string>
  watch?(onChange: (file: ContentFile) => void): () => void
}

interface ContentFile {
  filePath: string // absolute path on disk (or remote URL)
  contentPath: string // resolved content path (e.g. /blog/my-post)
  locale?: string // derived from directory structure
}
```

V1 ships `FileSystemSource` as the default. A future `RemoteSource` swaps in transparently — the rest of the plugin is unchanged.

### Internal Module Structure

```text
packages/core/src/
  plugin.ts          ← Vite plugin entry point
  scanner.ts         ← walks ContentSource, builds the index
  transformer.ts     ← runs @mdx-js/mdx on individual files
  virtual.ts         ← builds virtual module JS strings
  ssg.ts             ← prerender logic (closeBundle)
  sources/
    filesystem.ts    ← FileSystemSource (default)
  types.ts           ← shared TypeScript types
```

---

## Path Resolution

Rules applied in this order:

1. **Frontmatter override:** if `frontmatter.path` is set, it wins
2. **Locale stripping:** if the top-level directory matches a BCP 47 locale code (e.g. `en`, `da`, `fr`, `en-US`), it is stripped from the path and recorded as `locale`. Detection uses a configurable `locales` option — defaults to an empty list, meaning no locale detection unless explicitly enabled. This prevents a directory named `blog` from being misidentified as a locale.
3. **Filesystem path:** remaining path segments become the content path
4. **Index files:** `index.mdx` resolves to its parent directory path

Examples:

| File                                                        | Resolved path   | Locale |
| ----------------------------------------------------------- | --------------- | ------ |
| `content/blog/my-post.mdx`                                  | `/blog/my-post` | —      |
| `content/en/blog/my-post.mdx`                               | `/blog/my-post` | `en`   |
| `content/da/index.mdx`                                      | `/`             | `da`   |
| `content/docs/intro.mdx` + frontmatter `path: /get-started` | `/get-started`  | —      |

---

## Virtual Modules

```ts
// virtual:folio/index — lightweight, just metadata
import { index } from 'virtual:folio/index'
// → ContentEntry[]

// virtual:folio/query — query functions
import { getContent, listContent } from 'virtual:folio/query'

// virtual:folio/routes — all content paths (for SSG)
import { routes } from 'virtual:folio/routes'
// → string[]

// Individual MDX files — loaded on demand via dynamic import
const mod = await import('folio:content/blog/my-post.mdx')
// → { default: Component, frontmatter: { title, date, ... } }
```

---

## Query API (v1)

Plain JavaScript, no framework dependency, fully async.

```ts
interface ContentEntry {
  path: string
  locale?: string
  frontmatter: {
    title?: string
    date?: string
    draft?: boolean
    path?: string // frontmatter path override
    [key: string]: any
  }
  body: () => Promise<Component> // lazy — only compiles MDX when called
}
```

```ts
// Get a single entry by path
const post = await getContent('/blog/my-post')
const Component = await post.body()

// List all entries under a path prefix
const posts = await listContent('/blog')

// Locale filtering
const danishPosts = await listContent('/blog', { locale: 'da' })
```

`body()` is intentionally lazy. `listContent` never compiles MDX — it only reads from the index. This means list pages are fast even with hundreds of content files.

### Designed for the future query builder

`listContent` filters the index internally. When v2 adds `.where()`, `.sort()`, `.limit()`, it's a richer filter on the same index — no structural changes to data shape or storage.

```ts
// v2 preview (not in scope for v1)
const posts = await queryContent('/blog')
  .where({ draft: false })
  .sort({ date: -1 })
  .limit(10)
  .find()
```

---

## Testing Strategy

Hybrid: fast unit tests for all pure logic, integration tests for the Vite plugin layer.

```text
packages/core/tests/
  unit/
    scanner.test.ts        ← path resolution, locale detection, frontmatter parsing
    query.test.ts          ← listContent, getContent, filtering
    transformer.test.ts    ← MDX → JS compilation
  integration/
    plugin.test.ts         ← full Vite plugin, virtual modules, MDX transform
  fixtures/
    content/               ← real .mdx files shared across all tests
      en/
        blog/
          my-post.mdx
          draft-post.mdx
        index.mdx
      da/
        blog/
          my-post.mdx
```

### BDD style — person-driven, 3rd person scenarios

Tests use "she" consistently so scenarios feel concrete and human, not abstract. Never describe what a function does internally — describe what she experiences.

```ts
// unit/scanner.test.ts
describe('when she places a post in a locale directory', () => {
  it('strips the locale prefix from the path she queries', async () => { ... })
  it('tags the entry so she can filter by locale', async () => { ... })
})

// unit/query.test.ts
describe('when she calls listContent with a locale filter', () => {
  it('she only receives posts in her chosen language', async () => { ... })
  it('she gets an empty array when no posts match that locale', async () => { ... })
})

describe('when she marks a post as draft', () => {
  it('it still appears in listContent so she can preview it', async () => { ... })
})

// integration/plugin.test.ts
describe('when she installs folio in her Vite project', () => {
  it('she can import the content index as a virtual module', async () => { ... })
  it('her MDX file compiles to a renderable Vue component', async () => { ... })
  it('the index updates automatically when she edits a file', async () => { ... })
})
```

---

## Vue Adapter (`@folio/vue`)

### Composables

```ts
// @folio/vue
export function useContent(path: string) {
  const entry = ref<ContentEntry | null>(null)
  const loading = ref(true)
  const error = ref<Error | null>(null)

  onMounted(async () => {
    try {
      entry.value = await getContent(path)
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { entry, loading, error }
}

export function useContentList(prefix: string, options?: ListOptions) {
  const entries = ref<ContentEntry[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)
  // same pattern
  return { entries, loading, error }
}
```

### `<FolioContent>` Component

Handles the full MDX render lifecycle — lazy loading, loading state, error state, component injection.

```vue
<!-- Basic usage -->
<FolioContent :entry="entry" />

<!-- With slots -->
<FolioContent :entry="entry">
  <template #loading>Loading...</template>
  <template #error="{ error }">Failed: {{ error.message }}</template>
</FolioContent>

<!-- Inject your Vue components into MDX -->
<FolioContent :entry="entry" :components="{ Button, Card, Callout }" />
```

The `:components` prop maps component names to Vue components. Any component in the map is available inside the `.mdx` file without importing.

---

## SSG Integration

Folio hooks into Rolldown's `closeBundle` — runs automatically as part of `vite build`, after all assets are written.

```ts
// vite.config.ts
import folio from 'folio'
import { renderToString } from '@vue/server-renderer'

export default defineConfig({
  plugins: [
    folio({
      ssg: {
        render: async (path) => {
          const { html } = await serverEntry.render(path)
          return html
        },
      },
    }),
  ],
})
```

`vite build` → Rolldown bundles → `closeBundle` fires → folio iterates all routes from `virtual:folio/routes` → writes `dist/<path>/index.html` for each.

folio owns: route discovery, file writing, HTML injection into the base template.  
You own: rendering HTML for each route (framework-specific, deliberately kept outside folio).

---

## Future CMS Path

Not in scope for v1. The `ContentSource` interface is the only architectural commitment needed now.

Three constraints to honour in every v1 decision:

1. **Never call `fs` directly** — always go through `ContentSource`
2. **Content index entries must be plain JSON-safe objects** — no file handles, no Node.js-specific types
3. **The query API must stay identical when the source changes** — `listContent('/blog')` works the same whether content comes from disk or a remote CMS

When the CMS layer arrives, it swaps in a `RemoteSource` implementation. Everything above it is unchanged.

---

## Toolchain (Vite+ native)

```ts
// vite.config.ts (monorepo root)
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

```ts
// tsdown.config.ts (monorepo root)
import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: 'packages/*',
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
})
```

```json
// package.json (root)
{
  "scripts": {
    "prepare": "vp config"
  }
}
```

Git hooks install automatically on `pnpm install` via `vp config`. No husky, no separate lint config files, no prettier config.

| Tool              | Role                                                          |
| ----------------- | ------------------------------------------------------------- |
| `vite-plus`       | Unified config — oxlint, oxfmt, staged checks, git hooks      |
| `tsdown`          | Builds `packages/core` + `packages/vue` (ESM + CJS + `.d.ts`) |
| `vitest`          | Testing (part of Vite+)                                       |
| `pnpm workspaces` | Monorepo package management                                   |

---

## TypeScript Strategy

Folio is a library — TypeScript decisions here affect every consumer, not just this codebase.

### Core rules

**1. Annotate public API return types explicitly, infer internally.**

Public functions are contracts. Annotating them prevents accidental signature drift and documents intent clearly. Internal functions can rely on inference.

```ts
// Public — always annotate
export function listContent(
  prefix: string,
  options?: ListOptions,
): Promise<ContentEntry[]>

// Internal — let TS infer
function buildIndex(source: ContentSource) {
  return source.listFiles().then((files) => files.map(parseEntry))
}
```

**2. `unknown` over `any`, always.**

`any` disables type checking. `unknown` forces the caller to narrow before using a value — which is exactly what we want at API boundaries.

```ts
// Bad
frontmatter: Record<string, any>

// Good
frontmatter: Record<string, unknown>
```

**3. Unions over enums.**

Enums generate runtime JS and can't be tree-shaken. Unions are zero-cost at runtime and infer better.

```ts
// Good
export type ContentFormat = 'mdx' | 'md'

// Avoid
export enum ContentFormat {
  MDX = 'mdx',
  MD = 'md',
}
```

**4. `as const` + derived types for stable literals.**

```ts
export const SUPPORTED_FORMATS = ['mdx', 'md'] as const
export type ContentFormat = (typeof SUPPORTED_FORMATS)[number]
// → 'mdx' | 'md' — stays in sync, never drifts
```

**5. `satisfies` for plugin config objects.**

Validates shape without widening literals — consumers get full autocomplete and exact types.

```ts
const defaultOptions = {
  contentDir: 'content',
  locales: [],
} satisfies FolioOptions
```

**6. Use Vite's `Plugin` type for the plugin return.**

Keeps folio compatible with the rest of the Vite ecosystem and makes the return type self-documenting.

```ts
import type { Plugin } from 'vite'

export function folio(options?: FolioOptions): Plugin {
  return { name: 'folio', ... }
}
```

**7. One intentional generic: typed frontmatter.**

`ContentEntry` accepts an optional frontmatter shape. This is useful — consumers can type their own frontmatter without losing flexibility.

```ts
export interface ContentEntry<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  path: string
  locale?: string
  frontmatter: T
  body: () => Promise<Component>
}

// Consumer usage
interface BlogFrontmatter {
  title: string
  date: string
  draft?: boolean
}
const post = await getContent<BlogFrontmatter>('/blog/my-post')
post.frontmatter.title // typed
```

**8. Export types cleanly — critical for tsdown.**

```ts
// types.ts
export type { ContentEntry, ContentSource, FolioOptions, ListOptions }

// index.ts
export { folio } from './plugin'
export type { ContentEntry, FolioOptions } from './types'
```

Never `export * from` — it leaks internal types and makes the public API surface unpredictable.

### tsconfig

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true
  }
}
```

`exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` catch real bugs that `strict` alone misses.

---
name: new-adapter
description: Scaffold a new @folio/<framework> adapter following the established pattern
---

Use this when adding support for a new framework (React, Svelte, Solid, etc.).

## Steps

### 1. Create the package

```sh
mkdir packages/<framework>
cd packages/<framework>
```

Create `package.json`:
```json
{
  "name": "@folio/<framework>",
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "folio": "workspace:*",
    "<framework>": "^<version>"
  },
  "devDependencies": {
    "folio": "workspace:*",
    "<framework>": "^<version>"
  }
}
```

### 2. Create the composables

Model after `packages/vue/src/composables.ts`. The only framework-specific part is the reactivity primitives:

- **Vue**: `ref`, `onMounted` from `vue`
- **React**: `useState`, `useEffect` from `react`
- **Svelte**: `writable` from `svelte/store`, lifecycle from `svelte`

The virtual module import is always the same:
```ts
import { listContent, getContent } from 'virtual:folio/query'
```

### 3. Create the content renderer component

Model after `packages/vue/src/FolioContent.vue`. It should:
- Accept an `entry: ContentEntry | null` prop
- Accept a `components?: Record<string, unknown>` prop
- Call `entry.body()` in a lifecycle hook to get the component
- Pass `components` through to the rendered body

### 4. Add tsdown config

Create `packages/<framework>/tsdown.config.ts`:
```ts
import { defineConfig } from 'tsdown'
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['<framework>'],
})
```

The `external: ['<framework>']` prevents framework types from being bundled into the `.d.ts` output.

### 5. Add to workspace scripts

In the root `package.json`, add:
```json
"test:<framework>": "pnpm --filter @folio/<framework> test"
```

And add it to `"test"`: `"pnpm test:core && pnpm test:vue && pnpm test:<framework>"`.

### 6. Add `jsxImportSource` note

The `folio` plugin's `jsxImportSource` option is the only coupling to a framework. Document the correct value:
- Vue → `'vue'`
- React → `'react'`
- Solid → `'solid-js'`
- Preact → `'preact'`

### Key constraint

Never hardcode a framework import in `packages/core`. The core package must remain framework-agnostic. All framework-specific code lives in adapter packages.

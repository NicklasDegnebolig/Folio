# folio

A Vite-native MDX content layer. Drop `.md` and `.mdx` files into your project and import them as components — no build step, no codegen, just Vite.

---

## Packages

| Package | npm | Description |
| --- | --- | --- |
| [`folio`](packages/core) | `folio` | Vite plugin + query API. Framework-agnostic core. |
| [`@nicklasdegnebolig/folio-vue`](packages/vue) | `@nicklasdegnebolig/folio-vue` | Reactive Vue composables and a `<FolioContent>` component. |

### `folio` — core

The Vite plugin that transforms `.md` and `.mdx` files into components for any framework. It exposes three virtual modules you can import from anywhere in your app:

- `virtual:folio/index` — the full content index (paths + frontmatter)
- `virtual:folio/query` — `listContent()` and `getContent()` functions
- `virtual:folio/routes` — flat path list for SSG

The only framework coupling is the `jsxImportSource` option — swap it for any JSX runtime.

```ts
import { folio } from 'folio'

export default {
  plugins: [
    folio({
      contentDir: 'content',  // where your .md/.mdx files live (default: 'content')
      jsxImportSource: 'vue', // jsx runtime: 'react', 'solid-js', etc.
    }),
  ],
}
```

### `@nicklasdegnebolig/folio-vue`

Reactive composables and a render component built on top of `folio`:

- `useContentList(prefix)` — reactive list of entries under a path prefix
- `useContent(path)` — reactive single entry by path
- `<FolioContent>` — renders an entry's MDX body; supports `loading` / `error` slots and a `components` prop for custom MDX components

```vue
<script setup>
import { ref } from 'vue'
import { useContentList, FolioContent } from '@folio/vue'

const { entries, loading } = useContentList('/docs')
const active = ref(null)
</script>

<template>
  <ul>
    <li v-for="e in entries" :key="e.path" @click="active = e">
      {{ e.frontmatter.title }}
    </li>
  </ul>
  <FolioContent v-if="active" :entry="active" />
</template>
```

---

## Installation

```sh
# core plugin (required)
pnpm add @nicklasdegnebolig/folio

# Vue adapter
pnpm add @nicklasdegnebolig/folio-vue
```

### Custom MDX components

Pass a `components` map to `<FolioContent>` and use those components directly inside any `.mdx` file:

```vue
<FolioContent :entry="entry" :components="{ Button, InfoBox }" />
```

```mdx
<Button variant="primary">Get started</Button>
<InfoBox type="tip">No extra setup required.</InfoBox>
```

---

## Scripts

Run everything from the **monorepo root**.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the docs site at `http://localhost:5173` |
| `pnpm test` | Run all tests across all packages |
| `pnpm test:core` | Run `packages/core` tests only |
| `pnpm test:vue` | Run `packages/vue` tests only |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all files (oxlint via vite+) |
| `pnpm fmt` | Format all files (oxfmt via vite+) |
| `pnpm fmt:check` | Check formatting without writing (CI) |
| `pnpm build:packages` | Build all packages to `dist/` |
| `pnpm clean` | Delete all `dist/` directories |

---

## Contributing

1. **Node 24** — `nvm use` picks up `.nvmrc`
2. `pnpm install`
3. Write a failing test first — `pnpm test:watch`
4. Implement until green
5. `pnpm typecheck` — make sure types are clean
6. `git commit` — the pre-commit hook formats and lints automatically

All tests are BDD-style with [Vitest](https://vitest.dev) and use real fixture `.mdx` files — no mocked strings.

Code style is enforced by **oxlint** (linting) and **oxfmt** (formatting) via [vite+](https://vite-plus.dev). No ESLint, no Prettier.

---

## License

MIT

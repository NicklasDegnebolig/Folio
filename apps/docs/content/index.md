---
title: Welcome to Folio
---

# Welcome to Folio

A Vite-native MDX content layer. Drop `.md` and `.mdx` files in your `content/` directory and import them as components — no build step, no codegen, just Vite.

This page is itself a `.md` file rendered by the **folio** Vite plugin.

## Getting started

```sh
nvm use          # switch to Node 24 (reads .nvmrc)
pnpm install
pnpm dev         # http://localhost:5173
```

> Run `nvm use` once per terminal session. After that all `pnpm` commands work as-is.

## Scripts

### Development

| Script                | What it does                          |
| --------------------- | ------------------------------------- |
| `pnpm dev`            | Start this docs site at `:5173`       |
| `pnpm build:packages` | Build all packages to `dist/`         |

### Testing

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `pnpm test`       | Run all tests once                             |
| `pnpm test:core`  | Run `packages/core` tests only                 |
| `pnpm test:watch` | Watch mode — re-runs on save                   |

### Code quality

| Script            | What it does                          |
| ----------------- | ------------------------------------- |
| `pnpm typecheck`  | Type-check all packages               |
| `pnpm lint`       | Lint all files                        |
| `pnpm fmt`        | Format all files (auto-fix)           |
| `pnpm fmt:check`  | Check formatting (CI)                 |
| `pnpm clean`      | Delete all `dist/` directories        |

## How it works

You write this:

```md
# Hello world

This is **markdown**.
```

Folio compiles it to a Vue component at request time via `@mdx-js/mdx` — no intermediate files, no watchers, just Vite's transform pipeline.

```ts
// vite.config.ts
import { folio } from 'folio'

export default defineConfig({
  plugins: [vue(), folio({ jsxImportSource: 'vue' })],
})
```

Then import anywhere in your app:

```vue
<script setup>
import Welcome from '../content/index.md'
</script>

<template>
  <Welcome />
</template>
```

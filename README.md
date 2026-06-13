# folio

A Vite-native MDX content layer — framework-agnostic, works in any Vite project. Think Nuxt Content but without the Nuxt.

The `apps/docs` site is both the documentation and the live proof-of-concept. It dogfoods `folio` itself.

---

## Monorepo structure

```text
packages/
  core/       → npm: folio           Vite plugin + plain JS query API
  vue/        → npm: @folio/vue      Reactive Vue composables
apps/
  docs/       → folio docs site      Dogfoods folio, serves as live proof-of-concept
```

---

## Getting started

You only need to do this once per terminal session (or when you open the project for the day):

```sh
nvm use          # picks up .nvmrc → Node 24
pnpm install     # install all workspace deps
pnpm dev         # start the docs dev server at http://localhost:5173
```

That's it. The docs site imports `.md` and `.mdx` files directly as components — no build step, no codegen, just Vite. The docs happen to use Vue, but `folio` itself works with any framework.

---

## All scripts

Run everything from the **monorepo root**.

### Development

| Script                | What it does                                         |
| --------------------- | ---------------------------------------------------- |
| `pnpm dev`            | Start the docs dev server at `http://localhost:5173` |
| `pnpm build:packages` | Build all packages to `dist/` (ESM + CJS + `.d.ts`)  |

### Testing

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `pnpm test`       | Run all tests once across all packages         |
| `pnpm test:core`  | Run only `packages/core` tests                 |
| `pnpm test:vue`   | Run only `packages/vue` tests                  |
| `pnpm test:watch` | Run tests in watch mode (re-runs on file save) |

Tests live in `packages/<name>/tests/`. All tests are BDD-style with Vitest and use real fixture `.mdx` files — no mocked strings.

### Type checking

| Script                | What it does                    |
| --------------------- | ------------------------------- |
| `pnpm typecheck`      | Type-check all packages at once |
| `pnpm typecheck:core` | Type-check `packages/core` only |

TypeScript is configured with `strict: true`, `exactOptionalPropertyTypes: true`, and `noUncheckedIndexedAccess: true`.

### Code quality

| Script           | What it does                                         |
| ---------------- | ---------------------------------------------------- |
| `pnpm lint`      | Lint all files                                       |
| `pnpm fmt`       | Format all files (auto-fix)                          |
| `pnpm fmt:check` | Check formatting without changing files (used in CI) |

### Housekeeping

| Script       | What it does                                       |
| ------------ | -------------------------------------------------- |
| `pnpm clean` | Delete all `dist/` directories across the monorepo |

### Per-package scripts (run from inside `packages/core`)

```sh
pnpm build        # tsdown — outputs dist/index.mjs, dist/index.cjs, dist/index.d.mts
pnpm test         # vitest run
pnpm test:watch   # vitest watch
pnpm typecheck    # tsc --noEmit
```

---

## How vite+ works

[vite-plus](https://vite-plus.dev) (`vp`) is the DX toolchain for this project. It wraps Prettier, ESLint, and lint-staged into a single coherent setup.

### Commands

```sh
vp lint          # run ESLint across the project
vp fmt           # format with Prettier (auto-fix)
vp fmt --check   # check formatting without fixing (exits 1 if issues found)
vp config        # write the lint-staged + pre-commit hook config (run automatically on pnpm install via "prepare")
```

### Pre-commit hook

When you `git commit`, lint-staged runs automatically on staged files:

1. **`vp check --fix`** — lints and formats staged `.js`, `.ts`, `.vue`, `.mdx` files
2. If any file changes after the fix, the changes are re-staged

This means you never commit unformatted or unlinted code. If the hook fails, fix the issue and commit again — do **not** skip it with `--no-verify`.

### Config

vite-plus reads config from the root. Running `pnpm prepare` (or `vp config`) regenerates it. You don't normally need to touch this directly.

---

## Architecture

### How a `.md` file becomes a component

The `jsxImportSource` option is the only framework coupling. Swap it to target any framework.

```text
content/index.md
        │
        ▼
[folio Vite plugin]  ← transform hook fires on every .md/.mdx import
        │
        ▼
[@mdx-js/mdx compile()]  ← MDX → JSX (framework-agnostic)
        │
        ▼
<jsxImportSource>/jsx-runtime  ← e.g. vue, react, solid-js, preact
        │
        ▼
framework component  ← drop into any template, JSX tree, or render function
```

### Key design decisions

**Virtual modules** — folio will expose `virtual:folio/index` as a route map so you can list/query content at runtime without knowing file paths upfront.

**ContentSource interface** — all file access goes through this interface, never raw `fs` calls. This is the door for a future CMS layer (remote MDX, no local files needed).

**Filesystem mirrors routes** — `content/blog/hello.md` becomes path `/blog/hello`. Frontmatter `path:` overrides the default. Locale-prefixed directories (`content/en/`, `content/da/`) are supported via the `locales` option.

**jsxImportSource is pluggable** — pass `jsxImportSource: 'react'` or `'solid-js'` and the compiled MDX will import from that runtime instead. No framework lock-in at the plugin level.

### Plugin options

```ts
import { folio } from 'folio'

folio({
  contentDir: 'content', // where your .md/.mdx files live (default: 'content')
  jsxImportSource: 'vue', // JSX runtime (default: 'vue')
  locales: ['en', 'da'], // locale-prefixed directories to recognise
})
```

---

## Testing guide

Tests are in `packages/core/tests/` split into two directories:

```text
tests/
  unit/         → pure function tests (scanner, transformer)
  integration/  → real Vite dev server spun up per test
fixtures/
  basic.mdx       → plain markdown fixture
  frontmatter.mdx → fixture with YAML frontmatter
```

### Run the full suite

```sh
pnpm test
```

### Run a single file

```sh
pnpm test:core
# or from inside packages/core:
pnpm vitest run tests/unit/transformer.test.ts
```

### Watch mode while developing

```sh
pnpm test:watch
```

Vitest re-runs affected tests on every file save. This is the recommended mode when writing new features or fixing bugs — write the test first, watch it go red, then implement until it goes green.

### Integration tests

Integration tests in `tests/integration/plugin.test.ts` spin up a real Vite dev server using `createServer()`. The server is started once per test file and torn down after. If you add a new test that needs a running server, reuse the shared `server` instance — don't create a new one per test.

---

## Contributing

1. `nvm use` — switch to the right Node version
2. `pnpm install` — install deps
3. Write a failing test first (`pnpm test:watch`)
4. Implement until green
5. `pnpm typecheck:core` — make sure types are clean
6. `git commit` — the pre-commit hook formats and lints for you

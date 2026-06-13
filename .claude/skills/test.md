---
name: test
description: Run tests for a specific package or all packages with the right Vitest config
---

## Run all tests

```sh
pnpm test
```

Runs `packages/core` then `packages/vue` sequentially. Each package gets its own Vite context so virtual module aliases resolve correctly.

## Run one package

```sh
pnpm test:core   # packages/core only
pnpm test:vue    # packages/vue only
```

## Watch mode (while developing)

```sh
pnpm test:watch
```

Uses `vitest.workspace.ts` to watch both packages. Re-runs affected tests on every file save.

## Run a single test file

From inside a package directory:
```sh
cd packages/core
pnpm vitest run tests/unit/scanner.test.ts
```

## Test structure

```
packages/core/tests/
  unit/         → pure function tests (scanner, transformer, query, ssg)
  integration/  → real Vite dev server via createServer()
  fixtures/     → real .mdx files used by tests (no mocked strings)

packages/vue/tests/
  unit/         → composable tests with jsdom + @vue/test-utils
  integration/  → FolioContent rendering tests
  __mocks__/    → virtual:folio/query stub for test isolation
```

## Key patterns

- All tests use BDD-style descriptions ("she …")
- Integration tests spin up a real Vite dev server — they test the full plugin pipeline
- Vue tests use `// @vitest-environment jsdom` annotation per file
- `flushPromises()` from `@vue/test-utils` is required after mounting async composables
- `vi.mock('virtual:folio/query', factory)` factory must be self-contained (no outer-scope `const` refs) because the mock is hoisted

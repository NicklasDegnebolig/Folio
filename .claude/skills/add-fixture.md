---
name: add-fixture
description: Add a test fixture MDX file with the correct shape for BDD tests
---

Test fixtures live in `packages/core/tests/fixtures/content/`. They are real `.mdx` files — never mocked strings.

## Fixture structure

```
packages/core/tests/fixtures/
  content/
    en/
      blog/
        my-post.mdx      ← locale-prefixed example
      index.mdx
    index.mdx            ← root (no locale)
```

## Minimal fixture

```mdx
---
title: My Fixture
date: 2024-01-15
---

# My Fixture

This is fixture content.
```

## Fixture with frontmatter

Any frontmatter keys are valid — the scanner preserves them as-is in `IndexEntry.frontmatter`. Use whatever shape your test needs:

```mdx
---
title: Rich Fixture
author: Jane
tags: [foo, bar]
published: true
---

Body content here.
```

## Rules

- Use real frontmatter YAML (no mocked objects)
- Keep content minimal — just enough to make the test assertion meaningful
- If testing locale handling, put the file under `content/<locale>/`
- File path in the fixture directory mirrors the route: `content/en/blog/hello.mdx` → path `/blog/hello`, locale `en`
- Never use absolute paths in fixture frontmatter

## After adding a fixture

Run `pnpm test:core` — the scanner picks up new files automatically. If a test relies on a specific file path, reference it via `join(import.meta.dirname, '../fixtures/content/...')`.

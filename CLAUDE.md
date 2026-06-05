# Folio — Project Instructions for Claude

## What This Project Is

This monorepo is the home of **folio**, a Vite-native MDX content layer — similar to Nuxt Content but framework-agnostic and usable in any Vite project.

The `apps/docs` app (folio's own docs site) is both the documentation and the live proof-of-concept, dogfooding `folio` itself.

## Monorepo Structure

```
packages/
  core/     → npm: folio           (Vite plugin + plain JS query API)
  vue/      → npm: @folio/vue      (reactive Vue composables)
apps/
  docs/     → folio docs app        (docs site, dogfoods folio)
```

## Key Decisions

- **Architecture:** Virtual index module + dynamic MDX imports (Vite-native, enables incremental builds later)
- **Content source is abstracted** via a `ContentSource` interface — never hardcode `fs` calls; this enables a future CMS layer
- **SSG primary target** — but design with incremental/partial rebuilds in mind from day one
- **MDX via `@mdx-js/mdx`** with configurable JSX runtime per framework
- **Filesystem-mirrors-routes** as default path convention, frontmatter `path:` as override, locale-aware directory structure

## Working Style

- **Do not commit anything without being explicitly asked**
- **Always run a live dev server** when building or changing something visual — the user is visual and wants to follow along in the browser
- **Test-driven with Vitest + BDD** — all tests describe real user-facing behavior, not implementation internals. Use fixture `.mdx` files, not mocked strings
- **No premature abstractions** — build what's needed for v1, but design data structures to support the query builder later
- **Plan mode first** for any multi-step work — present a plan and get approval before touching code

## Project Skills (for contributors)

Project-based skills live in `.claude/skills/` and are committed to the repo. Any contributor using Claude Code gets these automatically.

| Skill         | Purpose                                                                       |
| ------------- | ----------------------------------------------------------------------------- |
| `setup`       | First-time contributor setup — pnpm install, vp config, verify dev server     |
| `test`        | Run tests for a specific package or all packages with the right Vitest config |
| `dev`         | Start the docs dev server and open the browser                                |
| `new-adapter` | Scaffold a new `@folio/<framework>` adapter following the established pattern |
| `new-content` | Scaffold a new MDX content file for the docs with proper frontmatter          |
| `add-fixture` | Add a test fixture MDX file with the correct shape for BDD tests              |

These skills are the open-source DX layer — consistent, project-aware workflows from day one for every contributor.

## Future Goals (not v1 — but design must not block these)

- Incremental/partial rebuilds (only rebuild changed/new files)
- Full query builder API (`.where()`, `.sort()`, `.limit()`)
- CMS layer on top (like Nuxt Studio) — remote MDX file storage with local dev sync
- Multi-language support via locale-prefixed directories
- `@folio/react`, `@folio/svelte` adapters

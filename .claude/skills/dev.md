---
name: dev
description: Start the docs dev server and open the browser
---

```sh
pnpm dev
```

Starts the folio docs site at http://localhost:5173.

The docs app dogfoods folio itself:
- Content lives in `apps/docs/content/` as `.md` and `.mdx` files
- The folio Vite plugin transforms them on-demand — no build step
- `@folio/vue` composables (`useContentList`, `useContent`, `FolioContent`) drive the UI
- `virtual:folio/query` is resolved at runtime by the plugin

**HMR works** — edit any `.md`, `.mdx`, `.vue`, or `.ts` file and the browser updates instantly.

## Passing custom components to MDX

In `apps/docs/src/App.vue`, the `components` map is passed to `<FolioContent>`:

```vue
<FolioContent :entry="active" :components="{ Button, Alert }" />
```

Any component in that map can be used by name inside `.mdx` files:

```mdx
<Button variant="primary">Click me</Button>
```

No import needed in the MDX file — the mapping is provided at the call site.

## Adding a new doc page

Drop a new `.mdx` file anywhere under `apps/docs/content/docs/` with frontmatter:

```yaml
---
title: My New Page
description: What this page covers
---
```

It appears in the sidebar automatically via `useContentList('/docs')`.

---
name: new-content
description: Scaffold a new MDX content file for the docs with proper frontmatter
---

Drop a new `.mdx` file in `apps/docs/content/docs/` with this frontmatter shape:

```mdx
---
title: Your Page Title
description: One sentence describing what this page covers
---

# Your Page Title

Content goes here. Standard markdown works as-is.

## Using components

Any component registered in `App.vue`'s `components` map can be used directly:

```mdx
<Button variant="primary" href="/next-page">Next</Button>
```

No import needed in the file.
```

## Path convention

The file path determines the content path:
- `content/docs/getting-started.mdx` → `/docs/getting-started`
- `content/blog/hello-world.mdx` → `/blog/hello-world`

Override with frontmatter `path:` if you need a different URL:
```yaml
---
title: Custom URL
path: /custom/path
---
```

## Locale support

If the project uses `locales: ['en', 'da']`, prefix the directory:
- `content/en/docs/getting-started.mdx` → path `/docs/getting-started`, locale `en`
- `content/da/docs/getting-started.mdx` → path `/docs/getting-started`, locale `da`

## After adding

The page appears in the sidebar automatically — no registration needed. `useContentList('/docs')` picks it up on the next request.

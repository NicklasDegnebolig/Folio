---
name: setup
description: First-time contributor setup — nvm, pnpm install, vp config, verify dev server
---

Run these steps once when you first clone the repo:

1. Switch to the correct Node version:
   ```sh
   nvm use
   ```
   This reads `.nvmrc` and switches to Node 24. You only need to do this once per terminal session.

2. Install all workspace dependencies:
   ```sh
   pnpm install
   ```
   This installs deps for all packages and runs `vp config` via the `prepare` script, which sets up the lint-staged pre-commit hook.

3. Verify the dev server starts:
   ```sh
   pnpm dev
   ```
   Open http://localhost:5173 — you should see the folio docs site. The page is itself an `.md` file rendered by the folio Vite plugin.

4. Verify all tests pass:
   ```sh
   pnpm test
   ```

You're ready. Normal workflow from here:
- `pnpm dev` — docs dev server
- `pnpm test:watch` — tests in watch mode while developing
- `git commit` — pre-commit hook auto-formats and lints staged files (requires Node 24, so keep `nvm use` active)

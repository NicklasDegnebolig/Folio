import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: 'packages/core',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
})

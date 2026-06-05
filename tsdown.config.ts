import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: 'packages/*',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
})

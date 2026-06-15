import { defineConfig } from 'tsdown'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  plugins: [vue()],
  external: ['vue', '@nicklasdegnebolig/folio', 'virtual:folio/query'],
})

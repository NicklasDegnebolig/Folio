import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      'virtual:folio/query': resolve(
        import.meta.dirname,
        'tests/__mocks__/virtual-folio-query.ts',
      ),
    },
  },
  test: {
    root: import.meta.dirname,
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
  },
})

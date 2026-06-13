import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { folio } from 'folio'

export default defineConfig({
  plugins: [vue(), folio({ jsxImportSource: 'vue' })],
  resolve: {
    conditions: ['source'],
  },
})

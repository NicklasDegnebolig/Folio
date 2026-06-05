import { defineConfig } from 'vite-plus'

export default defineConfig({
  lint: {
    plugins: ['typescript', 'unicorn'],
    options: { typeAware: true },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
    overrides: [
      {
        files: ['**/*.test.ts'],
        plugins: ['typescript', 'vitest'],
        rules: { 'vitest/no-disabled-tests': 'error' },
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: false,
    printWidth: 80,
  },
  staged: {
    '*.{js,ts,vue,mdx}': 'vp check --fix',
  },
})

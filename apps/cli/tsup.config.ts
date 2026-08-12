import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  bundle: true,
  outDir: 'dist',
  platform: 'node',
  target: 'node22',
  splitting: false,
  clean: true,
  noExternal: [/@nbenhadi\//],
  external: [
    'argon2',
    'pino',
    'pino-pretty',
    'playwright',
    'playwright-core',
    'chromium-bidi',
    'gray-matter',
    'pdfjs-dist',
    'pdfjs-dist/*',
    '@marp-team/marp-core',
  ],
})

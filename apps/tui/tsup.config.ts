import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  bundle: true,
  outDir: 'dist',
  platform: 'node',
  target: 'node22',
  splitting: false,
  clean: true,
  shims: true,
  noExternal: [/@nbenhadi\//],
  external: ['argon2', 'pino', 'pino-pretty', 'playwright', 'playwright-core'],
})

import { describe, it, expect } from 'vitest'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { edit } from './edit.js'

const ctx = buildContext()

describe('edit action', () => {
  it('creates the file with a template when it does not exist', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    try {
      const path = join(dir, 'new.md')
      const result = await edit({ action: 'edit', path, port: 0 }, ctx)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.created).toBe(true)
      expect(result.data.url).toMatch(/^http:\/\/localhost:\d+$/)
      const content = await readFile(path, 'utf-8')
      expect(content).toContain('# untitled')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('creates untitled.md inside the path when given an existing directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    try {
      const result = await edit({ action: 'edit', path: dir, port: 0 }, ctx)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.path).toBe(join(dir, 'untitled.md'))
      expect(result.data.created).toBe(true)
      const content = await readFile(result.data.path, 'utf-8')
      expect(content).toContain('# untitled')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('does not overwrite an existing file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    try {
      const path = join(dir, 'existing.md')
      await writeFile(path, '# already here\n', 'utf-8')
      const result = await edit({ action: 'edit', path, port: 0 }, ctx)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.created).toBe(false)
      const content = await readFile(path, 'utf-8')
      expect(content).toBe('# already here\n')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

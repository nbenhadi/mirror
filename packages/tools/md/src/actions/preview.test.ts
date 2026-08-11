import { describe, it, expect } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { preview } from './preview.js'

const ctx = buildContext()

describe('preview action', () => {
  it('returns NOT_FOUND for a missing source file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    try {
      const result = await preview(
        { action: 'preview', path: join(dir, 'missing.md'), port: 0 },
        ctx
      )
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { themeCreate } from './create.js'

const mockGetUserDataDir = vi.fn()
vi.mock('@nbenhadi/mirror-config', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getUserDataDir: () => mockGetUserDataDir(),
}))

const ctx = buildContext()
let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mirror-md-themes-'))
  mockGetUserDataDir.mockReturnValue(dir)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('themeCreate action', () => {
  it('creates a new theme and returns its id and css path', async () => {
    const result = await themeCreate(
      { action: 'theme.create', name: 'sidebar', kind: 'document' },
      ctx
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('sidebar')
      expect(result.data.cssPath).toMatch(/sidebar[/\\]theme\.css$/)
    }
  })

  it('fails with EXECUTION_ERROR when the theme already exists', async () => {
    await themeCreate({ action: 'theme.create', name: 'sidebar', kind: 'document' }, ctx)
    const result = await themeCreate(
      { action: 'theme.create', name: 'sidebar', kind: 'document' },
      ctx
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('EXECUTION_ERROR')
  })
})

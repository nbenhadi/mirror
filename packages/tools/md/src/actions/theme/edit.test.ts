import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { themeCreate } from './create.js'
import { themeEdit } from './edit.js'

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

describe('themeEdit action', () => {
  it('returns the css path of an existing user theme', async () => {
    await themeCreate({ action: 'theme.create', name: 'sidebar', kind: 'document' }, ctx)
    const result = await themeEdit({ action: 'theme.edit', name: 'sidebar', kind: 'document' }, ctx)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cssPath).toMatch(/sidebar[/\\]theme\.css$/)
  })

  it('fails for a theme that does not exist', async () => {
    const result = await themeEdit(
      { action: 'theme.edit', name: 'does-not-exist', kind: 'document' },
      ctx
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('fails for a bundled theme (no css file on disk)', async () => {
    const result = await themeEdit({ action: 'theme.edit', name: 'default', kind: 'document' }, ctx)
    expect(result.success).toBe(false)
  })
})

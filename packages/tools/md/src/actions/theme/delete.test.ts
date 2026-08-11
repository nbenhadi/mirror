import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { themeCreate } from './create.js'
import { themeDelete } from './delete.js'
import { listThemes } from '../../engine/themes.js'

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

describe('themeDelete action', () => {
  it('deletes an existing user theme', async () => {
    await themeCreate({ action: 'theme.create', name: 'sidebar' }, ctx)
    const result = await themeDelete({ action: 'theme.delete', name: 'sidebar' }, ctx)
    expect(result.success).toBe(true)

    const themes = await listThemes()
    expect(themes.some((t) => t.id === 'sidebar')).toBe(false)
  })

  it('fails for a theme that does not exist', async () => {
    const result = await themeDelete({ action: 'theme.delete', name: 'does-not-exist' }, ctx)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('refuses to delete a bundled theme', async () => {
    const result = await themeDelete({ action: 'theme.delete', name: 'default' }, ctx)
    expect(result.success).toBe(false)
  })
})

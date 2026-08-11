import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { themeCreate } from './create.js'
import { themeList } from './list.js'

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

describe('themeList action', () => {
  it('includes the bundled themes', async () => {
    const result = await themeList({ action: 'theme.list' }, ctx)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.count).toBe(2)
      expect(result.data.themes.some((t) => t.id === 'default' && t.source === 'bundled')).toBe(
        true
      )
      expect(result.data.themes.some((t) => t.id === 'cv' && t.source === 'bundled')).toBe(true)
    }
  })

  it('includes user themes created via themeCreate', async () => {
    await themeCreate({ action: 'theme.create', name: 'sidebar' }, ctx)
    const result = await themeList({ action: 'theme.list' }, ctx)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.count).toBe(3)
      expect(result.data.themes.some((t) => t.id === 'sidebar' && t.source === 'user')).toBe(true)
    }
  })
})

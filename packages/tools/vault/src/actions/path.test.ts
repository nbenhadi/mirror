import { describe, it, expect, vi, beforeEach } from 'vitest'
import { path } from './path.js'
import { ctx, TEST_KDF } from '../test-helpers.js'

vi.mock('../config.js', () => ({
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  vaultDirFromPath: vi.fn((p: string) => p.slice(0, p.lastIndexOf('/'))),
}))
vi.mock('../vault-file.js', () => ({ getVaultSaltAndKdf: vi.fn() }))
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
}))

import { loadConfig, saveConfig } from '../config.js'
import { getVaultSaltAndKdf } from '../vault-file.js'
import { existsSync, statSync, readdirSync } from 'node:fs'

const mockLoadConfig = vi.mocked(loadConfig)
const mockSaveConfig = vi.mocked(saveConfig)
const mockGetVaultSaltAndKdf = vi.mocked(getVaultSaltAndKdf)
const mockExistsSync = vi.mocked(existsSync)
const mockStatSync = vi.mocked(statSync)
const mockReaddirSync = vi.mocked(readdirSync)

const isFile = { isDirectory: () => false, isFile: () => true } as ReturnType<typeof statSync>
const isDir = { isDirectory: () => true, isFile: () => false } as ReturnType<typeof statSync>

beforeEach(() => {
  vi.clearAllMocks()
  mockSaveConfig.mockResolvedValue(undefined)
})

describe('path (get)', () => {
  it('returns current path when initialized', async () => {
    mockLoadConfig.mockResolvedValue({ vault: { path: '/vaults' } })
    const r = await path({ action: 'path' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.path).toBe('/vaults')
  })

  it('fails when not initialized', async () => {
    mockLoadConfig.mockResolvedValue({})
    const r = await path({ action: 'path' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })
})

describe('path (set)', () => {
  it('fails when newPath does not exist', async () => {
    mockLoadConfig.mockResolvedValue({})
    mockExistsSync.mockReturnValue(false)
    const r = await path({ action: 'path', newPath: '/nonexistent/vault.vault' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('accepts a directory containing a .vault file', async () => {
    mockLoadConfig.mockResolvedValue({})
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(isDir)
    mockReaddirSync.mockReturnValue(['vault.vault'] as unknown as ReturnType<typeof readdirSync>)
    const r = await path({ action: 'path', newPath: '/vaults' }, ctx)
    expect(r.success).toBe(true)
    expect(mockSaveConfig).toHaveBeenCalledOnce()
  })

  it('fails on directory with no .vault files', async () => {
    mockLoadConfig.mockResolvedValue({})
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(isDir)
    mockReaddirSync.mockReturnValue([] as unknown as ReturnType<typeof readdirSync>)
    const r = await path({ action: 'path', newPath: '/empty-dir' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('accepts a valid .vault file', async () => {
    mockLoadConfig.mockResolvedValue({})
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(isFile)
    mockGetVaultSaltAndKdf.mockResolvedValue({ salt: Buffer.alloc(16), kdf: TEST_KDF })
    const r = await path({ action: 'path', newPath: '/vaults/vault.vault' }, ctx)
    expect(r.success).toBe(true)
    expect(mockSaveConfig).toHaveBeenCalledOnce()
  })

  it('rejects an invalid vault file', async () => {
    mockLoadConfig.mockResolvedValue({})
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(isFile)
    mockGetVaultSaltAndKdf.mockRejectedValue(new Error('bad file'))
    const r = await path({ action: 'path', newPath: '/vaults/bad.vault' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('VALIDATION_ERROR')
  })
})

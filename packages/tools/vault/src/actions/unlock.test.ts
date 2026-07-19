import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unlock } from './unlock.js'
import { ctx, TEST_KDF } from '../test-helpers.js'

vi.mock('../config.js', () => ({ loadConfig: vi.fn() }))
vi.mock('../vault-file.js', () => ({ readVault: vi.fn(), getVaultSaltAndKdf: vi.fn() }))
vi.mock('../crypto.js', () => ({
  deriveKey: vi.fn(),
  DEFAULT_KDF: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
}))
vi.mock('../session.js', () => ({ saveSession: vi.fn() }))

import { loadConfig } from '../config.js'
import { readVault, getVaultSaltAndKdf } from '../vault-file.js'
import { deriveKey } from '../crypto.js'
import { saveSession } from '../session.js'

const mockLoadConfig = vi.mocked(loadConfig)
const mockReadVault = vi.mocked(readVault)
const mockGetVaultSaltAndKdf = vi.mocked(getVaultSaltAndKdf)
const mockDeriveKey = vi.mocked(deriveKey)
const mockSaveSession = vi.mocked(saveSession)

const INPUT = { action: 'unlock' as const, masterPassword: 'pass', minutes: 30 }

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadConfig.mockResolvedValue({ vault: { path: '/mock/vault.vault' } })
  mockGetVaultSaltAndKdf.mockResolvedValue({ salt: Buffer.alloc(16), kdf: TEST_KDF })
  mockDeriveKey.mockResolvedValue(Buffer.alloc(32))
  mockReadVault.mockResolvedValue({
    version: 1,
    entries: [],
    created_at: '',
    salt: '',
    kdf: TEST_KDF,
  })
  mockSaveSession.mockResolvedValue(undefined)
})

describe('unlock', () => {
  it('returns expiresAt on success', async () => {
    const r = await unlock(INPUT, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.expiresAt).toBeTruthy()
    expect(mockSaveSession).toHaveBeenCalledOnce()
  })

  it('fails when vault is not initialized', async () => {
    mockLoadConfig.mockResolvedValue({})
    const r = await unlock(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails when vault file not found', async () => {
    mockGetVaultSaltAndKdf.mockRejectedValue(new Error('ENOENT'))
    const r = await unlock(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails with wrong password', async () => {
    mockReadVault.mockRejectedValue(new Error('bad decrypt'))
    const r = await unlock(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

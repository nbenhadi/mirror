import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rekey } from './rekey.js'
import { ctx, mockSession, makeVault, TEST_KEY, TEST_PATH } from '../test-helpers.js'

vi.mock('../session.js', () => ({ loadSession: vi.fn(), clearSession: vi.fn() }))
vi.mock('../vault-file.js', () => ({ readVault: vi.fn(), writeVault: vi.fn() }))
vi.mock('../config.js', () => ({ loadConfig: vi.fn(), saveConfig: vi.fn() }))
vi.mock('../crypto.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../crypto.js')>()
  return { ...actual, deriveKey: vi.fn(), generateSalt: vi.fn() }
})

import { loadSession, clearSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'
import { loadConfig, saveConfig } from '../config.js'
import { deriveKey, generateSalt } from '../crypto.js'

const mockLoadSession = vi.mocked(loadSession)
const mockClearSession = vi.mocked(clearSession)
const mockReadVault = vi.mocked(readVault)
const mockWriteVault = vi.mocked(writeVault)
const mockLoadConfig = vi.mocked(loadConfig)
const mockSaveConfig = vi.mocked(saveConfig)
const mockDeriveKey = vi.mocked(deriveKey)
const mockGenerateSalt = vi.mocked(generateSalt)

const MOCK_SALT = Buffer.alloc(32, 1)
const NEW_SALT = Buffer.alloc(32, 2)
const NEW_KEY = Buffer.alloc(32, 9)
const mockConfig = {
  vault: {
    path: TEST_PATH,
    salt: MOCK_SALT.toString('base64'),
    kdf: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadSession.mockResolvedValue(mockSession)
  mockLoadConfig.mockResolvedValue(mockConfig)
  mockReadVault.mockResolvedValue(makeVault())
  mockWriteVault.mockResolvedValue(undefined)
  mockSaveConfig.mockResolvedValue(undefined)
  mockClearSession.mockResolvedValue(undefined)
  mockGenerateSalt.mockReturnValue(NEW_SALT)
  mockDeriveKey
    .mockResolvedValueOnce(Buffer.from(TEST_KEY, 'base64'))
    .mockResolvedValueOnce(NEW_KEY)
})

describe('rekey', () => {
  it('re-encrypts vault and clears session', async () => {
    const r = await rekey(
      { action: 'rekey', currentPassword: 'correct', newPassword: 'newpass123' },
      ctx
    )
    expect(r.success).toBe(true)
    expect(mockWriteVault).toHaveBeenCalledWith(TEST_PATH, expect.anything(), NEW_KEY)
    expect(mockClearSession).toHaveBeenCalledOnce()
  })

  it('updates config with new salt', async () => {
    await rekey({ action: 'rekey', currentPassword: 'correct', newPassword: 'newpass123' }, ctx)
    expect(mockSaveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        vault: expect.objectContaining({ salt: NEW_SALT.toString('base64') }),
      })
    )
  })

  it('rejects incorrect current password', async () => {
    mockDeriveKey.mockReset()
    mockDeriveKey.mockResolvedValue(Buffer.alloc(32, 99))
    const r = await rekey(
      { action: 'rekey', currentPassword: 'wrong', newPassword: 'newpass123' },
      ctx
    )
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
    expect(mockWriteVault).not.toHaveBeenCalled()
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await rekey({ action: 'rekey', currentPassword: 'x', newPassword: 'newpass123' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })

  it('fails when no vault initialized', async () => {
    mockLoadConfig.mockResolvedValue({})
    const r = await rekey({ action: 'rekey', currentPassword: 'x', newPassword: 'newpass123' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })
})

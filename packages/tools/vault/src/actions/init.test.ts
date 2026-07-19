import { describe, it, expect, vi, beforeEach } from 'vitest'
import { init } from './init.js'
import { ctx } from '../test-helpers.js'

vi.mock('../config.js', () => ({ loadConfig: vi.fn(), saveConfig: vi.fn() }))
vi.mock('../vault-file.js', () => ({ writeVault: vi.fn() }))
vi.mock('../crypto.js', () => ({
  deriveKey: vi.fn(),
  generateSalt: vi.fn(),
  DEFAULT_KDF: { memoryCost: 65536, timeCost: 3, parallelism: 4 },
}))

import { loadConfig, saveConfig } from '../config.js'
import { writeVault } from '../vault-file.js'
import { deriveKey, generateSalt } from '../crypto.js'

const mockLoadConfig = vi.mocked(loadConfig)
const mockSaveConfig = vi.mocked(saveConfig)
const mockWriteVault = vi.mocked(writeVault)
const mockDeriveKey = vi.mocked(deriveKey)
const mockGenerateSalt = vi.mocked(generateSalt)

const INPUT = { action: 'init' as const, masterPassword: 'pass', path: '/tmp/test.vault' }

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadConfig.mockResolvedValue({})
  mockSaveConfig.mockResolvedValue(undefined)
  mockWriteVault.mockResolvedValue(undefined)
  mockDeriveKey.mockResolvedValue(Buffer.alloc(32))
  mockGenerateSalt.mockReturnValue(Buffer.alloc(16))
})

describe('init', () => {
  it('creates vault and returns path', async () => {
    const r = await init(INPUT, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.path).toBe('/tmp/test.vault')
    expect(mockWriteVault).toHaveBeenCalledOnce()
    expect(mockSaveConfig).toHaveBeenCalledOnce()
  })

  it('fails when already initialized', async () => {
    mockLoadConfig.mockResolvedValue({ vault: { path: '/existing' } })
    const r = await init(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('fails when vault file already exists', async () => {
    mockWriteVault.mockRejectedValue(Object.assign(new Error('EEXIST'), { code: 'EEXIST' }))
    const r = await init(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('fails on unexpected write error', async () => {
    mockWriteVault.mockRejectedValue(new Error('disk full'))
    const r = await init(INPUT, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })
})

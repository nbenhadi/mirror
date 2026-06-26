import { buildContext } from '@nbenhadi/mirror-core'
import type { Entry, VaultData, KdfParams } from './types.js'

export const ctx = buildContext()
export const TEST_KEY = Buffer.alloc(32).toString('base64')
export const TEST_PATH = '/mock/vault.vault'
export const TEST_SALT = Buffer.alloc(16).toString('base64')
export const TEST_KDF: KdfParams = { memoryCost: 65536, timeCost: 3, parallelism: 4 }

export const mockSession = {
  key: TEST_KEY,
  expiry: Date.now() + 3_600_000,
  vaultPath: TEST_PATH,
}

export function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id-1',
    title: 'Test Entry',
    tags: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeVault(entries: Entry[] = []): VaultData {
  return {
    version: 1,
    entries,
    created_at: '2026-01-01T00:00:00.000Z',
    salt: TEST_SALT,
    kdf: TEST_KDF,
  }
}

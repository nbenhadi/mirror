import { describe, it, expect, vi, beforeEach } from 'vitest'
import { restore } from './restore.js'
import { ctx, mockSession, makeVault, makeEntry } from '../test-helpers.js'

vi.mock('../session.js', () => ({ loadSession: vi.fn() }))
vi.mock('../vault-file.js', () => ({ readVault: vi.fn(), writeVault: vi.fn() }))

import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'

const mockLoadSession = vi.mocked(loadSession)
const mockReadVault = vi.mocked(readVault)
const mockWriteVault = vi.mocked(writeVault)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadSession.mockResolvedValue(mockSession)
  mockWriteVault.mockResolvedValue(undefined)
})

describe('restore', () => {
  it('clears deleted_at on trashed entry', async () => {
    const vault = makeVault([
      makeEntry({ title: 'GitHub', deleted_at: '2026-01-01T00:00:00.000Z' }),
    ])
    mockReadVault.mockResolvedValue(vault)
    const r = await restore({ action: 'restore', title: 'GitHub' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries[0]!.deleted_at).toBeUndefined()
  })

  it('returns NOT_FOUND when entry not in trash', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub' })]))
    const r = await restore({ action: 'restore', title: 'GitHub' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('returns NOT_FOUND for unknown entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await restore({ action: 'restore', title: 'Missing' }, ctx)
    expect(r.success).toBe(false)
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await restore({ action: 'restore', title: 'GitHub' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

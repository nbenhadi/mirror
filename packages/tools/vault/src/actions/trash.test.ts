import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trash } from './trash.js'
import { ctx, mockSession, makeVault, makeEntry } from '../test-helpers.js'

vi.mock('../session.js', () => ({ loadSession: vi.fn() }))
vi.mock('../vault-file.js', () => ({ readVault: vi.fn() }))

import { loadSession } from '../session.js'
import { readVault } from '../vault-file.js'

const mockLoadSession = vi.mocked(loadSession)
const mockReadVault = vi.mocked(readVault)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadSession.mockResolvedValue(mockSession)
})

describe('trash', () => {
  it('returns empty list when no deleted entries', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry()]))
    const r = await trash({ action: 'trash' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(0)
  })

  it('returns only deleted entries', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'Active' }),
        makeEntry({ id: '2', title: 'Deleted', deleted_at: '2026-01-01T00:00:00.000Z' }),
      ])
    )
    const r = await trash({ action: 'trash' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.count).toBe(1)
      expect(r.data.entries[0]?.title).toBe('Deleted')
    }
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await trash({ action: 'trash' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

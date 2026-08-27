import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tagDelete } from './delete.js'
import { ctx, mockSession, makeVault, makeEntry } from '../../test-helpers.js'

vi.mock('../../session.js', () => ({ loadSession: vi.fn() }))
vi.mock('../../vault-file.js', () => ({ readVault: vi.fn(), writeVault: vi.fn() }))

import { loadSession } from '../../session.js'
import { readVault, writeVault } from '../../vault-file.js'

const mockLoadSession = vi.mocked(loadSession)
const mockReadVault = vi.mocked(readVault)
const mockWriteVault = vi.mocked(writeVault)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadSession.mockResolvedValue(mockSession)
  mockWriteVault.mockResolvedValue(undefined)
})

describe('tag delete', () => {
  it('removes the tag from the registry', async () => {
    const vault = makeVault([], ['work'])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagDelete({ action: 'tag.delete', name: 'work' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.tags).toEqual([])
  })

  it('untags every entry that used it', async () => {
    const vault = makeVault([
      makeEntry({ id: '1', title: 'A', tags: ['work', 'urgent'] }),
      makeEntry({ id: '2', title: 'B', tags: ['personal'] }),
    ])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagDelete({ action: 'tag.delete', name: 'work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.entriesUpdated).toBe(1)
    expect(vault.entries[0]!.tags).toEqual(['urgent'])
    expect(vault.entries[1]!.tags).toEqual(['personal'])
  })

  it('returns NOT_FOUND for missing tag', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await tagDelete({ action: 'tag.delete', name: 'missing' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await tagDelete({ action: 'tag.delete', name: 'work' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

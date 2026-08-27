import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tagEdit } from './edit.js'
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

describe('tag edit', () => {
  it('renames the tag in the registry', async () => {
    const vault = makeVault([], ['work'])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'job' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.tags).toEqual(['job'])
  })

  it('propagates rename to every entry using the tag', async () => {
    const vault = makeVault([
      makeEntry({ id: '1', title: 'A', tags: ['work'] }),
      makeEntry({ id: '2', title: 'B', tags: ['work', 'urgent'] }),
      makeEntry({ id: '3', title: 'C', tags: ['personal'] }),
    ])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'job' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.entriesUpdated).toBe(2)
    expect(vault.entries[0]!.tags).toEqual(['job'])
    expect(vault.entries[1]!.tags).toEqual(['urgent', 'job'])
    expect(vault.entries[2]!.tags).toEqual(['personal'])
  })

  it('merges instead of duplicating when the entry already has the new name', async () => {
    const vault = makeVault([makeEntry({ title: 'A', tags: ['work', 'job'] })])
    mockReadVault.mockResolvedValue(vault)
    await tagEdit({ action: 'tag.edit', name: 'work', newName: 'job' }, ctx)
    expect(vault.entries[0]!.tags).toEqual(['job'])
  })

  it('is case-insensitive when finding the current tag', async () => {
    const vault = makeVault([makeEntry({ title: 'A', tags: ['Work'] })])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'job' }, ctx)
    expect(r.success).toBe(true)
  })

  it('merges into an existing tag when renaming onto its name', async () => {
    const vault = makeVault(
      [
        makeEntry({ id: '1', title: 'A', tags: ['work'] }),
        makeEntry({ id: '2', title: 'B', tags: ['personal'] }),
      ],
      ['work', 'personal']
    )
    mockReadVault.mockResolvedValue(vault)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'personal' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.entriesUpdated).toBe(1)
    expect(vault.tags).toEqual(['personal'])
    expect(vault.entries[0]!.tags).toEqual(['personal'])
    expect(vault.entries[1]!.tags).toEqual(['personal'])
  })

  it('uses the existing tag casing as the merge target', async () => {
    const vault = makeVault([makeEntry({ title: 'A', tags: ['work'] })], ['work', 'Personal'])
    mockReadVault.mockResolvedValue(vault)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'personal' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe('Personal')
  })

  it('returns NOT_FOUND for missing tag', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await tagEdit({ action: 'tag.edit', name: 'missing', newName: 'job' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await tagEdit({ action: 'tag.edit', name: 'work', newName: 'job' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

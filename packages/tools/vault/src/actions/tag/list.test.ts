import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tagList } from './list.js'
import { ctx, mockSession, makeVault, makeEntry } from '../../test-helpers.js'

vi.mock('../../session.js', () => ({ loadSession: vi.fn() }))
vi.mock('../../vault-file.js', () => ({ readVault: vi.fn() }))

import { loadSession } from '../../session.js'
import { readVault } from '../../vault-file.js'

const mockLoadSession = vi.mocked(loadSession)
const mockReadVault = vi.mocked(readVault)

beforeEach(() => {
  vi.clearAllMocks()
  mockLoadSession.mockResolvedValue(mockSession)
})

describe('tag list', () => {
  it('lists registry tags with zero entries', async () => {
    mockReadVault.mockResolvedValue(makeVault([], ['work']))
    const r = await tagList({ action: 'tag.list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tags).toEqual([{ name: 'work', count: 0 }])
  })

  it('counts entries using each tag', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ id: '1', title: 'A', tags: ['work'] }),
        makeEntry({ id: '2', title: 'B', tags: ['work', 'urgent'] }),
      ])
    )
    const r = await tagList({ action: 'tag.list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.tags).toEqual([
        { name: 'urgent', count: 1 },
        { name: 'work', count: 2 },
      ])
    }
  })

  it('merges registry tags and entry-only tags without duplicates', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'A', tags: ['Work'] })], ['work'])
    )
    const r = await tagList({ action: 'tag.list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })

  it('excludes deleted entries from counts', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'A', tags: ['work'], deleted_at: '2026-01-01T00:00:00.000Z' })])
    )
    const r = await tagList({ action: 'tag.list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.tags).toEqual([{ name: 'work', count: 0 }])
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await tagList({ action: 'tag.list' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { list } from './list.js'
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

describe('list', () => {
  it('returns all active entries', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'A' }), makeEntry({ id: '2', title: 'B' })])
    )
    const r = await list({ action: 'list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(2)
  })

  it('excludes deleted entries', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'Active' }),
        makeEntry({ id: '2', title: 'Deleted', deleted_at: '2026-01-01T00:00:00.000Z' }),
      ])
    )
    const r = await list({ action: 'list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })

  it('returns empty list when vault is empty', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await list({ action: 'list' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(0)
  })
})

describe('list --search', () => {
  it('filters by title substring', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'GitHub' }),
        makeEntry({ id: '2', title: 'GitLab' }),
        makeEntry({ id: '3', title: 'Amazon' }),
      ])
    )
    const r = await list({ action: 'list', search: 'git' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(2)
  })

  it('searches in username', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'Work', username: 'john@company.com' }),
        makeEntry({ id: '2', title: 'Personal', username: 'john@gmail.com' }),
      ])
    )
    const r = await list({ action: 'list', search: 'company' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })

  it('searches in url', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'GitHub', url: 'https://github.com' }),
        makeEntry({ id: '2', title: 'Other' }),
      ])
    )
    const r = await list({ action: 'list', search: 'github.com' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })
})

describe('list --tag', () => {
  it('filters by exact tag', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'A', tags: ['work'] }),
        makeEntry({ id: '2', title: 'B', tags: ['personal'] }),
        makeEntry({ id: '3', title: 'C', tags: ['work', 'important'] }),
      ])
    )
    const r = await list({ action: 'list', tag: 'work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(2)
  })

  it('tag filter is case-insensitive', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'A', tags: ['Work'] })]))
    const r = await list({ action: 'list', tag: 'work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })

  it('combines search and tag', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([
        makeEntry({ title: 'GitHub', tags: ['work'] }),
        makeEntry({ id: '2', title: 'GitLab', tags: ['personal'] }),
        makeEntry({ id: '3', title: 'Amazon', tags: ['work'] }),
      ])
    )
    const r = await list({ action: 'list', search: 'git', tag: 'work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(1)
  })
})

describe('list locked', () => {
  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await list({ action: 'list' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { purge } from './purge.js'
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

describe('purge <title>', () => {
  it('removes trashed entry permanently', async () => {
    const vault = makeVault([
      makeEntry({ title: 'GitHub', deleted_at: '2026-01-01T00:00:00.000Z' }),
    ])
    mockReadVault.mockResolvedValue(vault)
    const r = await purge({ action: 'purge', title: 'GitHub' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries).toHaveLength(0)
  })

  it('returns NOT_FOUND when entry not in trash', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub' })]))
    const r = await purge({ action: 'purge', title: 'GitHub' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('returns NOT_FOUND for unknown entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await purge({ action: 'purge', title: 'Missing' }, ctx)
    expect(r.success).toBe(false)
  })
})

describe('purge all', () => {
  it('removes all trashed entries', async () => {
    const vault = makeVault([
      makeEntry({ title: 'Active' }),
      makeEntry({ id: '2', title: 'Deleted1', deleted_at: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ id: '3', title: 'Deleted2', deleted_at: '2026-01-01T00:00:00.000Z' }),
    ])
    mockReadVault.mockResolvedValue(vault)
    const r = await purge({ action: 'purge' }, ctx)
    expect(r.success).toBe(true)
    if (r.success && 'count' in r.data) expect(r.data.count).toBe(2)
    expect(vault.entries).toHaveLength(1)
  })

  it('returns count 0 when trash is empty', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'Active' })]))
    const r = await purge({ action: 'purge' }, ctx)
    expect(r.success).toBe(true)
    if (r.success && 'count' in r.data) expect(r.data.count).toBe(0)
    expect(mockWriteVault).not.toHaveBeenCalled()
  })
})

describe('purge locked', () => {
  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await purge({ action: 'purge' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

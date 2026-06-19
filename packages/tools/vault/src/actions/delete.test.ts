import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteEntry } from './delete.js'
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

describe('delete (soft)', () => {
  it('sets deleted_at on entry', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub' })])
    mockReadVault.mockResolvedValue(vault)
    const r = await deleteEntry({ action: 'delete', title: 'GitHub', force: false }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries[0]!.deleted_at).toBeTruthy()
    if (r.success) expect(r.data.permanent).toBe(false)
  })

  it('returns NOT_FOUND for missing entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await deleteEntry({ action: 'delete', title: 'Missing', force: false }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('does not delete already-trashed entries', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'GitHub', deleted_at: '2026-01-01T00:00:00.000Z' })])
    )
    const r = await deleteEntry({ action: 'delete', title: 'GitHub', force: false }, ctx)
    expect(r.success).toBe(false)
  })
})

describe('delete --force', () => {
  it('removes entry completely', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub' })])
    mockReadVault.mockResolvedValue(vault)
    const r = await deleteEntry({ action: 'delete', title: 'GitHub', force: true }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries).toHaveLength(0)
    if (r.success) expect(r.data.permanent).toBe(true)
  })
})

describe('delete locked', () => {
  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await deleteEntry({ action: 'delete', title: 'GitHub', force: false }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

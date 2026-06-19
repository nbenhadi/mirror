import { describe, it, expect, vi, beforeEach } from 'vitest'
import { add } from './add.js'
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

describe('add', () => {
  it('adds entry and returns id', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await add({ action: 'add', title: 'GitHub', tags: [] }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.id).toBeTruthy()
    expect(mockWriteVault).toHaveBeenCalledOnce()
  })

  it('adds entry with all optional fields', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await add(
      {
        action: 'add',
        title: 'GitHub',
        password: 'secret',
        username: 'user@mail.com',
        url: 'https://github.com',
        notes: 'my notes',
        tags: ['work'],
      },
      ctx
    )
    expect(r.success).toBe(true)
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await add({ action: 'add', title: 'GitHub', tags: [] }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })

  it('fails on duplicate title', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub' })]))
    const r = await add({ action: 'add', title: 'GitHub', tags: [] }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('duplicate check is case-insensitive', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'github' })]))
    const r = await add({ action: 'add', title: 'GitHub', tags: [] }, ctx)
    expect(r.success).toBe(false)
  })

  it('does not count deleted entries as duplicates', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'GitHub', deleted_at: '2026-01-01T00:00:00.000Z' })])
    )
    const r = await add({ action: 'add', title: 'GitHub', tags: [] }, ctx)
    expect(r.success).toBe(true)
  })
})

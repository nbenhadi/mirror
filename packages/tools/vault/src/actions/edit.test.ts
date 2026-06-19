import { describe, it, expect, vi, beforeEach } from 'vitest'
import { edit } from './edit.js'
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

describe('edit', () => {
  it('updates password', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', password: 'old' })])
    mockReadVault.mockResolvedValue(vault)
    const r = await edit({ action: 'edit', title: 'GitHub', password: 'new' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries[0]!.password).toBe('new')
  })

  it('renames entry with newTitle', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub' })])
    mockReadVault.mockResolvedValue(vault)
    const r = await edit({ action: 'edit', title: 'GitHub', newTitle: 'GitHub Work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('GitHub Work')
  })

  it('fails rename when newTitle already exists', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ id: '1', title: 'GitHub' }), makeEntry({ id: '2', title: 'GitLab' })])
    )
    const r = await edit({ action: 'edit', title: 'GitHub', newTitle: 'GitLab' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('updates only provided fields', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', password: 'keep', username: 'keep' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', title: 'GitHub', password: 'new' }, ctx)
    expect(vault.entries[0]!.username).toBe('keep')
  })

  it('updates updated_at timestamp', async () => {
    const vault = makeVault([
      makeEntry({ title: 'GitHub', updated_at: '2020-01-01T00:00:00.000Z' }),
    ])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', title: 'GitHub', password: 'new' }, ctx)
    expect(vault.entries[0]!.updated_at).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('returns NOT_FOUND for missing entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await edit({ action: 'edit', title: 'Missing', password: 'x' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await edit({ action: 'edit', title: 'GitHub', password: 'x' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

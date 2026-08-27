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
    const r = await edit({ action: 'edit', entry: 'GitHub', password: 'new' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.entries[0]!.password).toBe('new')
  })

  it('renames entry with title', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub' })])
    mockReadVault.mockResolvedValue(vault)
    const r = await edit({ action: 'edit', entry: 'GitHub', title: 'GitHub Work' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('GitHub Work')
  })

  it('fails rename when title already exists', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ id: '1', title: 'GitHub' }), makeEntry({ id: '2', title: 'GitLab' })])
    )
    const r = await edit({ action: 'edit', entry: 'GitHub', title: 'GitLab' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('updates only provided fields', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', password: 'keep', username: 'keep' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', password: 'new' }, ctx)
    expect(vault.entries[0]!.username).toBe('keep')
  })

  it('updates updated_at timestamp', async () => {
    const vault = makeVault([
      makeEntry({ title: 'GitHub', updated_at: '2020-01-01T00:00:00.000Z' }),
    ])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', password: 'new' }, ctx)
    expect(vault.entries[0]!.updated_at).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('returns NOT_FOUND for missing entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await edit({ action: 'edit', entry: 'Missing', password: 'x' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await edit({ action: 'edit', entry: 'GitHub', password: 'x' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

describe('edit clear semantics', () => {
  it('leaves username untouched when omitted', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', username: 'keep' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub' }, ctx)
    expect(vault.entries[0]!.username).toBe('keep')
  })

  it('clears username when set to empty string', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', username: 'old' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', username: '' }, ctx)
    expect(vault.entries[0]!.username).toBeUndefined()
  })

  it('clears password when set to empty string', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', password: 'old' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', password: '' }, ctx)
    expect(vault.entries[0]!.password).toBeUndefined()
  })

  it('clears url when set to empty string', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', url: 'https://old.com' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', url: '' }, ctx)
    expect(vault.entries[0]!.url).toBeUndefined()
  })

  it('clears notes when set to empty string', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', notes: 'old' })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', notes: '' }, ctx)
    expect(vault.entries[0]!.notes).toBeUndefined()
  })
})

describe('edit tags', () => {
  it('reuses registry casing for a known tag', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', tags: [] })], ['Work'])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', tags: ['work'] }, ctx)
    expect(vault.entries[0]!.tags).toEqual(['Work'])
  })

  it('fails with NOT_FOUND when a tag does not exist yet', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', tags: [] })], ['Work'])
    mockReadVault.mockResolvedValue(vault)
    const r = await edit({ action: 'edit', entry: 'GitHub', tags: ['work', 'new-tag'] }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
    expect(vault.entries[0]!.tags).toEqual([])
    expect(vault.tags).toEqual(['Work'])
  })

  it('clears all tags when given an empty array', async () => {
    const vault = makeVault([makeEntry({ title: 'GitHub', tags: ['work'] })])
    mockReadVault.mockResolvedValue(vault)
    await edit({ action: 'edit', entry: 'GitHub', tags: [] }, ctx)
    expect(vault.entries[0]!.tags).toEqual([])
  })
})

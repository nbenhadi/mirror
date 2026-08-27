import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tagAdd } from './add.js'
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

describe('tag add', () => {
  it('adds a new tag to the registry', async () => {
    const vault = makeVault()
    mockReadVault.mockResolvedValue(vault)
    const r = await tagAdd({ action: 'tag.add', name: 'work' }, ctx)
    expect(r.success).toBe(true)
    expect(vault.tags).toEqual(['work'])
  })

  it('fails when tag already exists in the registry', async () => {
    mockReadVault.mockResolvedValue(makeVault([], ['work']))
    const r = await tagAdd({ action: 'tag.add', name: 'Work' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('EXECUTION_ERROR')
  })

  it('fails when tag already used by an entry but not in registry', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub', tags: ['work'] })]))
    const r = await tagAdd({ action: 'tag.add', name: 'work' }, ctx)
    expect(r.success).toBe(false)
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await tagAdd({ action: 'tag.add', name: 'work' }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

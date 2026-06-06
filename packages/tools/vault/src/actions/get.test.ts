import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from './get.js'
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

describe('get', () => {
  it('returns entry data', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub' })]))
    const r = await get({ action: 'get', title: 'GitHub', showPassword: false }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('GitHub')
  })

  it('masks password when showPassword is false', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub', password: 'secret' })]))
    const r = await get({ action: 'get', title: 'GitHub', showPassword: false }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toBe('••••••••')
  })

  it('returns real password when showPassword is true', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub', password: 'secret' })]))
    const r = await get({ action: 'get', title: 'GitHub', showPassword: true }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toBe('secret')
  })

  it('omits password field when entry has none', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'GitHub' })]))
    const r = await get({ action: 'get', title: 'GitHub', showPassword: true }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toBeUndefined()
  })

  it('is case-insensitive', async () => {
    mockReadVault.mockResolvedValue(makeVault([makeEntry({ title: 'github' })]))
    const r = await get({ action: 'get', title: 'GitHub', showPassword: false }, ctx)
    expect(r.success).toBe(true)
  })

  it('returns NOT_FOUND for missing entry', async () => {
    mockReadVault.mockResolvedValue(makeVault())
    const r = await get({ action: 'get', title: 'Missing', showPassword: false }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('does not return deleted entries', async () => {
    mockReadVault.mockResolvedValue(
      makeVault([makeEntry({ title: 'GitHub', deleted_at: '2026-01-01T00:00:00.000Z' })])
    )
    const r = await get({ action: 'get', title: 'GitHub', showPassword: false }, ctx)
    expect(r.success).toBe(false)
  })

  it('fails when vault is locked', async () => {
    mockLoadSession.mockResolvedValue(null)
    const r = await get({ action: 'get', title: 'GitHub', showPassword: false }, ctx)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('UNAUTHORIZED')
  })
})

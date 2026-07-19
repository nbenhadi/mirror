import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lock } from './lock.js'
import { ctx } from '../test-helpers.js'

vi.mock('../session.js', () => ({ clearSession: vi.fn() }))

import { clearSession } from '../session.js'

const mockClearSession = vi.mocked(clearSession)

beforeEach(() => {
  vi.clearAllMocks()
  mockClearSession.mockResolvedValue(undefined)
})

describe('lock', () => {
  it('clears session and returns locked', async () => {
    const r = await lock({ action: 'lock' }, ctx)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.locked).toBe(true)
    expect(mockClearSession).toHaveBeenCalledOnce()
  })
})

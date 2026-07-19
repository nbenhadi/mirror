import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import type { Tool, ToolResult } from './types.js'

vi.mock('./registry.js', () => ({
  registry: { get: vi.fn() },
  ToolRegistry: vi.fn(),
}))

import { execute } from './engine.js'
import { registry } from './registry.js'

const mockGet = vi.mocked(registry.get)

const makeTool = (result: ToolResult<unknown>): Tool => ({
  id: 'test',
  description: 'test',
  schema: z.object({ value: z.string() }),
  execute: async () => result,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('execute', () => {
  it('returns NOT_FOUND when tool not in registry', async () => {
    mockGet.mockReturnValue(undefined)
    const r = await execute({ toolId: 'ghost', input: {} })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('returns VALIDATION_ERROR on invalid input', async () => {
    mockGet.mockReturnValue(makeTool({ success: true, data: null }))
    const r = await execute({ toolId: 'test', input: { value: 123 } })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns tool result on success', async () => {
    mockGet.mockReturnValue(makeTool({ success: true, data: { ok: true } }))
    const r = await execute({ toolId: 'test', input: { value: 'hello' } })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ ok: true })
  })

  it('returns EXECUTION_ERROR when tool throws', async () => {
    const throwing: Tool = {
      id: 'bad',
      description: 'bad',
      schema: z.object({ value: z.string() }),
      execute: async () => {
        throw new Error('boom')
      },
    }
    mockGet.mockReturnValue(throwing)
    const r = await execute({ toolId: 'bad', input: { value: 'x' } })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.code).toBe('EXECUTION_ERROR')
      expect(r.error.details).toBe('boom')
    }
  })
})

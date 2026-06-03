import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { ToolRegistry } from './registry.js'
import { buildContext } from './context.js'
import type { Tool, ToolResult } from './types.js'

const ctx = buildContext()

const makeTool = (id: string, result: ToolResult<unknown>): Tool => ({
  id,
  description: id,
  schema: z.object({ value: z.string() }),
  execute: async () => result,
})

async function runEngine(
  registry: ToolRegistry,
  toolId: string,
  input: unknown
): Promise<ToolResult<unknown>> {
  let tool
  try {
    tool = registry.get(toolId)
  } catch {
    return { success: false, error: { code: 'NOT_FOUND', message: `Tool "${toolId}" not found` } }
  }

  const parsed = tool.schema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.message,
        details: parsed.error.flatten(),
      },
    }
  }

  try {
    return await tool.execute(parsed.data, ctx)
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}

describe('engine', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('returns NOT_FOUND for unknown tool', async () => {
    const result = await runEngine(registry, 'ghost', {})
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('returns VALIDATION_ERROR for invalid input', async () => {
    registry.register(makeTool('t', { success: true, data: null }))
    const result = await runEngine(registry, 't', { value: 123 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns tool result on success', async () => {
    registry.register(makeTool('t', { success: true, data: { ok: true } }))
    const result = await runEngine(registry, 't', { value: 'hello' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ ok: true })
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
    registry.register(throwing)
    const result = await runEngine(registry, 'bad', { value: 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('EXECUTION_ERROR')
      expect(result.error.message).toBe('boom')
    }
  })
})

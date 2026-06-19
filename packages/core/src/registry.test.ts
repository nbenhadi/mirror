import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { ToolRegistry } from './registry.js'
import type { Tool, ToolResult } from './types.js'

const makeTool = (id: string): Tool => ({
  id,
  description: `Tool ${id}`,
  schema: z.object({}),
  execute: async (): Promise<ToolResult<null>> => ({ success: true, data: null }),
})

describe('ToolRegistry', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('registers and retrieves a tool', () => {
    const tool = makeTool('my-tool')
    registry.register(tool)
    expect(registry.get('my-tool')).toBe(tool)
  })

  it('throws on duplicate registration', () => {
    registry.register(makeTool('dup'))
    expect(() => registry.register(makeTool('dup'))).toThrow('already registered')
  })

  it('throws when tool not found', () => {
    expect(() => registry.get('ghost')).toThrow('not found in registry')
  })

  it('lists all registered tools', () => {
    registry.register(makeTool('a'))
    registry.register(makeTool('b'))
    expect(registry.list()).toHaveLength(2)
  })

  it('has() returns correct boolean', () => {
    registry.register(makeTool('x'))
    expect(registry.has('x')).toBe(true)
    expect(registry.has('y')).toBe(false)
  })
})

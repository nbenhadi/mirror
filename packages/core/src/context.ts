import { randomUUID } from 'node:crypto'
import { createLogger } from '@nbenhadi/mirror-logger'
import type { ToolContext } from './types.js'

export function buildContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    requestId: randomUUID(),
    permissions: [],
    logger: createLogger(),
    ...overrides,
  }
}

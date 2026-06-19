import { registry } from './registry.js'
import { buildContext } from './context.js'
import type { ToolContext, ToolResult } from './types.js'

interface ExecuteOptions {
  toolId: string
  input: unknown
  contextOverrides?: Partial<ToolContext>
}

export async function execute<T = unknown>(options: ExecuteOptions): Promise<ToolResult<T>> {
  const { toolId, input, contextOverrides } = options
  const ctx = buildContext(contextOverrides)

  let tool
  try {
    tool = registry.get(toolId)
  } catch {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Tool "${toolId}" not found` },
    }
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
    return (await tool.execute(parsed.data, ctx)) as ToolResult<T>
  } catch (err) {
    ctx.logger.error({ err, toolId }, 'Unhandled tool execution error')
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}

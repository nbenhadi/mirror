import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ThemeCreateInput } from '../../schema.js'
import { createTheme } from '../../engine/themes.js'

export interface ThemeCreateResult {
  id: string
  cssPath: string
}

export async function themeCreate(
  input: ThemeCreateInput,
  _ctx: ToolContext
): Promise<ToolResult<ThemeCreateResult>> {
  const created = await createTheme(input.name, input.description ?? '')
  if (!created) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: 'cmd.md.error.theme_exists',
        params: { name: input.name },
      },
    }
  }

  return { success: true, data: { id: input.name, cssPath: created.cssPath } }
}

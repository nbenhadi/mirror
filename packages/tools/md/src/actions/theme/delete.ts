import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ThemeDeleteInput } from '../../schema.js'
import { deleteTheme } from '../../engine/themes.js'

export interface ThemeDeleteResult {
  id: string
}

export async function themeDelete(
  input: ThemeDeleteInput,
  _ctx: ToolContext
): Promise<ToolResult<ThemeDeleteResult>> {
  const deleted = await deleteTheme(input.kind, input.name)
  if (!deleted) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'cmd.md.theme.error.not_found',
        params: { name: input.name },
      },
    }
  }

  return { success: true, data: { id: input.name } }
}
